# Backend Documentation

This folder contains technical documentation for the **LeadAI Properties** FastAPI backend.

## Contents

| File | Description |
|---|---|
| [`api-overview.md`](./api-overview.md) | Full overview of all API routers, endpoints, and auth strategies |
| [`admin-api.md`](./admin-api.md) | Master Admin portal — all admin-only endpoints documented |
| [`properties-api.md`](./properties-api.md) | Property management endpoints for owners and admins |
| [`changelog.md`](./changelog.md) | History of backend changes |

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run the dev server
uvicorn app.main:app --reload

# View API docs in browser
http://127.0.0.1:8000/docs
```

## Base URL
```
http://127.0.0.1:8000/api/v1
```
