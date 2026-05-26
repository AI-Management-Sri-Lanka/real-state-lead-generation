from typing import List

from qdrant_client.models import Distance, VectorParams, PointStruct

from app.core.params import VECTOR_SEARCH_TOP_K, VECTOR_SIZE
from app.core.qdrant_db_client import get_qdrant_client
from app.core.embedder import get_embedder


class RankLeads:
    def __init__(self):
        self.qdrant_client = get_qdrant_client()
        self.embedder = get_embedder()
        self.collection_name = "leads"

    def _prepare_collection(self):
        self.qdrant_client.create_collection(
            collection_name=self.collection_name,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )

    def _index_leads(self, leads: List):
        texts = [lead["post"] for lead in leads]
        embeddings = self.embedder.embed_documents(texts)

        points = []
        for i, (lead, embedding) in enumerate(zip(leads, embeddings)):
            points.append(
                PointStruct(
                    id=i,
                    vector=embedding,
                    payload=lead
                )
            )

        self.qdrant_client.upsert(
            collection_name=self.collection_name,
            points=points
        )

    def rank_leads(self, query: str, leads: List) -> List:
        self._prepare_collection()
        self._index_leads(leads)

        search_results = self.qdrant_client.query_points(
            collection_name=self.collection_name,
            query=self.embedder.embed_query(query),
            limit=VECTOR_SEARCH_TOP_K,
        )

        ranked_leads = []
        for hit in search_results.points:
            ranked_leads.append({
                "username": hit.payload.get("username"),
                "platform": hit.payload.get("platform"),
                "post": hit.payload.get("post"),
                "score": hit.score
            })

        self.qdrant_client.delete_collection(self.collection_name)
        
        return ranked_leads
    