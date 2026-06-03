from typing import List
from qdrant_client.models import Distance, VectorParams, PointStruct
from app.core.params import VECTOR_SEARCH_TOP_K, VECTOR_SIZE
from app.core.qdrant_db_client import get_qdrant_client
from app.core.embedder import get_embedder

# --- Dummy data for testing (to be replaced with actual web scraping later) ---
dummy_scraped_posts = [
    {
      "username": "colombo_property_hunter",
      "platform": "Facebook",
      "post": "Hi everyone, I’m currently looking for a modern 2-bedroom apartment in Colombo, preferably around Colombo 05 or Colombo 07. My budget is under 25 million LKR. I’d prefer a place with parking, good security, and easy access to supermarkets and public transport. Please message me if you know any good options or ongoing projects."
    },
    {
      "username": "invest_with_nimal",
      "platform": "Instagram",
      "post": "Exploring investment opportunities in Sri Lanka’s southern coast. Mainly interested in luxury villas in Galle or nearby beach areas that can generate Airbnb or short-term rental income. Looking for properties with high tourism demand and strong resale value in the future."
    },
    {
      "username": "homebuyer_ash",
      "platform": "Facebook",
      "post": "My family and I are searching for a house in Kandy with at least 3 bedrooms and a small garden space. Budget is around 15 to 20 million LKR. We’d prefer a quiet residential area close to schools and hospitals. If anyone has recommendations or knows agents, let me know."
    },
    {
      "username": "realestate_enthusiast",
      "platform": "Instagram",
      "post": "Thinking about investing in land near Negombo beach area. Looking for long-term appreciation and tourism-related development opportunities. Open to hearing about gated communities, beachfront plots, or commercial land suitable for future hotel or villa projects."
    },
    {
      "username": "future_landlord",
      "platform": "Facebook",
      "post": "I want to invest in apartments in Colombo mainly for rental income. Looking for areas with high tenant demand from working professionals and expats. Budget depends on the project, but I’m mostly interested in properties with good ROI and low maintenance costs."
    },
    {
      "username": "startup_ceylon",
      "platform": "LinkedIn",
      "post": "Our startup team is looking for a small office space in Colombo 03 or Colombo 04. Need something modern with good internet connectivity, parking facilities, and room for around 10 employees. Prefer a long-term lease option with flexible payment plans."
    },
    {
      "username": "luxury_living_sl",
      "platform": "Instagram",
      "post": "Searching for a premium penthouse apartment in Colombo with ocean views, luxury amenities, gym access, and private parking. Interested in upscale developments suitable for both personal living and future investment purposes. Budget is flexible for the right property."
    },
    {
      "username": "firsthome_dinuka",
      "platform": "Facebook",
      "post": "I’m a first-time home buyer looking for an affordable house in Kurunegala. Prefer a peaceful neighborhood with access to schools and public transport. Budget is limited, so I’m open to older houses that may need small renovations."
    },
    {
      "username": "propertyinvestor99",
      "platform": "Twitter",
      "post": "Researching high ROI real estate opportunities in Sri Lanka for 2026. Interested in apartments, commercial buildings, or tourism-related properties with strong future growth potential. Looking for areas with increasing infrastructure development and foreign investor interest."
    },
    {
      "username": "beachvilla_seek",
      "platform": "Instagram",
      "post": "Looking for beachfront villas in Bentota or nearby coastal towns for tourism investment. Ideally interested in properties suitable for boutique hotel conversion or luxury vacation rentals. Need something with direct beach access and strong tourist appeal."
    }
]

queries = [
    "Looking for a 2-bedroom apartment in Colombo under 25 million LKR",
    "Beachfront luxury villa or resort in Galle / Bentota for tourism investment",
    "Looking for a home with a garden in Kandy for a family"
]

class RankLeads:
    def __init__(self):
        self.qdrant_client = get_qdrant_client()
        self.embedder = get_embedder()
        self.collection_name = "leads"

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

    def _get_dummy_leads(self) -> List:
      """Return dummy leads for testing (web scraping not yet implemented)."""
      return dummy_scraped_posts


    def rank_leads(self, query: str, leads: List) -> List:
        # Use dummy data if no leads provided (web scraping not yet implemented)
        if not leads:
            leads = self._get_dummy_leads()
        
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
    
 
    
# Testing feat: rank-leads
if __name__ == "__main__":
    
    ranker = RankLeads()

    results = ranker.rank_leads(query=queries[1], leads=dummy_scraped_posts)

    for idx, res in enumerate(results):
        print(f"{idx + 1}. Buyer: @{res['username']} (Platform: {res['platform']}) | Score: {res['score']:.4f}")
        print(f"   Post: \"{res['post']}\"\n")
    