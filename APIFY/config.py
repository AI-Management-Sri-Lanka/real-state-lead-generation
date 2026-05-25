APIFY_API_TOKEN = "apify_api_egeiApVfcX2cNKev8TG1zcDLErNar84jXVwb"

ACTORS = {
    "tiktok_hashtag":    "clockworks/tiktok-hashtag-scraper",
    "tiktok_main":       "clockworks/tiktok-scraper",
    "instagram_scraper": "apify/instagram-scraper",
    "instagram_hashtag": "apify/instagram-hashtag-scraper",
    "facebook_posts":    "apify/facebook-posts-scraper",
    "facebook_hashtag":  "apify/facebook-hashtag-scraper",
}

# ── Hashtags used across all platforms ──────────────────────────────────────
HASHTAGS = [
    "realestate",
    "househunting",
    "firsttimehomebuyer",
    "propertyforsale",
    "dreamhome",
    "homebuyer",
    "buyingahome",
    "propertyinvestment",
    "newhome",
    "luxuryhomes",
    "homeforsale",
    "realestateagent",
    "openhouse",
    "investmentproperty",
    "condoforsale",
    "rentalhouse",
    "houseforrent",
    "apartmentforrent",
    "homesforsale",
]

# ── Facebook page seed URLs ──────────────────────────────────────────────────
FACEBOOK_SEED_URLS = [
    {"url": "https://www.facebook.com/realestate"},
    {"url": "https://www.facebook.com/zillow"},
    {"url": "https://www.facebook.com/realtor"},
]

# ── Instagram seed URLs ──────────────────────────────────────────────────────
INSTAGRAM_SEED_URLS = [
    "https://www.instagram.com/realtor/",
    "https://www.instagram.com/luxuryhomes/",
    "https://www.instagram.com/realestate/",
]

# ── Scraper limits ───────────────────────────
RESULTS_LIMIT   = 50   # per actor run
TIKTOK_MAX_ITEMS = 50