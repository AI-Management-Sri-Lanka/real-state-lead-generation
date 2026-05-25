"""
api.py — Real Estate Lead Generator  v5.0
==========================================
TIMEOUT FIX: Apify actors take 3-5 min each × 6 actors = ~18 min total.
A normal HTTP request times out in 30-60 seconds.

SOLUTION — Two-step pattern:
  Step 1:  POST /scrape          → starts job in background, returns job_id instantly
  Step 2:  GET  /scrape/{job_id} → poll until status="done", then read post_links

Chatbot flow:
  POST /scrape  →  { job_id: "abc123", status: "running" }
       ↓  (poll every 10s)
  GET /scrape/abc123  →  { status: "running", ... }
  GET /scrape/abc123  →  { status: "done", post_links: {...}, leads_saved: {...} }

Start: uvicorn api:app --reload --port 8000
Docs:  http://127.0.0.1:8000/docs
"""
import csv
import io
import uuid
import threading
import time
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import StreamingResponse, HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import os

from db import init_db, get_leads, get_stats, get_conn

app = FastAPI(
    title="Real Estate Lead Generator",
    description="""
## How the chatbot connects to this API

**The scrape takes ~15-20 minutes** (6 Apify actors run in sequence).  
A normal HTTP call would time out. So the API uses a **two-step job pattern**:

### Step 1 — Start the scrape (instant response)
```
POST /scrape
{ "tag_list": ["houseforrent", "colombo"], "social_media": {...} }

→ { "job_id": "abc123", "status": "running" }
```

### Step 2 — Poll until done (every 10–15 seconds)
```
GET /scrape/abc123

→ { "status": "running",  "progress": "TikTok done, Instagram running..." }
→ { "status": "done",     "post_links": { "facebook": [...], ... } }
→ { "status": "failed",   "error": "..." }
```
""",
    version="5.0.0",
)

# ── In-memory job store ───────────────────────────────────────────────────────
# For production replace with Redis. Fine for single-server deployment.
_jobs: dict[str, dict] = {}
_jobs_lock = threading.Lock()

# Allow the dashboard HTML to call the API from the browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


@app.get("/", include_in_schema=False)
def homepage():
    """Serve the visual dashboard at the root URL."""
    dashboard = os.path.join(os.path.dirname(__file__), "dashboard.html")
    if os.path.exists(dashboard):
        return FileResponse(dashboard, media_type="text/html")
    return HTMLResponse("<h2>Dashboard not found. Make sure dashboard.html is in the same folder as api.py</h2>")


# ═══════════════════════════════════════════════════════════════════════════════
#  REQUEST / RESPONSE MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class SocialMediaToggle(BaseModel):
    facebook:  bool = Field(True,  description="Scrape Facebook")
    instagram: bool = Field(True,  description="Scrape Instagram")
    tiktok:    bool = Field(True,  description="Scrape TikTok")

class ScrapeRequest(BaseModel):
    tag_list: list[str] = Field(
        ...,
        description="Keywords from the customer chat. Spaces and special chars are handled automatically.",
        example=["house for rent", "colombo", "3 bedroom", "propertysrilanka"],
    )
    social_media: SocialMediaToggle = Field(default_factory=SocialMediaToggle)

class JobStarted(BaseModel):
    job_id:   str
    status:   str = "running"
    message:  str

class JobStatus(BaseModel):
    job_id:      str
    status:      str             
    progress:    str             
    post_links:  dict            
    leads_saved: dict
    total_saved: int
    tags_used:   list[str]
    started_at:  str
    finished_at: str | None
    duration_seconds: float | None
    error:       str | None


# ═══════════════════════════════════════════════════════════════════════════════
#  BACKGROUND WORKER
# ═══════════════════════════════════════════════════════════════════════════════

def _run_scrape(job_id: str, tags: list[str], platforms: SocialMediaToggle):
    """Runs in a background thread. Updates _jobs[job_id] as it progresses."""

    def update(progress: str):
        with _jobs_lock:
            _jobs[job_id]["progress"] = progress
        print(f"[Job {job_id[:8]}] {progress}")

    links   = {"facebook": [], "instagram": [], "tiktok": []}
    saved   = {"facebook": 0,  "instagram": 0,  "tiktok": 0}
    started = time.time()

    try:
        # TikTok
        if platforms.tiktok:
            update("TikTok: running tiktok-hashtag-scraper...")
            from fetch_tiktok import fetch_tiktok_hashtag, fetch_tiktok_main
            tl1, n1 = fetch_tiktok_hashtag(tags);  time.sleep(2)
            update("TikTok: running tiktok-scraper...")
            tl2, n2 = fetch_tiktok_main(tags)
            links["tiktok"]  = tl1 + tl2
            saved["tiktok"]  = n1 + n2
            update(f"TikTok: done — {saved['tiktok']} leads")
            time.sleep(2)

        # Instagram
        if platforms.instagram:
            update("Instagram: running instagram-scraper...")
            from fetch_instagram import fetch_instagram_scraper, fetch_instagram_hashtag
            il1, n1 = fetch_instagram_scraper(tags);  time.sleep(2)
            update("Instagram: running instagram-hashtag-scraper...")
            il2, n2 = fetch_instagram_hashtag(tags)
            links["instagram"] = il1 + il2
            saved["instagram"] = n1 + n2
            update(f"Instagram: done — {saved['instagram']} leads")
            time.sleep(2)

        #  Facebook 
        if platforms.facebook:
            update("Facebook: running facebook-posts-scraper...")
            from fetch_facebook import fetch_facebook_posts, fetch_facebook_hashtag
            fl1, n1 = fetch_facebook_posts(tags);  time.sleep(2)
            update("Facebook: running facebook-hashtag-scraper...")
            fl2, n2 = fetch_facebook_hashtag(tags)
            links["facebook"] = fl1 + fl2
            saved["facebook"] = n1 + n2
            update(f"Facebook: done — {saved['facebook']} leads")

        duration = round(time.time() - started, 2)
        with _jobs_lock:
            _jobs[job_id].update(
                status="done",
                progress="All platforms complete.",
                post_links=links,
                leads_saved=saved,
                total_saved=sum(saved.values()),
                finished_at=datetime.utcnow().isoformat(),
                duration_seconds=duration,
                error=None,
            )
        print(f"[Job {job_id[:8]}] DONE — {sum(saved.values())} total leads in {duration}s")

    except Exception as exc:
        with _jobs_lock:
            _jobs[job_id].update(
                status="failed",
                progress="Scrape failed — see error field.",
                finished_at=datetime.utcnow().isoformat(),
                duration_seconds=round(time.time() - started, 2),
                error=str(exc),
            )
        print(f"[Job {job_id[:8]}] FAILED: {exc}")


# ═══════════════════════════════════════════════════════════════════════════════
#  POST /scrape  ← chatbot calls this first
# ═══════════════════════════════════════════════════════════════════════════════

@app.post(
    "/scrape",
    response_model=JobStarted,
    status_code=202,
    summary="▶ Start a scrape job (chatbot calls this)",
)
def start_scrape(req: ScrapeRequest):
    """
    **Start a scrape. Returns a `job_id` immediately.**

    The actual scraping runs in the background (~15-20 min).  
    Use `GET /scrape/{job_id}` to check progress and get results.

    ### Example
    ```json
    POST /scrape
    {
      "tag_list": ["house for rent", "colombo", "3 bedroom"],
      "social_media": { "facebook": true, "instagram": true, "tiktok": true }
    }
    ```
    """
    if not req.tag_list:
        raise HTTPException(status_code=422, detail="`tag_list` must not be empty.")

    job_id = str(uuid.uuid4())
    with _jobs_lock:
        _jobs[job_id] = {
            "job_id":           job_id,
            "status":           "running",
            "progress":         "Starting...",
            "post_links":       {"facebook": [], "instagram": [], "tiktok": []},
            "leads_saved":      {"facebook": 0, "instagram": 0, "tiktok": 0},
            "total_saved":      0,
            "tags_used":        req.tag_list,
            "started_at":       datetime.utcnow().isoformat(),
            "finished_at":      None,
            "duration_seconds": None,
            "error":            None,
        }

    # Fire and forget — runs in background thread
    t = threading.Thread(
        target=_run_scrape,
        args=(job_id, req.tag_list, req.social_media),
        daemon=True,
    )
    t.start()

    return JobStarted(
        job_id=job_id,
        status="running",
        message=f"Scrape started for {len(req.tag_list)} tags. "
                f"Poll GET /scrape/{job_id} every 15s for progress and results.",
    )


# ═══════════════════════════════════════════════════════════════════════════════
#  GET /scrape/{job_id}  ← chatbot polls this
# ═══════════════════════════════════════════════════════════════════════════════

@app.get(
    "/scrape/{job_id}",
    response_model=JobStatus,
    summary="📊 Poll job status & get results (chatbot polls this)",
)
def get_scrape_job(job_id: str):
    """
    **Check the status of a running or completed scrape job.**

    Poll this every 10-15 seconds after calling `POST /scrape`.

    ### Status values
    - `"running"` — still scraping, check `progress` for current step
    - `"done"`    — finished, read `post_links` for all URLs found
    - `"failed"`  — something went wrong, check `error` field

    ### When status = "done", post_links looks like:
    ```json
    {
      "facebook":  ["https://facebook.com/someone/posts/123", ...],
      "instagram": ["https://instagram.com/p/abc/", "https://instagram.com/username/", ...],
      "tiktok":    ["https://tiktok.com/@user/video/456", ...]
    }
    ```
    """
    with _jobs_lock:
        job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
    return job


@app.get("/scrape", summary="📋 List all scrape jobs")
def list_jobs():
    """Returns all jobs (running + completed). Useful for debugging."""
    with _jobs_lock:
        return {
            "total": len(_jobs),
            "jobs": [
                {
                    "job_id":      j["job_id"],
                    "status":      j["status"],
                    "progress":    j["progress"],
                    "total_saved": j["total_saved"],
                    "tags_used":   j["tags_used"],
                    "started_at":  j["started_at"],
                }
                for j in _jobs.values()
            ],
        }


# ═══════════════════════════════════════════════════════════════════════════════
#  LEADS
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/leads", summary="📋 List collected leads")
def list_leads(
    platform:      Optional[str] = Query(None,  description="tiktok | instagram | facebook"),
    min_followers: int           = Query(0,     description="Minimum follower count"),
    limit:         int           = Query(50,    le=500),
    offset:        int           = Query(0),
):
    leads = get_leads(platform=platform, min_followers=min_followers,
                      limit=limit, offset=offset)
    return {"count": len(leads), "leads": leads}


@app.get("/leads/export", summary="⬇ Download leads as CSV")
def export_leads(
    platform:      Optional[str] = Query(None),
    min_followers: int           = Query(0),
):
    leads = get_leads(platform=platform, min_followers=min_followers, limit=10_000)
    if not leads:
        raise HTTPException(status_code=404, detail="No leads found.")
    buf  = io.StringIO()
    cols = ["platform", "username", "full_name", "profile_url", "social_url",
            "followers", "email", "website", "bio", "fetched_at"]
    writer = csv.DictWriter(buf, fieldnames=cols, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(leads)
    buf.seek(0)
    filename = f"leads_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(buf, media_type="text/csv",
                             headers={"Content-Disposition": f"attachment; filename={filename}"})


@app.get("/leads/{lead_id}", summary="🔍 Get a single lead")
def get_lead(lead_id: int):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM leads WHERE id = ?", (lead_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Lead not found.")
    return dict(row)


@app.delete("/leads/{lead_id}", summary="🗑 Delete a lead")
def delete_lead(lead_id: int):
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM leads WHERE id = ?", (lead_id,))
    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail="Lead not found.")
    return {"deleted": lead_id}


# ═══════════════════════════════════════════════════════════════════════════════
#  STATS + HEALTH
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/stats", summary="📈 Database statistics")
def stats():
    return get_stats()

@app.get("/health", include_in_schema=False)
def health():
    return {"status": "ok"}