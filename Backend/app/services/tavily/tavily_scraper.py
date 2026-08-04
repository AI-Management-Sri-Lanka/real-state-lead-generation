import asyncio
import os
import re
import json
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
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


# Maps recognized platform keywords to the Tavily site: filter.
PLATFORM_TO_SITE = {
    "facebook": "facebook.com",
    "fb": "facebook.com",
    "instagram": "instagram.com",
    "insta": "instagram.com",
    "ig": "instagram.com",
    "tiktok": "tiktok.com",
    "tik tok": "tiktok.com",
    "tt": "tiktok.com",
}

# Checked in this order so multi-word phrases ("tik tok") match before
# their shorter variants, and so we don't accidentally check "tt" before
# "tiktok" in text where both could technically appear.
_PLATFORM_KEYWORD_ORDER = [
    "facebook", "fb",
    "instagram", "insta", "ig",
    "tiktok", "tik tok", "tt",
]

DEFAULT_SITE = "facebook.com"  # used when no platform is named in the input


def _collect_text(value, chunks: list):
    """Recursively pull every string out of scraper_input (dicts/lists/etc.)
    so platform detection works no matter which field the caller put the
    raw sentence in.
    """
    if isinstance(value, str):
        chunks.append(value)
    elif isinstance(value, dict):
        for v in value.values():
            _collect_text(v, chunks)
    elif isinstance(value, (list, tuple, set)):
        for v in value:
            _collect_text(v, chunks)


def detect_platform(scraper_input: dict) -> str:
    """Figure out which single platform to search, based on the free text
    in scraper_input (e.g. "need to sell an apartment in sydney, want
    posts from fb").

    - "fb" / "facebook"  -> facebook.com
    - "ig" / "insta" / "instagram" -> instagram.com
    - "tt" / "tiktok" / "tik tok"  -> tiktok.com
    - nothing matched -> DEFAULT_SITE (facebook.com)

    Always returns a single site — this scraper is single-platform-per-run
    by design now, not "search everything unless told otherwise".
    """
    chunks: list = []
    _collect_text(scraper_input, chunks)
    combined = " ".join(chunks).lower()

    if combined.strip():
        for kw in _PLATFORM_KEYWORD_ORDER:
            pattern = kw.replace(" ", r"\s*")
            if re.search(rf"\b{pattern}\b", combined):
                return PLATFORM_TO_SITE[kw]

    return DEFAULT_SITE


def _parse_date(date_str: Optional[str]) -> Optional[datetime]:
    """Best-effort parse of whatever date format Tavily hands back.

    Tavily usually returns RFC-2822 style dates (e.g. "Wed, 15 Jan 2025
    00:00:00 GMT"), but sometimes ISO 8601, so we try both. Returns None
    if the string is missing or unparseable — callers decide what to do
    with that.
    """
    if not date_str:
        return None

    try:
        dt = parsedate_to_datetime(date_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        pass

    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        pass

    return None


class TavilySearchScraper:
    def __init__(
        self,
        max_results: int = 20,
        time_range: str = "month",
        max_age_days: int = 90,
    ):
        self.max_results = max_results
        # Native Tavily recency filter, applied on every search call below.
        # One of: "day", "week", "month", "year".
        self.time_range = time_range
        # Secondary safety net applied client-side after results come back,
        # in case time_range doesn't fully filter out stale indexed pages.
        self.max_age_days = max_age_days
        api_key = os.getenv("TAVILY_API_KEY", "")
        if not api_key:
            print("[Tavily] WARNING: TAVILY_API_KEY not set in .env")
        self.client = TavilyClient(api_key=api_key) if api_key else None

    async def run(
        self,
        location: str,
        ptype: str,
        sites: Optional[List[str]] = None,
        min_results_per_query: int = 5,
    ) -> list[dict]:
        if not self.client:
            print("[Tavily] No client — skipping")
            return []

        location = (location or "").strip()
        ptype = (ptype or "property").strip()

        # Restrict to a single named platform if one was detected upstream,
        # otherwise search all sites as before.
        active_sites = sites or SITES

        seen_urls: set = set()
        results: list[dict] = []
        cutoff = datetime.now(timezone.utc) - timedelta(days=self.max_age_days)

        total_weight = sum(SITE_WEIGHTS.get(s, 1) for s in active_sites)

        for site in active_sites:
            templates = list(QUERY_TEMPLATES)
            if site == "facebook.com":
                templates += FACEBOOK_QUERY_TEMPLATES

            # This site's slice of the overall budget, scaled by its weight,
            # then spread across however many templates we're running for it.
            # NOTE: with a floor of min_results_per_query, per_query no
            # longer collapses to 1 when a site has many templates (e.g.
            # Facebook's 11) — previously 20 // 11 == 1, which starved
            # every query down to a single hit before dedup/LLM filtering
            # even ran, leaving almost nothing. Now each query always asks
            # for at least min_results_per_query candidates, so the total
            # raw pool can exceed max_results — that's intentional, since
            # dedup + seller-rejection by the LLM will thin it out anyway.
            site_budget = self.max_results * SITE_WEIGHTS.get(site, 1) // total_weight
            per_query = max(min_results_per_query, site_budget // max(1, len(templates)))

            for tpl in templates:
                phrase = tpl.format(ptype=ptype, location=location)
                query = f"{phrase} site:{site}"
                print(
                    f"[Tavily] searching → {query} "
                    f"(max_results={per_query}, time_range={self.time_range})"
                )
                try:
                    loop = asyncio.get_running_loop()
                    response = await loop.run_in_executor(
                        None,
                        lambda q=query, n=per_query: self.client.search(
                            query=q,
                            max_results=n,
                            time_range=self.time_range,  # <-- ask Tavily for recent results only
                        ),
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

                    published_at = _parse_date(item.get("published_date"))
                    # Client-side safety net: drop anything we can confirm
                    # is older than max_age_days, even if time_range let it
                    # through (e.g. stale page re-crawled recently).
                    if published_at and published_at < cutoff:
                        print(
                            f"[Tavily]   ✗ skipping stale result "
                            f"({published_at.date()}): {url}"
                        )
                        continue

                    seen_urls.add(url)
                    results.append({
                        "platform": "google",
                        "post_link": url,
                        "raw_text": f"{item.get('title', '')}\n{item.get('content', '')}".strip(),
                        "author_name": item.get("title"),
                        "raw_date": item.get("published_date"),
                        "_parsed_date": published_at,  # used for sorting below, stripped before return
                    })

        # Newest first. Results with no parseable date (common for social
        # posts) are kept, but sorted to the end rather than dropped.
        results.sort(
            key=lambda r: r["_parsed_date"] or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True,
        )
        for r in results:
            r.pop("_parsed_date", None)

        print(f"[Tavily] total raw results after recency filter: {len(results)}")
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

    # Always search exactly one platform: whichever is named in the input
    # text (fb/facebook, ig/insta/instagram, tt/tiktok/tik tok), or Facebook
    # by default if none is named.
    target_site = detect_platform(scraper_input)

    print(
        f"[Tavily] starting search → location='{location}', ptype='{ptype}', "
        f"site={target_site}"
    )

    limit = scraper_input.get("limit", 20)
    # Optional overrides from caller, otherwise sane recency defaults.
    time_range = scraper_input.get("time_range", "month")
    max_age_days = scraper_input.get("max_age_days", 90)
    # Floor on results requested per individual query — prevents the budget
    # from being sliced so thin (across many query templates) that each
    # search only asks Tavily for 1 result.
    min_results_per_query = scraper_input.get("min_results_per_query", 5)

    scraper = TavilySearchScraper(
        max_results=limit,
        time_range=time_range,
        max_age_days=max_age_days,
    )
    raw_results = await scraper.run(
        location=location,
        ptype=ptype,
        sites=[target_site],
        min_results_per_query=min_results_per_query,
    )

    if not raw_results:
        print("[Tavily] No raw results returned")
        return []

    # Run LLM extractions concurrently
    tasks = [extract_post_data(raw) for raw in raw_results]
    extracted = await asyncio.gather(*tasks, return_exceptions=False)

    leads: List[ScrapedLead] = [l for l in extracted if l]
    for lead in leads:
        lead.platform = Platform.google

    print(f"[Tavily] ✓ {len(leads)} buyer leads from {len(raw_results)} raw results")
    return leads
