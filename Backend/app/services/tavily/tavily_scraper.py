import asyncio
import os
import json
from typing import List, Optional
import logging
from tavily import TavilyClient
from langchain_core.prompts import ChatPromptTemplate
from app.schemas.lead_schema import ScrapedLead, Platform
from app.core.llm_provider import get_llm

logger = logging.getLogger(__name__)

SITES = ["instagram.com", "facebook.com", "tiktok.com"]

class TavilySearchScraper:
    platform_name = "google"

    def __init__(self, max_results: int = 20):
        self.max_results = max_results
        api_key = os.getenv("TAVILY_API_KEY", "")
        if not api_key:
            logger.warning(
                "[google] TAVILY_API_KEY is not set in .env — "
                "Search calls will fail without it."
            )
        self.client = TavilyClient(api_key=api_key) if api_key else None

    async def run(self, structured_query: dict) -> list[dict]:
        if not self.client:
            return []

        location = (structured_query.get("location") or "").strip()
        ptype = structured_query.get("property_type") or "property"
        bedrooms = structured_query.get("bedrooms")
        bedroom_str = f"{bedrooms} bedroom " if bedrooms else ""
       
        # Fold any extra keywords/hashtags into the search terms 
        extra_terms = (structured_query.get("extra_terms") or "").strip()

        # Quote the location as an exact phrase so Tavily treats it as a
        # strict match rather than loosely-related terms.
        location_term = f'"{location}"' if location else ""
        base_terms = f"{bedroom_str}{ptype} {location_term} {extra_terms}".strip()

        per_site_limit = max(1, self.max_results // len(SITES))
        location_lower = location.lower()

        results = []
        for site in SITES:
            query = f"{base_terms} site:{site}"
            logger.info(f"[google] Tavily query: {query}")
            try:
                loop = asyncio.get_running_loop()
                response = await loop.run_in_executor(
                    None,
                    lambda q=query: self.client.search(
                        query=q, max_results=per_site_limit
                    ),
                )
            except Exception as e:
                logger.warning(f"[google] Tavily search failed for site:{site}: {e}")
                continue

            for item in response.get("results", []):
                raw_text = f"{item.get('title', '')}\n{item.get('content', '')}".strip()

                # Enforce the exact location
                if location_lower and location_lower not in raw_text.lower():
                    logger.info(
                        f"[google] dropping result not matching location "
                        f"'{location}': {item.get('url')}"
                    )
                    continue

                results.append({
                    "platform": self.platform_name,
                    "post_link": item.get("url"),
                    "raw_text": raw_text,
                    "author_handle": None,
                    "author_name": item.get("title"),
                    "raw_date": item.get("published_date"),
                })

        return results

async def extract_post_data(raw_post: dict) -> Optional[ScrapedLead]:
    llm = get_llm()
    system_prompt = """You normalize scraped social media posts about property/real estate into a fixed schema.
If a field isn't present in the source data, leave it null/empty. Never invent an email, phone number, link, or date that isn't in the source.

IMPORTANT: usernames, dates, emails, and phone numbers are often embedded inside the free-text caption/description itself. Read the full raw_text/description carefully and pull them out even if they aren't explicitly provided as separate fields."""
    
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("user", "Raw scraped data:\n{raw_data}")
    ])
    
    chain = prompt_template | llm.with_structured_output(ScrapedLead)
    
    try:
        result = await chain.ainvoke({"raw_data": json.dumps(raw_post, ensure_ascii=False, indent=2)})
        return result
    except Exception as e:
        logger.warning(f"Error extracting post data: {e}")
        return None

async def run_tavily_scraper(scraper_input: dict) -> List[ScrapedLead]:
    """Fallback scraper using Tavily (Google search)."""
    query: dict = {
        # Prefer real structured fields if they're already present on scraper_input (e.g. from an upstream LLM parse step).
        "location": scraper_input.get("location"),
        "property_type": scraper_input.get("property_type"),
        "bedrooms": scraper_input.get("bedrooms"),
    }

    hashtags = scraper_input.get("hashtags") or []
    keywords = scraper_input.get("keywords") or []

    # Only fall back to hashtags/keywords when we truly have nothing better,
    # and strip the "#" so it reads like a real place/term.
    if not query["location"] and hashtags:
        query["location"] = hashtags[0].lstrip("#")
    if not query["property_type"] and keywords:
        query["property_type"] = keywords[0]

    # Use ALL keywords/hashtags (not just the first one) as extra search
    # terms instead of discarding them.
    query["extra_terms"] = " ".join(keywords + [h.lstrip("#") for h in hashtags])

    limit = scraper_input.get("limit", 20)
    scraper = TavilySearchScraper(max_results=limit)
    raw_results = await scraper.run(query)
    logger.info(f"[google] built query={query} -> {len(raw_results)} raw results")

    leads: List[ScrapedLead] = []
    for raw in raw_results:
        lead = await extract_post_data(raw)
        if lead:
            # Ensure platform field aligns with enum expectations.
            lead.platform = Platform.google
            leads.append(lead)
            
    return leads
