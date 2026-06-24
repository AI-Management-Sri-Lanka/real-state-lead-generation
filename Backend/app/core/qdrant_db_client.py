from typing import Optional

from qdrant_client import QdrantClient

from app.core.config import settings

_qdrant_client: Optional[QdrantClient] = None

def get_qdrant_client() -> QdrantClient:

    global _qdrant_client
    if _qdrant_client is not None:
        return _qdrant_client

    _qdrant_client = QdrantClient(url=settings.QDRANT_URL)
    return _qdrant_client
