from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth
from app.db.base_class import Base
from app.db.session import engine
from app.api.v1.session_router import router as session_router

app = FastAPI(
    title="Real Estate Lead Generation API",
    description="AI-powered real estate lead generation platform",
    version="0.1.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # React/Vite dev server
        "http://localhost:3000",  # Alternative dev port
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(session_router) 

@app.on_event("startup")
async def startup():
    """Create database tables on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "Real Estate Lead Generation API"}
