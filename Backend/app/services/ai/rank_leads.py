import uuid
from datetime import datetime
from typing import List
from qdrant_client.models import Distance, VectorParams, PointStruct
from app.core.params import VECTOR_SEARCH_TOP_K, VECTOR_SIZE
from app.core.qdrant_db_client import get_qdrant_client
from app.core.embedder import get_embedder
from app.schemas.lead_schema import ScrapedLead, Platform, PropertyType


class RankLeads:
    def __init__(self):
        self.qdrant_client = get_qdrant_client()
        self.embedder = get_embedder()
        self.collection_name = f"leads_{uuid.uuid4().hex[:8]}"

    def _prepare_collection(self):
        # Check if collection already exists before creating
        try:
            self.qdrant_client.get_collection(collection_name=self.collection_name)
        except Exception:
            # Collection doesn't exist, create it
            self.qdrant_client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
            )

    def _index_leads(self, leads: List[ScrapedLead]):
        texts = [lead.description for lead in leads]
        embeddings = self.embedder.embed_documents(texts)

        points = []
        for i, (lead, embedding) in enumerate(zip(leads, embeddings)):
            points.append(
                PointStruct(
                    id=i,
                    vector=embedding,
                    payload=lead.model_dump(mode="json")
                )
            )

        self.qdrant_client.upsert(
            collection_name=self.collection_name,
            points=points
        )

    def rank_leads(self, query: str, leads: List[ScrapedLead]) -> List:
        self._prepare_collection()
        self._index_leads(leads)

        search_results = self.qdrant_client.query_points(
            collection_name=self.collection_name,
            query=self.embedder.embed_query(query),
            limit=VECTOR_SEARCH_TOP_K,
        )

        ranked_leads: List[ScrapedLead] = []
        for hit in search_results.points:
            ranked_leads.append(ScrapedLead(**hit.payload))

        self.qdrant_client.delete_collection(self.collection_name)
        
        return ranked_leads
 
    
# Testing feat: rank-leads
if __name__ == "__main__":
    
    ranker = RankLeads()

    dummy_scraped_posts = [
        ScrapedLead(
            userId="colombo_buyer",
            name="Asindu De Silva",
            email="asindu@example.com",
            post_link="https://facebook.com/posts/1",
            date=datetime.now(),
            description="Looking for a 2-bedroom apartment in Colombo under 25 million LKR. Immediate purchase.",
            platform=Platform.facebook,
            property_type=PropertyType.apartment,
            location="Colombo"
        ),
        ScrapedLead(
            userId="galle_investor",
            name="John Keells",
            email="john@example.com",
            post_link="https://instagram.com/posts/2",
            date=datetime.now(),
            description="Beachfront luxury villa or resort in Galle / Bentota for tourism investment. Budget is open.",
            platform=Platform.instagram,
            property_type=PropertyType.villa,
            location="Galle"
        ),
        ScrapedLead(
            userId="kandy_family",
            name="Saman Perera",
            email="saman@example.com",
            post_link="https://tiktok.com/posts/3",
            date=datetime.now(),
            description="Looking for a home with a garden in Kandy for a family. Preferably in a quiet neighborhood.",
            platform=Platform.tiktok,
            property_type=PropertyType.house,
            location="Kandy"
        ),
        ScrapedLead(
            userId="random_user",
            name="Random Post",
            email=None,
            post_link="https://facebook.com/posts/4",
            date=datetime.now(),
            description="Just had a great lunch in Colombo! Highly recommend the rice and curry.",
            platform=Platform.facebook,
            property_type=PropertyType.unknown,
            location="Colombo"
        )
    ]

    queries = [
        "Looking for a 2-bedroom apartment in Colombo under 25 million LKR",
        "Beachfront luxury villa or resort in Galle / Bentota for tourism investment",
        "Looking for a home with a garden in Kandy for a family"
    ]

    results = ranker.rank_leads(query=queries[1], leads=dummy_scraped_posts)

    for idx, res in enumerate(results):
        print(f"{idx + 1}. Buyer: @{res.userId} (Platform: {res.platform.value})")
        print(f"   Post: \"{res.description}\"\n")
    