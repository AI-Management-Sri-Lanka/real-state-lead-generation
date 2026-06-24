from typing import List
from qdrant_client.models import Distance, VectorParams, PointStruct
from app.core.params import VECTOR_SEARCH_TOP_K, VECTOR_SIZE
from app.core.qdrant_db_client import get_qdrant_client
from app.core.embedder import get_embedder


class RankLeads:
    def __init__(self):
        self.qdrant_client   = get_qdrant_client()
        self.embedder        = get_embedder()
        self.collection_name = "leads"

    #private helpers

    def _prepare_collection(self):
        try:
            self.qdrant_client.get_collection(collection_name=self.collection_name)
        except Exception:
            self.qdrant_client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
            )

    def _normalize_lead(self, lead: dict) -> dict:
        """
        Map scraper output fields → rank_leads internal fields.

        Scraper returns:  userId, name, email, post_link, date, description, platform
        rank_leads needs: username, platform, post  (+ passthrough extras)
        """
        return {
            "username":  lead.get("userId")      or lead.get("username",  "unknown"),
            "name":      lead.get("name",         ""),
            "email":     lead.get("email",        ""),
            "post_link": lead.get("post_link",    ""),
            "date":      lead.get("date",         ""),
            "platform":  lead.get("platform",     ""),
            # 'post' is the text field used for embedding
            "post":      lead.get("description")  or lead.get("post", ""),
        }

    def _index_leads(self, leads: List[dict]):
        normalized = [self._normalize_lead(l) for l in leads]
        # drop leads that have no text to embed
        normalized = [l for l in normalized if l["post"].strip()]

        if not normalized:
            print("[RankLeads] No leads with text content to index.")
            return

        texts      = [lead["post"] for lead in normalized]
        embeddings = self.embedder.embed_documents(texts)

        points = [
            PointStruct(id=i, vector=emb, payload=lead)
            for i, (lead, emb) in enumerate(zip(normalized, embeddings))
        ]
        self.qdrant_client.upsert(
            collection_name=self.collection_name,
            points=points,
        )

    #public API

    def rank_leads(self, query: str, leads: List[dict]) -> List[dict]:
        """
        Main entry point called by router.py.

        Args:
            query : original user query string (used as search vector)
            leads : raw list returned by run_scraper()

        Returns:
            ranked list of lead dicts, best match first, each with a 'score' field
        """
        if not leads:
            print("[RankLeads] No leads received from scraper — returning empty list.")
            return []

        self._prepare_collection()
        self._index_leads(leads)

        search_results = self.qdrant_client.query_points(
            collection_name=self.collection_name,
            query=self.embedder.embed_query(query),
            limit=VECTOR_SEARCH_TOP_K,
        )

        ranked_leads = [
            {
                "username":  hit.payload.get("username"),
                "name":      hit.payload.get("name"),
                "email":     hit.payload.get("email"),
                "platform":  hit.payload.get("platform"),
                "post":      hit.payload.get("post"),
                "post_link": hit.payload.get("post_link"),
                "date":      hit.payload.get("date"),
                "score":     hit.score,
            }
            for hit in search_results.points
        ]

        # clean up collection after each run to avoid stale data
        self.qdrant_client.delete_collection(self.collection_name)

        return ranked_leads


# ── local test ───────────────────────────────────────────────────────────
if __name__ == "__main__":

    mock_leads = [
        {
            "userId":      "colombo_property_hunter",
            "name":        "Colombo Hunter",
            "email":       "",
            "post_link":   "https://www.instagram.com/p/abc123/",
            "date":        "2025-06-01",
            "description": "Looking for a 2-bedroom apartment in Colombo 05 under 25 million LKR.",
            "platform":    "instagram",
        },
        {
            "userId":      "invest_with_nimal",
            "name":        "Nimal Perera",
            "email":       "",
            "post_link":   "https://www.instagram.com/p/def456/",
            "date":        "2025-05-20",
            "description": "Exploring luxury villa investments on the southern coast of Sri Lanka.",
            "platform":    "instagram",
        },
    ]

    ranker  = RankLeads()
    results = ranker.rank_leads(
        query="luxury villa investment near Galle",
        leads=mock_leads,
    )

    for idx, res in enumerate(results):
        print(f"{idx + 1}. @{res['username']} ({res['platform']}) | Score: {res['score']:.4f}")
        print(f"   {res['post']}\n")