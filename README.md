<div align="center">

# 🏠 LeadAI

### AI-Powered Real Estate Lead Generation Platform

Find buyers before your competitors do — LeadAI scrapes social media, ranks leads with AI, and hands property owners a ready-to-work pipeline.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&labelColor=0F172A)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&labelColor=0F172A)](https://www.typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-async-009688?logo=fastapi&logoColor=white&labelColor=0F172A)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-4169E1?logo=postgresql&logoColor=white&labelColor=0F172A)](https://www.postgresql.org)
[![OpenAI](https://img.shields.io/badge/OpenAI-powered-412991?logo=openai&logoColor=white&labelColor=0F172A)](https://openai.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white&labelColor=0F172A)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-Proprietary-6B7280?labelColor=0F172A)](#-license)

[Quick Start](#-quick-start) · [Features](#-features) · [Docs](#-documentation) · [Tech Stack](#-tech-stack)

</div>

<br/>

## ✨ Overview

**LeadAI** helps property owners and agencies list real estate, generate qualified buyer leads straight from social media, and run the entire lead pipeline through one platform:

- 🤖 An **AI chat assistant** that scrapes Facebook, Instagram, TikTok & Google for buyer posts, ranks them, and returns structured lead cards
- 🏘️ A **property catalog** with owner-managed listings, images, and verification
- 📊 An **owner dashboard** with live stats, recent leads, and inquiries
- 🛡️ A **master admin portal**, fully isolated from customer accounts, for platform-wide moderation and analytics

## 🚀 Features

| | |
|---|---|
| 🔍 **Social lead scraping** | Apify-powered scrapers for Facebook, Instagram & TikTok, with an automatic Tavily web-search fallback when a platform comes up empty |
| 🧠 **AI lead ranking** | An LLM scores scraped leads against the owner's criteria and formats them as clean, clickable lead cards |
| 💬 **Conversational assistant** | The same chat auto-routes between lead search and plain conversation, and titles each session for you |
| 🏡 **Property management** | Full CRUD for listings — images, pricing, specs, verification — with owner-scoped permissions |
| 📈 **Dashboards** | Real-time KPIs for owners (leads, sources, scores) and platform admins (users, properties, sessions) |
| 🔐 **Dual-auth security** | Separate JWT namespaces for regular users and master admins, so admin access never overlaps customer permissions |
| 📥 **Inquiry capture** | Public contact + per-property forms that route straight to the owning agent, with email notifications |

## 🧱 Tech Stack

<div align="center">

| Layer | Stack |
|:---|:---|
| **Frontend** | React 18 · TypeScript · Vite · React Router · Tailwind CSS · Formik + Yup · react-markdown |
| **Backend** | FastAPI (async) · SQLAlchemy 2.0 · Pydantic · Alembic |
| **Database** | PostgreSQL + pgvector |
| **Vector store** | Qdrant |
| **AI** | OpenAI · Apify · Tavily |
| **Auth** | JWT (dual namespace: users + master admins) |
| **Infra** | Docker Compose |

</div>

## 🏗️ Architecture

```
┌─────────────┐   HTTPS / JSON   ┌──────────────────┐    ┌───────────────────────┐
│  Frontend    │ ───────────────▶│  FastAPI Backend  │───▶│  OpenAI · Apify · Tavily │
│  React+Vite  │◀─────────────── │  /api/v1  (layered)│    └───────────────────────┘
└─────────────┘                  └─────────┬─────────┘
                                            │
                          ┌─────────────────┼─────────────────┐
                          ▼                                   ▼
                  ┌───────────────┐                  ┌──────────────────┐
                  │  PostgreSQL     │                  │  Qdrant            │
                  │  + pgvector     │                  │  (AI vector memory)│
                  └───────────────┘                  └──────────────────┘
```

Backend requests flow **API → Service → CRUD → DB**, and every endpoint returns the same envelope:

```json
{ "success": true,  "data": { /* ... */ } }
{ "success": false, "error": { "code": "AUTH-001", "message": "...", "request_id": "..." } }
```

## ⚡ Quick Start

### Option A — Docker Compose (fastest)

```bash
cp Backend/.env.sample Backend/.env      # fill in real values — see Environment Variables
docker-compose up -d --build
```

| Service | URL |
|---|---|
| 🖥️ Frontend | http://localhost |
| ⚙️ Backend API | http://localhost:8000 (`/docs` for Swagger) |
| 🐘 Postgres | localhost:5432 |
| 🧭 Qdrant | localhost:6333 |

### Option B — Run locally

<details>
<summary><b>🔧 Backend setup</b></summary>

```bash
cd Backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.sample .env
docker-compose up -d db vector_db   # from repo root, separate terminal
alembic upgrade head
uvicorn app.main:app --reload
```

</details>

<details>
<summary><b>🎨 Frontend setup</b></summary>

```bash
cd Frontend
npm install
cp .env.example .env      # set VITE_API_URL=http://localhost:8000
npm run dev
```

</details>

## 🔑 Environment Variables

<details>
<summary><b>Backend/.env</b></summary>

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Async Postgres connection string |
| `QDRANT_URL` | Qdrant vector database endpoint |
| `OPENAI_API_KEY` | Chat, lead ranking, title generation |
| `APIFY_API_TOKEN` | Facebook / Instagram / TikTok scraping |
| `TAVILY_API_KEY` | Fallback lead search |
| `JWT_SECRET` | Access/refresh token signing |

</details>

<details>
<summary><b>Frontend/.env</b></summary>

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL (`/api/v1` appended automatically) |

</details>

> ⚠️ Never commit populated `.env` files. Rotate any key immediately if it's ever been pasted, shared, or committed.

## 📁 Project Structure

```
real-state-lead-generation/
├── Backend/                 FastAPI application
│   ├── app/
│   │   ├── api/v1/            11 route controllers
│   │   ├── core/               config, security, errors, logging, LLM/Qdrant clients
│   │   ├── crud/                database access
│   │   ├── models/              SQLAlchemy models
│   │   ├── schemas/             Pydantic contracts
│   │   └── services/            business logic + AI orchestration + scrapers
│   └── docs/                  admin-api.md · properties-api.md · master_admin_architecture.md
├── Frontend/                 React + TypeScript SPA
│   └── src/
│       ├── api/ · components/ · contexts/ · hooks/ · pages/
└── docker-compose.yml
```

## 📚 Documentation

Everything below links to docs that already live inside this repo:

| Doc | What's inside |
|---|---|
| [`Backend/README.md`](./Backend/README.md) | Backend architecture deep-dive (layered API → Service → CRUD → DB, error handling, response envelope) |
| [`Backend/docs/admin-api.md`](./Backend/docs/admin-api.md) | Master admin API reference |
| [`Backend/docs/properties-api.md`](./Backend/docs/properties-api.md) | Properties API reference |
| [`Backend/docs/master_admin_architecture.md`](./Backend/docs/master_admin_architecture.md) | Master admin auth & isolation design |
| [`Frontend/README_local.md`](./Frontend/README_local.md) | Frontend structure & local setup |
| [`Frontend/docs/admin-portal.md`](./Frontend/docs/admin-portal.md) | Admin portal UI reference |
| [`Frontend/docs/properties-ui.md`](./Frontend/docs/properties-ui.md) | Properties UI reference |


## 🗺️ Roadmap / Status

- [x] Property listings & public catalog
- [x] AI chat assistant with social lead scraping + ranking
- [x] Owner dashboard & inquiries
- [x] Master admin portal

## 📄 License

Proprietary — all rights reserved.

---

<div align="center">
<sub>Built with React, FastAPI, and a healthy amount of AI.</sub>
</div>
