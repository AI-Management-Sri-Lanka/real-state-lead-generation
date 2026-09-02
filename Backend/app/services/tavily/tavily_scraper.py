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

SITES = ["facebook.com", "instagram.com", "tiktok.com"]

# Relative share of the result budget each site gets. Facebook is weighted
# heavier because it's usually the richest source for buyer leads, even
# though Google only indexes a slice of it (mostly public groups/pages).
SITE_WEIGHTS = {
    "facebook.com": 3,
    "instagram.com": 1,
    "tiktok.com": 1,
}

# Simple queries that find real estate posts — LLM will decide buyer vs seller
QUERY_TEMPLATES = [
    "{ptype} {location} looking",
    "{ptype} {location} searching",
    "{ptype} {location} want to buy",
    "{ptype} {location} need",
    "{ptype} {location} buyer",
]

# Extra templates specifically for Facebook — worded closer to how buyer
# posts actually show up in public groups / marketplace-adjacent content,
# which is the part of FB that Google can actually index.
FACEBOOK_QUERY_TEMPLATES = [
    "{ptype} {location} wanted",
    "looking to rent {ptype} {location}",
    "looking to buy {ptype} {location}",
    "relocating to {location} need {ptype}",
    "any recommendations {ptype} {location}",
    "{ptype} {location} inurl:groups",
]


class TavilySearchScraper:
    def __init__(self, max_results: int = 20):
        self.max_results = max_results
        api_key = os.getenv("TAVILY_API_KEY", "")
        if not api_key:
            print("[Tavily] WARNING: TAVILY_API_KEY not set in .env")
        self.client = TavilyClient(api_key=api_key) if api_key else None

    async def run(self, location: str, ptype: str) -> list[dict]:
        if not self.client:
            print("[Tavily] No client — skipping")
            return []

        location = (location or "").strip()
        ptype = (ptype or "property").strip()

        seen_urls: set = set()
        results: list[dict] = []

        total_weight = sum(SITE_WEIGHTS.get(s, 1) for s in SITES)

        for site in SITES:
            templates = list(QUERY_TEMPLATES)
            if site == "facebook.com":
                templates += FACEBOOK_QUERY_TEMPLATES

            # This site's slice of the overall budget, scaled by its weight,
            # then spread across however many templates we're running for it.
            site_budget = self.max_results * SITE_WEIGHTS.get(site, 1) // total_weight
            per_query = max(1, site_budget // max(1, len(templates)))

            for tpl in templates:
                phrase = tpl.format(ptype=ptype, location=location)
                query = f"{phrase} site:{site}"
                print(f"[Tavily] searching → {query} (max_results={per_query})")
                try:
                    loop = asyncio.get_running_loop()
                    response = await loop.run_in_executor(
                        None,
                        lambda q=query, n=per_query: self.client.search(query=q, max_results=n),
                    )
                except Exception as e:
                    print(f"[Tavily] search error ({site}): {e}")
                    continue

                hits = response.get("results", [])
                print(f"[Tavily]   → {len(hits)} hits from {site}")
                for item in hits:
                    url = item.get("url", "")
                    if url in seen_urls:
                        continue
                    seen_urls.add(url)
                    results.append({
                        "platform": "google",
                        "post_link": url,
                        "raw_text": f"{item.get('title', '')}\n{item.get('content', '')}".strip(),
                        "author_name": item.get("title"),
                        "raw_date": item.get("published_date"),
                    })

        print(f"[Tavily] total raw results: {len(results)}")
        return results


_SYSTEM_PROMPT = """\
You are a buyer-lead extraction engine for a real estate platform.

ACCEPT this post if the author is LOOKING TO BUY or RENT a property.
REJECT this post (set userId="" and name="") if the author is a SELLER, AGENT, or DEVELOPER advertising a property.

For accepted posts extract:
- userId: social media handle of the buyer
- name: display name
- email: only if explicitly present
- post_link: from raw data, never invent
- date: from raw data or null
- description: buyer's own words about what they want
- platform: infer from URL (instagram/facebook/tiktok/google)
- property_type: apartment/house/villa/land/commercial/rental/boarding/farming/investment/unknown
- location: where the buyer wants to buy/rent

Never invent data. If seller/agent post: userId="" name="".
"""


async def extract_post_data(raw_post: dict) -> Optional[ScrapedLead]:
    llm = get_llm()
    prompt = ChatPromptTemplate.from_messages([
        ("system", _SYSTEM_PROMPT),
        ("user", "Raw scraped data:\n{raw_data}")
    ])
    chain = prompt | llm.with_structured_output(ScrapedLead)
    try:
        result = await chain.ainvoke({
            "raw_data": json.dumps(raw_post, ensure_ascii=False, indent=2)
        })
        if not result or not (result.userId or "").strip():
            print(f"[Tavily] LLM rejected (seller/irrelevant): {raw_post.get('post_link')}")
            return None
        return result
    except Exception as e:
        print(f"[Tavily] LLM extraction error: {e}")
        return None


async def run_tavily_scraper(scraper_input: dict) -> List[ScrapedLead]:
    """Fallback buyer-lead scraper using Tavily (Google search)."""

    location: str = scraper_input.get("location") or ""
    ptype: str = scraper_input.get("property_type") or ""

    # Fall back to hashtags if structured fields are empty
    if not location:
        hashtags = scraper_input.get("hashtags") or []
        candidates = [h.lstrip("#") for h in hashtags if h.lstrip("#") != "realestate"]
        location = candidates[0] if candidates else ""

    if not ptype:
        keywords = scraper_input.get("keywords") or []
        skip = {"realestate", location.lower().replace(" ", "")}
        candidates = [k for k in keywords if k.lower().replace(" ", "") not in skip]
        ptype = candidates[0] if candidates else "property"

    print(f"[Tavily] starting search → location='{location}', ptype='{ptype}'")

    limit = scraper_input.get("limit", 20)
    scraper = TavilySearchScraper(max_results=limit)
    raw_results = await scraper.run(location=location, ptype=ptype)

    if not raw_results:
        print("[Tavily] No raw results returned")
        return []

    # Run LLM extractions concurrently
    tasks = [extract_post_data(raw) for raw in raw_results]
    extracted = await asyncio.gather(*tasks, return_exceptions=False)

    leads: List[ScrapedLead] = [l for l in extracted if l]
    for lead in leads:
        url_lower = (lead.post_link or "").lower()
        if "facebook.com" in url_lower:
            lead.platform = Platform.facebook
        elif "instagram.com" in url_lower:
            lead.platform = Platform.instagram
        elif "tiktok.com" in url_lower:
            lead.platform = Platform.tiktok
        elif not lead.platform or lead.platform == Platform.unknown:
            lead.platform = Platform.google

    print(f"[Tavily] ✓ {len(leads)} buyer leads from {len(raw_results)} raw results")
    return leads