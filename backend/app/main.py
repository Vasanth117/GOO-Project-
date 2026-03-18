from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import logging
import os

from app.config import settings
from app.database import connect_db, close_db

# ─── Phase 1 Routes ──────────────────────────────────────────
from app.routes import auth_routes, farm_routes, score_routes, notification_routes

# ─── Phase 2 Routes ──────────────────────────────────────────
from app.routes import mission_routes, proof_routes

# ─── Phase 3 Routes ──────────────────────────────────────────
from app.routes import social_routes, leaderboard_routes, grc_routes

# ─── Phase 4 Routes ──────────────────────────────────────────
from app.routes import ai_routes

# ─── Phase 5 Routes ──────────────────────────────────────────
from app.routes import marketplace_routes, reward_routes

# ─── Phase 6 Routes ──────────────────────────────────────────
from app.routes import admin_routes

# ─── Seeders ─────────────────────────────────────────────────
from app.services.badge_service import seed_badge_definitions
from app.services.mission_seeder import seed_missions
from app.jobs.scheduler import start_scheduler, stop_scheduler

# ─── LOGGING ─────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# ─── LIFESPAN (startup / shutdown) ───────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting GOO Backend...")
    client = await connect_db()
    app.state.mongo_client = client

    # Run seeders
    await seed_badge_definitions()
    await seed_missions()

    # Create upload directories
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "proofs"), exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "posts"), exist_ok=True)

    # Start background scheduler
    start_scheduler()

    logger.info(f"✅ GOO Backend ready → http://{settings.HOST}:{settings.PORT}/docs")
    yield

    # Shutdown
    logger.info("🔴 Shutting down GOO Backend...")
    stop_scheduler()
    await close_db(app.state.mongo_client)


# ─── APP INSTANCE ─────────────────────────────────────────────
app = FastAPI(
    title="GOO — Smart Sustainable Farming API",
    description=(
        "AI-driven, gamified sustainable farming ecosystem. "
        "Tracks farmer activities, guides with AI, verifies real-world "
        "behavior, uses gamification to enforce eco-habits."
    ),
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


# ─── CORS ─────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── STATIC FILES (proof uploads) ────────────────────────────
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


# ─── GLOBAL EXCEPTION HANDLER ─────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "Internal server error"},
    )


# ─── ROUTERS ──────────────────────────────────────────────────
API_PREFIX = "/api/v1"

# Phase 1
app.include_router(auth_routes.router, prefix=API_PREFIX)
app.include_router(farm_routes.router, prefix=API_PREFIX)
app.include_router(score_routes.router, prefix=API_PREFIX)
app.include_router(notification_routes.router, prefix=API_PREFIX)

# Phase 2
app.include_router(mission_routes.router, prefix=API_PREFIX)
app.include_router(proof_routes.router, prefix=API_PREFIX)

# Phase 3
app.include_router(social_routes.router, prefix=API_PREFIX)
app.include_router(leaderboard_routes.router, prefix=API_PREFIX)
app.include_router(grc_routes.router, prefix=API_PREFIX)

# Phase 4
app.include_router(ai_routes.router, prefix=API_PREFIX)

# Phase 5
app.include_router(marketplace_routes.router, prefix=API_PREFIX)
app.include_router(reward_routes.router, prefix=API_PREFIX)

# Phase 6
app.include_router(admin_routes.router, prefix=API_PREFIX)


@app.get(API_PREFIX, tags=["Health"])
async def api_root():
    """
    Overview of available API sub-modules.
    Note: You must use the full path (e.g., /api/v1/missions/active)
    """
    return {
        "message": "Welcome to GOO API v1",
        "available_modules": [
            "/auth", "/farm", "/score", "/missions",
            "/social", "/leaderboard", "/marketplace", "/admin"
        ],
        "example_paths": [
            "/api/v1/missions/active",
            "/api/v1/leaderboard/national",
            "/api/v1/auth/login"
        ]
    }


# ─── HEALTH CHECK ─────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running 🟢",
        "docs": "/docs",
        "phases_complete": [
            "Phase 1 - Foundation",
            "Phase 2 - Missions & Proof",
            "Phase 3 - Social & Leaderboard",
            "Phase 5 - Marketplace & Rewards",
            "Phase 6 - Admin Panel"
        ],
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "env": settings.APP_ENV}
