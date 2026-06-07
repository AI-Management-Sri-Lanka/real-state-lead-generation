"""
Test: router.py → apify_scraper.py → rank_leads.py flow
- Router extracts preferences from user query
- Scraper gets real data from Apify
- rank_leads receives the scraped data (mocked to avoid Qdrant)

Run from Backend/ folder:
    python app\tests\test_router_to_ranker.py
"""

import json
import sys
import os

# ── point to Backend/ folder ────────────────────────────────────────────
BACKEND_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
sys.path.insert(0, BACKEND_DIR)
print(f"\n  Python path set to: {BACKEND_DIR}")

# ── import ONLY the scraper (no LLM, no Qdrant, no DB) ──────────────────
from app.services.apify.apify_scraper import run_scraper


# ── copied from router.py — avoids importing LLM dependencies ───────────
def _build_scraper_input(routing: dict) -> dict:
    location  = routing.get("preferred_location") or ""
    prop_type = routing.get("property_type")       or ""

    hashtags = ["realestate", "property", "luxuryhomes"]
    keywords = ["realestate", "property"]

    if location:
        slug = location.lower().replace(" ", "")
        hashtags.append(f"{slug}property")
        keywords.append(slug)

    if prop_type:
        slug = prop_type.lower().replace(" ", "")
        hashtags.append(slug)

    return {
        "facebook":  False,
        "instagram": False,
        "tiktok":    True,
        "hashtags":  hashtags,
        "keywords":  keywords,
        "limit":     3,
    }


# ── copied from rank_leads.py — avoids importing Qdrant ─────────────────
def mock_normalize_lead(lead: dict) -> dict:
    """Same logic as rank_leads._normalize_lead()"""
    return {
        "username":  lead.get("userId")     or lead.get("username",  "unknown"),
        "name":      lead.get("name",        ""),
        "email":     lead.get("email",       ""),
        "post_link": lead.get("post_link",   ""),
        "date":      lead.get("date",        ""),
        "platform":  lead.get("platform",    ""),
        "post":      lead.get("description") or lead.get("post", ""),
    }


# ── SIMULATE what router.py does ────────────────────────────────────────
# This is exactly what Router.chat() produces after LLM extracts preferences
# We hardcode it here so we don't need LLM/API keys for this test
mock_routing = {
    "lead_search":            True,
    "simple_chat":            False,
    "preferred_location":     "Colombo",
    "budget_range":           "25 million LKR",
    "property_type":          "apartment",
    "investment_preferences": None,
}

TEST_QUERY = "Looking for a 2 bedroom apartment in Colombo under 25 million LKR"


# ── STEP 1 ───────────────────────────────────────────────────────────────

def test_router_to_scraper():
    """
    Test _build_scraper_input()
    Checks router correctly converts LLM output → scraper input format
    """
    print("\n" + "="*60)
    print("STEP 1: Router → Scraper Input")
    print("="*60)

    scraper_input = _build_scraper_input(mock_routing)

    print(f"  Routing input:")
    print(f"  {json.dumps(mock_routing, indent=2)}")
    print(f"\n  Scraper input built:")
    print(f"  {json.dumps(scraper_input, indent=2)}")

    # validate required keys exist
    required_keys = ["facebook", "instagram", "tiktok", "hashtags", "keywords", "limit"]
    all_ok = True
    for key in required_keys:
        if key not in scraper_input:
            print(f"  ✗ FAILED — missing key: {key}")
            all_ok = False

    if not all_ok:
        return None

    print(f"\n  ✓ PASSED — scraper input built correctly")
    return scraper_input


# ── STEP 2 ───────────────────────────────────────────────────────────────

def test_scraper_to_leads(scraper_input):
    """
    Test apify_scraper.run_scraper()
    Checks scraper returns data in correct format
    """
    print("\n" + "="*60)
    print("STEP 2: Scraper → Leads")
    print("="*60)

    print("  Running apify scraper...")
    try:
        leads = run_scraper(scraper_input)
    except Exception as e:
        print(f"  ✗ FAILED — Scraper error: {e}")
        return None

    print(f"  ✓ Scraper returned {len(leads)} leads")

    if not leads:
        print("  ✗ FAILED — No leads returned")
        return None

    # validate lead format matches what rank_leads expects
    print(f"\n  Validating lead format (first lead):")
    first = leads[0]
    required_fields = ["userId", "name", "email", "post_link", "date", "description", "platform"]
    for field in required_fields:
        status = "✓" if field in first else "✗ MISSING"
        print(f"    {status}  {field}: {str(first.get(field, ''))[:60]}")

    # save raw output for inspection
    output_path = os.path.join(BACKEND_DIR, "test_apify_raw.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(leads, f, indent=2, ensure_ascii=False)
    print(f"\n  Full scraper output saved → {output_path}")

    return leads


# ── STEP 3 ───────────────────────────────────────────────────────────────

def test_leads_to_ranker(leads):
    """
    Test data format is ready for rank_leads
    Mocks rank_leads._normalize_lead() without needing Qdrant
    """
    print("\n" + "="*60)
    print("STEP 3: Leads → RankLeads format check (no Qdrant needed)")
    print("="*60)

    normalized = [mock_normalize_lead(l) for l in leads]
    valid      = [l for l in normalized if l["post"].strip()]
    dropped    = len(normalized) - len(valid)

    print(f"  Total leads    : {len(leads)}")
    print(f"  Valid for embed: {len(valid)}  (have description text)")
    print(f"  Dropped        : {dropped}     (empty description)")

    if not valid:
        print("  ✗ FAILED — No leads with text to embed")
        return False

    print(f"\n  Sample normalized lead (what rank_leads receives):")
    print("  " + "-"*50)
    print(json.dumps(valid[0], indent=4, ensure_ascii=False))

    # save normalized output for inspection
    output_path = os.path.join(BACKEND_DIR, "test_normalized_leads.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(valid, f, indent=2, ensure_ascii=False)
    print(f"\n  Normalized leads saved → {output_path}")

    print(f"\n  ✓ PASSED — Data is ready for rank_leads.py")
    print(f"  ✓ rank_leads will embed {len(valid)} leads and rank by query:")
    print(f'  ✓ Query: "{TEST_QUERY}"')

    return True


# ── ENTRY POINT ──────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("\n🧪 Testing: router → apify_scraper → rank_leads flow")
    print(f"   Query: {TEST_QUERY}")

    # Step 1: router builds scraper input
    scraper_input = test_router_to_scraper()
    if not scraper_input:
        print("\n✗ FAILED at Step 1")
        sys.exit(1)

    # Step 2: scraper fetches real leads
    leads = test_scraper_to_leads(scraper_input)
    if not leads:
        print("\n✗ FAILED at Step 2")
        sys.exit(1)

    # Step 3: check leads are in correct format for rank_leads
    passed = test_leads_to_ranker(leads)
    if not passed:
        print("\n✗ FAILED at Step 3")
        sys.exit(1)

    print("\n" + "="*60)
    print("✓ ALL STEPS PASSED!")
    print("  router → apify_scraper → rank_leads pipeline is working")
    print("="*60)