"""
normalize_lead.py — v3
Field names confirmed by running debug_facebook.py on real actor output.

facebook-posts-scraper real fields:
  pageName, url (post url), facebookUrl, user{id,name,profileUrl},
  text, likes, link, postId

facebook-hashtag-scraper real fields:
  hashtag, permalink_url, owner{id,name,url}, video_owner{id,name},
  play_count, id
  NOTE: this actor returns raw Facebook video metadata — no clean
  author profile fields. We extract from nested owner/video_owner objects.
"""
import json
import re


def _clean(value) -> str:
    return str(value).strip() if value else ""

def _int(value) -> int:
    try:
        return int(value or 0)
    except (ValueError, TypeError):
        return 0

def _first(*values) -> str:
    for v in values:
        s = _clean(v)
        if s:
            return s
    return ""

def _extract_email(text: str) -> str:
    if not text:
        return ""
    match = re.search(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", text)
    return match.group(0) if match else ""

def _safe_json(item: dict) -> str:
    try:
        return json.dumps(item, default=str)
    except Exception:
        return "{}"


# ── TikTok ────────────────────────────────────────────────────────────────────

def normalize_tiktok(item: dict) -> dict:
    author   = item.get("authorMeta") or {}
    username = _first(author.get("name"), item.get("author"))
    bio      = _clean(author.get("signature"))

    bio_link = author.get("bioLink")
    website  = ""
    if isinstance(bio_link, dict):
        website = _clean(bio_link.get("link"))
    elif isinstance(bio_link, str):
        website = _clean(bio_link)

    social_url = _first(
        item.get("webVideoUrl"),
        item.get("videoUrl"),
        item.get("url"),
        f"https://tiktok.com/@{username}" if username else "",
    )

    return {
        "platform":    "tiktok",
        "username":    username,
        "full_name":   _first(author.get("nickName"), author.get("name")),
        "profile_url": f"https://tiktok.com/@{username}" if username else "",
        "social_url":  social_url,
        "followers":   _int(author.get("fans") or author.get("followers")),
        "bio":         bio,
        "email":       _first(author.get("email"), _extract_email(bio)),
        "website":     website,
        "raw_data":    _safe_json(item),
    }


#  Instagram

def normalize_instagram(item: dict) -> dict:
    owner     = item.get("owner") or {}
    username  = _first(item.get("ownerUsername"), item.get("username"), owner.get("username"))
    full_name = _first(item.get("ownerFullName"), item.get("fullName"), owner.get("fullName"))
    followers = _int(
        item.get("followersCount")
        or item.get("ownerFollowersCount")
        or owner.get("followersCount")
    )
    bio     = _first(item.get("biography"),  item.get("description"),  owner.get("biography"))
    website = _first(item.get("externalUrl"), item.get("website"),     owner.get("externalUrl"))
    email   = _first(
        item.get("businessEmail"), item.get("email"),
        owner.get("businessEmail"), _extract_email(bio),
    )

    post_url = _first(item.get("url"), item.get("postUrl"))
    if not post_url and item.get("shortCode"):
        post_url = f"https://instagram.com/p/{item['shortCode']}/"
    profile_url = f"https://instagram.com/{username}" if username else ""
    social_url  = post_url or profile_url

    return {
        "platform":    "instagram",
        "username":    username,
        "full_name":   full_name,
        "profile_url": profile_url,
        "social_url":  social_url,
        "followers":   followers,
        "bio":         bio,
        "email":       email,
        "website":     website,
        "raw_data":    _safe_json(item),
    }


# Facebook 

def normalize_facebook_post(item: dict) -> dict:
    """
    facebook-posts-scraper confirmed fields:
      pageName        → page display name  e.g. "Zillow"
      url             → post URL           e.g. "https://facebook.com/reel/..."
      facebookUrl     → same post URL
      user            → dict: {id, name, profileUrl, profilePic}
      text            → post body text
      likes           → int
      link            → external link in post
      postId          → FB post ID
    """
    user        = item.get("user") or {}
    full_name   = _first(item.get("pageName"), user.get("name"))
    profile_url = _first(user.get("profileUrl"),
                         f"https://facebook.com/{user.get('id')}" if user.get("id") else "")
    social_url  = _first(item.get("url"), item.get("facebookUrl"), profile_url)
    bio         = _first(item.get("text"), item.get("about"), item.get("description"))
    followers   = _int(item.get("likes") or item.get("followersCount"))
    username    = _first(user.get("id"), item.get("facebookId"))

    return {
        "platform":    "facebook",
        "username":    username,
        "full_name":   full_name,
        "profile_url": profile_url,
        "social_url":  social_url,
        "followers":   followers,
        "bio":         bio,
        "email":       _first(item.get("email"), _extract_email(bio)),
        "website":     _first(item.get("website"), item.get("link")),
        "raw_data":    _safe_json(item),
    }


def normalize_facebook_hashtag(item: dict) -> dict:
    """
    facebook-hashtag-scraper confirmed fields:
      hashtag         → searched hashtag
      permalink_url   → direct URL to this video/post
      owner           → dict: {id, __typename, ...}  (sparse — often no name)
      video_owner     → dict: {id, __typename, ...}  (also sparse)
      id              → FB content ID
      play_count      → video views
      canonical_uri_with_fallback → sometimes has the post URL

    This actor returns raw FB video graph data — author name is rarely
    present in the top-level fields. We extract what we can.
    """
    owner       = item.get("owner") or {}
    video_owner = item.get("video_owner") or {}

    owner_id    = _first(owner.get("id"), video_owner.get("id"))
    owner_name  = _first(owner.get("name"), video_owner.get("name"))
    hashtag     = _clean(item.get("hashtag"))

    profile_url = f"https://facebook.com/{owner_id}" if owner_id else ""
    social_url  = _first(
        item.get("permalink_url"),
        item.get("canonical_uri_with_fallback"),
        profile_url,
    )

    return {
        "platform":    "facebook",
        "username":    owner_id,
        "full_name":   owner_name,
        "profile_url": profile_url,
        "social_url":  social_url,
        "followers":   _int(item.get("play_count")),  
        "bio":         f"#{hashtag}" if hashtag else "",
        "email":       "",
        "website":     "",
        "raw_data":    _safe_json(item),
    }


def normalize_facebook(item: dict) -> dict:
    """
    Auto-detects which actor produced the item and calls the right normalizer.
    facebook-posts-scraper items have 'pageName' or 'facebookUrl'.
    facebook-hashtag-scraper items have 'hashtag' or 'permalink_url'.
    """
    if "pageName" in item or "facebookUrl" in item or "postId" in item:
        return normalize_facebook_post(item)
    else:
        return normalize_facebook_hashtag(item)