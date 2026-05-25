"""
db.py — SQLite helpers
FIX: Removed UNIQUE constraint on profile_url alone.
     Now uses (platform, username) as the natural duplicate key,
     which correctly handles empty profile_urls without dropping valid leads.
"""
import sqlite3
from contextlib import contextmanager

DB_PATH = "leads.db"


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS leads (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                platform    TEXT    NOT NULL,
                username    TEXT,
                full_name   TEXT,
                profile_url TEXT,
                social_url  TEXT,
                followers   INTEGER DEFAULT 0,
                bio         TEXT,
                email       TEXT,
                website     TEXT,
                raw_data    TEXT,
                fetched_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
                -- FIX: unique on (platform+username), not profile_url alone
                -- NULL usernames are always inserted (can't dedup without a key)
                UNIQUE(platform, username)
            )
        """)
        for col in ["social_url"]:
            try:
                conn.execute(f"ALTER TABLE leads ADD COLUMN {col} TEXT")
            except Exception:
                pass


def save_lead(lead: dict) -> bool:
    """
    Insert lead if (platform, username) pair is new.
    If username is empty, always insert (can't dedup anonymous entries).
    Returns True if inserted, False if duplicate skipped.
    """
    with get_conn() as conn:
        if lead.get("username"):
            cur = conn.execute("""
                INSERT OR IGNORE INTO leads
                  (platform, username, full_name, profile_url, social_url,
                   followers, bio, email, website, raw_data)
                VALUES
                  (:platform, :username, :full_name, :profile_url, :social_url,
                   :followers, :bio, :email, :website, :raw_data)
            """, lead)
            return cur.rowcount == 1
        else:
            conn.execute("""
                INSERT INTO leads
                  (platform, username, full_name, profile_url, social_url,
                   followers, bio, email, website, raw_data)
                VALUES
                  (:platform, :username, :full_name, :profile_url, :social_url,
                   :followers, :bio, :email, :website, :raw_data)
            """, lead)
            return True


def get_leads(platform: str | None = None,
              min_followers: int = 0,
              limit: int = 500,
              offset: int = 0) -> list[dict]:
    query  = "SELECT * FROM leads WHERE followers >= ?"
    params: list = [min_followers]
    if platform:
        query += " AND platform = ?"
        params.append(platform)
    query += " ORDER BY followers DESC LIMIT ? OFFSET ?"
    params += [limit, offset]
    with get_conn() as conn:
        rows = conn.execute(query, params).fetchall()
    return [dict(r) for r in rows]


def get_stats() -> dict:
    with get_conn() as conn:
        total   = conn.execute("SELECT COUNT(*) FROM leads").fetchone()[0]
        by_plat = conn.execute(
            "SELECT platform, COUNT(*) as cnt FROM leads GROUP BY platform"
        ).fetchall()
        with_email   = conn.execute(
            "SELECT COUNT(*) FROM leads WHERE email   != '' AND email   IS NOT NULL"
        ).fetchone()[0]
        with_website = conn.execute(
            "SELECT COUNT(*) FROM leads WHERE website != '' AND website IS NOT NULL"
        ).fetchone()[0]
    return {
        "total":       total,
        "by_platform": {r["platform"]: r["cnt"] for r in by_plat},
        "with_email":  with_email,
        "with_website": with_website,
    }