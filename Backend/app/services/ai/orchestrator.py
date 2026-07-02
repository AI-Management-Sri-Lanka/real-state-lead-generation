import asyncio
import logging
import re
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.params import SCRAPING_LIMIT
from app.schemas.orchestrator_schema import OrchestratorResponse
from app.schemas.lead_schema import ScrapedLead
from app.schemas.router_schema import RouterOutput
from app.services.ai.router import Router
from app.services.ai.simple_chat import DirectChatTool
from app.services.ai.rank_leads import RankLeads
from app.services.apify.apify_scraper import run_scraper


logger = logging.getLogger(__name__)


class Orchestrator:
    def __init__(self) -> None:
        self.router = Router()
        self.chat_tool = DirectChatTool()

    async def handle_user_query(
        self,
        user_query: str,
        session_id: str | None = None,
        db: AsyncSession | None = None,
    ) -> OrchestratorResponse:

        # Route
        route_result: RouterOutput = await self.router.chat(
            user_query=user_query,
            session_id=session_id,
            db=db,
        )
        logger.info("Router decision — lead_search=%s, simple_chat=%s",
                     route_result.lead_search, route_result.simple_chat)

        # Lead Search
        if route_result.lead_search:
            return await self._handle_lead_search(
                user_query=user_query,
                route_result=route_result
            )

        # Simple Chat
        return await self._handle_simple_chat(
            user_query=user_query,
            session_id=session_id,
            db=db,
        )

    async def _handle_simple_chat(
        self,
        user_query: str,
        session_id: str | None = None,
        db: AsyncSession | None = None,
    ) -> OrchestratorResponse:

        message = await self.chat_tool.chat(
            user_query=user_query,
            session_id=session_id,
            db=db,
        )
        return OrchestratorResponse(
            message=message,
            leads=[],
            route="simple_chat",
        )

    async def _handle_lead_search(
        self,
        user_query: str,
        route_result: RouterOutput,
    ) -> OrchestratorResponse:

        hashtags = self._build_hashtags(route_result)
        keywords = list(hashtags)

        scraper_input = {
            "facebook": True,
            "instagram": True,
            "tiktok": True,
            "hashtags": hashtags,
            "keywords": keywords,
            "limit": SCRAPING_LIMIT,
        }

        logger.info("Scraper input: %s", scraper_input)

        # Social Media Scrape
        scraped_leads: List[ScrapedLead] = run_scraper(scraper_input)

        # Rank leads
        ranked_leads: List[ScrapedLead] = RankLeads().rank_leads(query=user_query, leads=scraped_leads)

        message = self._format_leads_as_markdown(ranked_leads)

        return OrchestratorResponse(
            message=message,
            leads=ranked_leads,
            route="lead_search"
        )

    @staticmethod
    def _format_leads_as_markdown(leads: List[ScrapedLead]) -> str:
        """Serialise lead results as a markdown string for DB persistence."""
        if not leads:
            return (
                "I searched social media but couldn't find any matching leads "
                "right now. Try broadening your search criteria."
            )

        lines: list[str] = [
            f"## Found {len(leads)} Potential Lead{'s' if len(leads) != 1 else ''}",
            "",
        ]

        for i, lead in enumerate(leads, start=1):
            handle = lead.userId or lead.name or "Unknown"
            platform = lead.platform.value.capitalize()

            lines.append(f"### {i}. @{handle} &middot; {platform}")
            lines.append("")

            if lead.name and lead.name != lead.userId:
                lines.append(f"- **Name:** {lead.name}")

            prop_value = lead.property_type.value if lead.property_type else "unknown"
            if prop_value != "unknown":
                lines.append(f"- **Property type:** {prop_value.capitalize()}")

            if lead.location and str(lead.location).lower() not in ("null", "none", ""):
                lines.append(f"- **Location:** {lead.location}")

            if lead.date:
                try:
                    date_str = lead.date.strftime("%d %b %Y")
                    lines.append(f"- **Posted:** {date_str}")
                except Exception:
                    pass

            if lead.description:
                raw = lead.description.strip()
                clean = re.sub(r"(\s#\w+)+$", "", raw).strip()
                if not clean:
                    clean = raw
                if len(clean) > 200:
                    clean = clean[:200].rstrip() + "..."
                lines.append("")
                lines.append(f"> {clean}")

            if lead.post_link:
                lines.append("")
                lines.append(f"[View post]({lead.post_link})")

            lines.append("")
            lines.append("---")
            lines.append("")

        return "\n".join(lines)


    @staticmethod
    def _build_hashtags(route_result: RouterOutput) -> list[str]:
        tags: list[str] = ["realestate"]

        if route_result.property_type:
            tag = route_result.property_type.lower().replace(" ", "")
            if tag not in tags:
                tags.append(tag)

        if route_result.preferred_location:
            tag = route_result.preferred_location.lower().replace(" ", "")
            if tag not in tags:
                tags.append(tag)

        if route_result.investment_preferences:
            tag = route_result.investment_preferences.lower().replace(" ", "")
            if tag not in tags:
                tags.append(tag)

        return tags


if __name__ == "__main__":
    print(asyncio.run(Orchestrator().handle_user_query(user_query="find leads searching for apartments in Colombo")))
