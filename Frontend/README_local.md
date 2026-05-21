# AIMSL Frontend

AI-Powered Real Estate Lead Generation — React + TypeScript frontend.

---

## Project Structure

```
src/
├── api/
│   ├── authApi.ts          # Auth endpoints (sign in / sign up)
│   └── chatApi.ts          # AI chat endpoint (calls FastAPI → OpenAI)
│
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.tsx   # Wraps pages with sidebar
│   │   └── Sidebar.tsx           # Left navigation
│   └── ui/
│       ├── Avatar.tsx            # User avatar / initials
│       ├── Button.tsx            # Reusable button (variants: primary, secondary, ghost, danger)
│       ├── Input.tsx             # Input with label, error, icons, password toggle
│       ├── Logo.tsx              # AIMSL logo mark + wordmark
│       └── TypingIndicator.tsx   # Animated dots (AI is typing)
│
├── contexts/
│   └── AuthContext.tsx     # Global auth state (user, signIn, signUp, signOut)
│
├── hooks/
│   ├── useAuth.ts          # Consumes AuthContext
│   ├── useChat.ts          # Chat state + API calls
│   ├── useForm.ts          # Generic form state + validation
│   └── useLocalStorage.ts  # Persistent local state
│
├── pages/
│   ├── auth/
│   │   ├── SignInPage.tsx
│   │   └── SignUpPage.tsx
│   └── dashboard/
│       └── AIAssistantPage.tsx
│
├── styles/
│   ├── colors.ts           # ← ALL colors live here (single source of truth)
│   └── globals.css         # CSS variables + resets + keyframe animations
│
├── App.tsx                 # Router
└── main.tsx                # Entry point
```

---

## Installation

### Prerequisites
- Node.js 18+ (download from https://nodejs.org)
- npm (comes with Node)

### Steps

```bash
# 1. Navigate into the project
cd aimsl-frontend

# 2. Install all dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Edit .env — set your backend URL
# VITE_API_URL=http://localhost:8000

# 5. Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Packages Installed

| Package | Purpose |
|---|---|
| react + react-dom | UI framework |
| react-router-dom | Client-side routing |
| axios | HTTP client for API calls |
| react-hot-toast | Toast notifications |
| lucide-react | Icon library (outline icons) |
| clsx | Conditional class names |
| vite | Build tool / dev server |
| typescript | Type safety |

---

## Color System

All colors are defined in `src/styles/colors.ts`.

To change the color theme, edit that file only — changes propagate everywhere.

Key color groups:
- `colors.brand`    — primary green, accent mint
- `colors.neutral`  — dark background scale
- `colors.semantic` — success, warning, error, info
- `colors.ai`       — chat bubble colors
- `colors.auth`     — sign in / sign up page

---

## Connecting to Your FastAPI Backend

The `src/api/chatApi.ts` file sends POST requests to `{VITE_API_URL}/api/chat`.

Your FastAPI route should accept:
```json
{ "message": "string", "history": [{"role": "user"|"assistant", "content": "string"}] }
```
And return:
```json
{ "reply": "string" }
```

While the backend is not running, the app shows demo responses automatically.

---

## Building for Production

```bash
npm run build
```

Output goes to `dist/` — deploy to AWS S3 + CloudFront or any static host.
