from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.core.llm_provider import get_llm
from app.services.ai.prompts import router_system_prompt, router_user_prompt
from app.services.apify import run_scraper          # ← scraper package
from app.services.ai.rank_leads import RankLeads    # ← ranker


class Router:
    def __init__(self):
        self.llm    = get_llm()
        self.ranker = RankLeads()

    def chat(self, user_query: str) -> dict:
        #classify query and extract real-estate preferences
        prompt = ChatPromptTemplate.from_messages([
            ("system", router_system_prompt),
            ("user",   router_user_prompt),
        ])
        chain   = prompt | self.llm | JsonOutputParser()
        routing = chain.invoke({"user_query": user_query})

        #lead search path 
        if routing.get("lead_search"):
            scraper_input = _build_scraper_input(routing)
            leads         = run_scraper(scraper_input)      
            ranked        = self.ranker.rank_leads(         
                query=user_query,
                leads=leads,
            )
            return {
                "type":         "lead_search",
                "routing":      routing,
                "ranked_leads": ranked,
            }

        # simple chat path — caller handles DirectChatTool
        return {
            "type":    "simple_chat",
            "routing": routing,
        }


def _build_scraper_input(routing: dict) -> dict:
    """
    Convert LLM-extracted preferences into apify scraper input_data format.
    Falls back to broad real-estate defaults when nothing specific is extracted.
    """
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
        "instagram": True,
        "tiktok":    False,    
        "hashtags":  hashtags,
        "keywords":  keywords,
        "limit":     3,
    }