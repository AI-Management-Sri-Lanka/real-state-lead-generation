from datetime import datetime, timezone, timedelta
from typing import List, Optional

from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead import Lead
from app.schemas.lead_schema import ScrapedLead
from app.schemas.leads_schema import LeadResponse, LeadsStats, SourceBreakdown

HIGH_SCORE_THRESHOLD = 0.75
MEDIUM_SCORE_THRESHOLD = 0.55


def bucket_score(score: Optional[float]) -> str:
    """Bucket a raw similarity score into High/Medium/Low for the UI.

    A missing score defaults to Medium — not High (would overstate confidence)
    and not Low (would unfairly penalize a lead just for lacking a description
    to embed/rank).
    """
    if score is None:
        return "Medium"
    if score >= HIGH_SCORE_THRESHOLD:
        return "High"
    if score >= MEDIUM_SCORE_THRESHOLD:
        return "Medium"
    return "Low"


def _to_response(lead: Lead) -> LeadResponse:
    return LeadResponse(
        id=lead.id,
        external_user_id=lead.external_user_id,
        name=lead.name,
        email=lead.email,
        post_link=lead.post_link,
        post_date=lead.post_date,
        description=lead.description,
        platform=lead.platform,
        property_type=lead.property_type,
        location=lead.location,
        match_score=lead.match_score,
        score_bucket=bucket_score(lead.match_score),
        created_at=lead.created_at,
    )


async def save_leads(db: AsyncSession, user_id: int, leads: List[ScrapedLead]) -> int:
    """Persist scraped/ranked leads for a user. Skips duplicates on (user_id, post_link).

    Best-effort: a failure saving one row must never break the chat response
    the user is already waiting on, so each insert is isolated and swallowed.
    """
    saved = 0
    for scraped in leads:
        if not scraped.post_link:
            continue
        lead = Lead(
            user_id=user_id,
            external_user_id=scraped.userId,
            name=scraped.name,
            email=scraped.email,
            post_link=scraped.post_link,
            post_date=scraped.date,
            description=scraped.description,
            platform=scraped.platform,
            property_type=scraped.property_type,
            location=scraped.location,
            match_score=scraped.match_score,
        )
        db.add(lead)
        try:
            await db.commit()
            saved += 1
        except IntegrityError:
            await db.rollback()
        except Exception:
            await db.rollback()
    return saved


async def list_leads(db: AsyncSession, user_id: int, limit: int = 10, skip: int = 0) -> List[LeadResponse]:
    result = await db.execute(
        select(Lead)
        .where(Lead.user_id == user_id)
        .order_by(Lead.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    leads = result.scalars().all()
    return [_to_response(lead) for lead in leads]


async def get_stats(db: AsyncSession, user_id: int) -> LeadsStats:
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=7)

    total = await db.scalar(
        select(func.count()).select_from(Lead).where(Lead.user_id == user_id)
    ) or 0

    new_today = await db.scalar(
        select(func.count()).select_from(Lead)
        .where(Lead.user_id == user_id, Lead.created_at >= today_start)
    ) or 0

    new_this_week = await db.scalar(
        select(func.count()).select_from(Lead)
        .where(Lead.user_id == user_id, Lead.created_at >= week_start)
    ) or 0

    avg_score = await db.scalar(
        select(func.avg(Lead.match_score))
        .where(Lead.user_id == user_id, Lead.match_score.isnot(None))
    )
    avg_match_score_pct = round(avg_score * 100, 1) if avg_score is not None else None

    by_source: List[SourceBreakdown] = []
    qualified = 0
    if total > 0:
        rows = (await db.execute(
            select(Lead.platform, func.count()).where(Lead.user_id == user_id).group_by(Lead.platform)
        )).all()
        for platform, count in rows:
            by_source.append(SourceBreakdown(
                source=platform.value.capitalize(),
                count=count,
                percentage=round((count / total) * 100, 1),
            ))

        all_leads = (await db.execute(
            select(Lead.match_score).where(Lead.user_id == user_id)
        )).scalars().all()
        qualified = sum(1 for score in all_leads if bucket_score(score) == "High")

    return LeadsStats(
        total=total,
        new_today=new_today,
        new_this_week=new_this_week,
        qualified=qualified,
        avg_match_score_pct=avg_match_score_pct,
        by_source=by_source,
    )
