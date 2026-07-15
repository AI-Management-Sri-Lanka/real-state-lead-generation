# Frontend Documentation

This folder contains technical documentation for the **LeadAI Properties** React/Vite frontend.

## Contents

| File | Description |
|---|---|
| [`admin-portal.md`](./admin-portal.md) | Master Admin portal — pages, routing, and API integration |
| [`properties-ui.md`](./properties-ui.md) | Property browsing, listing, and management UI |
| [`changelog.md`](./changelog.md) | History of frontend changes |

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# App runs at:
http://localhost:5173
```

## Environment Variables

Create a `.env` file in the `Frontend/` root:
```env
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

## Tech Stack
- **Framework:** React 18 + Vite
- **Routing:** React Router v6
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **HTTP:** Native `fetch` (no Axios)
- **Auth:** JWT stored in `localStorage`
