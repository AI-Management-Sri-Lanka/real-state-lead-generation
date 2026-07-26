from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta
from typing import List, Dict, Any

import re
from app.models.inquiry import Inquiry
from app.models.properties import Property
from app.models.session import Session
from app.models.message import Message
from app.schemas.inquiry_schema import (
    InquiryCreate, InquiryResponse, OwnerDashboardStats,
    LeadItemSchema, SourceBreakdownItem, ScoreBreakdownItem
)

class InquiryService:
    async def create_inquiry(self, db: AsyncSession, payload: InquiryCreate) -> Inquiry:
        inquiry = Inquiry(
            property_id=payload.property_id,
            name=payload.name,
            email=payload.email,
            phone=payload.phone,
            message=payload.message,
            source=payload.source or "contact_page"
        )
        db.add(inquiry)
        await db.commit()
        await db.refresh(inquiry)
        return inquiry

    def _get_initials(self, name: str) -> str:
        parts = name.strip().split()
        if len(parts) >= 2:
            return (parts[0][0] + parts[-1][0]).upper()
        elif len(parts) == 1 and parts[0]:
            return parts[0][:2].upper()
        return "IN"

    def _get_color(self, score: str) -> str:
        if score == "High":
            return "#4f7df3"
        elif score == "Medium":
            return "#27ae60"
        return "#e74c3c"

    def _classify_score(self, message: str) -> str:
        if not message:
            return "Low"
            
        msg_lower = message.lower()
        score_points = 0
        
        # 1. Length weight
        if len(message) < 15:
            score_points -= 2
        elif len(message) > 50:
            score_points += 1
        
        if len(message) > 100:
            score_points += 1
            
        # 2. Timeline / Urgency Intent
        urgency_keywords = ["immediate", "urgent", "ready", "now", "quick", "asap", "this week", "next month", "soon"]
        if any(kw in msg_lower for kw in urgency_keywords):
            score_points += 2
            
        # 3. Financial / Buying Intent
        financial_keywords = ["buy", "purchase", "invest", "budget", "price", "cash", "loan", "mortgage", "$", "aud", "rs", "lkr", "usd"]
        if any(kw in msg_lower for kw in financial_keywords):
            score_points += 2
            
        # 4. Specificity / Property terms
        property_keywords = ["bedroom", "bathroom", "sqft", "viewing", "inspect", "tour", "visit", "location"]
        if any(kw in msg_lower for kw in property_keywords):
            score_points += 1
            
        # 5. Verified Buyer Qualification
        # Automatically boost leads who submitted top-tier questionnaire answers
        verified_keywords = [
            "120k", "150k", "180k+",
            "300k+ equity",
            "yes – $40k", "yes – $80k+",
            "superannuation ($230k+): yes"
        ]
        if any(kw in msg_lower for kw in verified_keywords):
            score_points += 3
            
        # Classify based on points
        if score_points >= 3:
            return "High"
        elif score_points >= 1:
            return "Medium"
        return "Low"

    async def get_owner_stats(self, db: AsyncSession, owner_id: int) -> OwnerDashboardStats:
        # 1. Get properties owned by this owner
        properties_result = await db.execute(
            select(Property).where(Property.owner_id == owner_id)
        )
        properties = properties_result.scalars().all()
        prop_ids = [p.id for p in properties]
        prop_map = {p.id: p for p in properties}
        total_properties = len(properties)

        # 2. Get total AI chats count for this owner
        chats_result = await db.execute(
            select(func.count(Session.id)).where(Session.user_id == owner_id)
        )
        total_chats = chats_result.scalar() or 0

        # 3. Get scraped leads count from assistant messages in owner's sessions
        messages_result = await db.execute(
            select(Message.content)
            .join(Session)
            .where(and_(Session.user_id == owner_id, Message.role == "assistant"))
        )
        assistant_messages = messages_result.scalars().all()
        scraped_leads = 0
        for content in assistant_messages:
            match = re.search(r"Found (\d+) [Pp]otential [Ll]ead", content)
            if match:
                scraped_leads += int(match.group(1))

        if not prop_ids:
            return OwnerDashboardStats(
                total_inquiries=0,
                qualified_leads=0,
                new_leads_today=0,
                ai_match_rate="0%",
                leads_by_source=[],
                score_breakdown=[],
                recent_leads=[],
                total_properties=total_properties,

                total_chats=total_chats,
                scraped_leads=scraped_leads
            )

        # 2. Get inquiries linked to these properties
        inquiries_result = await db.execute(
            select(Inquiry).where(Inquiry.property_id.in_(prop_ids)).order_by(Inquiry.created_at.desc())
        )
        inquiries = inquiries_result.scalars().all()

        total_inquiries = len(inquiries)
        
        # Calculate new leads today (last 24 hours)
        one_day_ago = datetime.utcnow() - timedelta(days=1)
        new_leads_today = sum(1 for i in inquiries if i.created_at >= one_day_ago)

        # Calculate scores and qualified count
        qualified_leads = 0
        recent_leads_list = []
        source_counts = {}
        score_counts = {"High": 0, "Medium": 0, "Low": 0}

        for i in inquiries:
            score = self._classify_score(i.message or "")
            score_counts[score] += 1
            if score in ["High", "Medium"]:
                qualified_leads += 1

            source = i.source or "Website"
            source_counts[source] = source_counts.get(source, 0) + 1

            # Build lead item schema
            prop = prop_map.get(i.property_id)
            location = prop.location if prop else "Unknown"
            amount = f"{prop.currency} {prop.price:,.0f}" if prop else "N/A"

            lead_item = LeadItemSchema(
                id=i.id,
                name=i.name,
                email=i.email,
                phone=i.phone,
                location=location,
                amount=amount,
                score=score,
                initials=self._get_initials(i.name),
                color=self._get_color(score),
                created_at=i.created_at
            )
            recent_leads_list.append(lead_item)

        # Build breakdowns
        leads_by_source = []
        source_colors = {
            "Facebook": "#4f7df3",
            "Instagram": "#f5a623",
            "TikTok": "#a78bfa",
            "property_page": "#3b82f6",
            "contact_page": "#10b981",
            "Website": "#6b7280"
        }
        for src, count in source_counts.items():
            percentage = (count / total_inquiries * 100) if total_inquiries > 0 else 0
            leads_by_source.append(SourceBreakdownItem(
                source=src,
                percentage=round(percentage, 1),
                amount=count,
                color=source_colors.get(src, "#6b7280")
            ))

        score_breakdown = []
        score_colors = {
            "High": "#27ae60",
            "Medium": "#f5a623",
            "Low": "#e74c3c"
        }
        for lbl, count in score_counts.items():
            percentage = (count / total_inquiries * 100) if total_inquiries > 0 else 0
            score_breakdown.append(ScoreBreakdownItem(
                label=lbl,
                percentage=round(percentage, 1),
                color=score_colors.get(lbl, "#6b7280")
            ))

        # AI match rate: calculate percentage of High/Medium leads
        match_rate_pct = (qualified_leads / total_inquiries * 100) if total_inquiries > 0 else 85.0
        ai_match_rate = f"{round(match_rate_pct, 0):.0f}%"

        return OwnerDashboardStats(
            total_inquiries=total_inquiries,
            qualified_leads=qualified_leads,
            new_leads_today=new_leads_today,
            ai_match_rate=ai_match_rate,
            leads_by_source=leads_by_source,
            score_breakdown=score_breakdown,
            recent_leads=recent_leads_list[:5],
            total_properties=total_properties,

            total_chats=total_chats,
            scraped_leads=scraped_leads
        )

    async def get_owner_inquiries(self, db: AsyncSession, owner_id: int, property_id: int | None = None) -> List[InquiryResponse]:
        # Get properties owned by this owner
        prop_query = select(Property).where(Property.owner_id == owner_id)
        if property_id:
            prop_query = prop_query.where(Property.id == property_id)
            
        properties_result = await db.execute(prop_query)
        properties = properties_result.scalars().all()
        prop_ids = [p.id for p in properties]
        prop_map = {p.id: p.title for p in properties}

        if not prop_ids:
            return []

        # Get inquiries linked to these properties
        inquiries_result = await db.execute(
            select(Inquiry).where(Inquiry.property_id.in_(prop_ids)).order_by(Inquiry.created_at.desc())
        )
        inquiries = inquiries_result.scalars().all()

        return [
            InquiryResponse(
                id=i.id,
                property_id=i.property_id,
                property_title=prop_map.get(i.property_id),
                name=i.name,
                email=i.email,
                phone=i.phone,
                message=i.message,
                source=i.source,
                created_at=i.created_at
            ) for i in inquiries
        ]

inquiry_service = InquiryService()
