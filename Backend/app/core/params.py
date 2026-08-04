from typing import Dict, Any
import yaml
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent.parent
_CONFIG_DIR = BASE_DIR / "config"

def _load_yaml(filename: str) -> Dict[str, Any]:
    filepath = _CONFIG_DIR / filename
    if not filepath.exists():
        return {}
    with open(filepath, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def _get_nested(d: Dict, *keys, default=None):
    for key in keys:
        if isinstance(d, dict):
            d = d.get(key, default)
        else:
            return default
    return d if d is not None else default


_PARAMS = _load_yaml("params.yml")

SCRAPING_LIMIT = _get_nested(_PARAMS, "scraping", "limit", default=10)
SCRAPING_TIMEOUT = _get_nested(_PARAMS, "scraping", "timeout", default=30)

VECTOR_SEARCH_TOP_K = _get_nested(_PARAMS, "vector_search", "top_k", default=10)
VECTOR_SEARCH_SIMILARITY_THRESHOLD = _get_nested(_PARAMS, "vector_search", "similarity_threshold", default=0.7)
VECTOR_SIZE = _get_nested(_PARAMS, "vector_search", "vector_size", default=1536)


