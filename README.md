# 🌱 GOO — Smart Sustainable Farming Ecosystem
> **Last Updated:** 2026-03-17 23:34 IST  
> **Version:** 0.1.0 (Phase 1 — Backend Foundation)  
> **Status:** 🟡 In Development

---

## 📌 WHAT IS GOO?

GOO is an **AI-driven, gamified sustainable farming platform** that:

- Tracks farmer activities continuously
- Guides farmers using AI recommendations
- Verifies real-world farming behavior via proof uploads
- Uses gamification (missions, streaks, badges, leaderboards) to enforce eco-habits
- Builds a social + economic ecosystem for farmers

> **Goal:** Convert farming into measurable, competitive, and sustainable behavior.

---

## 🧑‍🤝‍🧑 USER ROLES

| Role | Description |
|---|---|
| 👨‍🌾 **Farmer** | Primary user — completes missions, earns rewards |
| 👨‍🔬 **Expert / Verifier** | Reviews farms, confirms sustainability |
| 🛒 **Seller** | Lists eco products in marketplace |
| 🛠 **Admin** | Controls platform, detects fraud |
| 🌍 **GRC (Green Revolution Club)** | Elite verified farmers, community validators |

---

## 🗂️ PROJECT STRUCTURE

```
E:\GOO\
├── README.md                        ← YOU ARE HERE (living project log)
└── backend\                         ← Python FastAPI Backend
    ├── .env                         ← Environment variables (local, not committed)
    ├── .env.example                 ← Env variable template
    ├── requirements.txt             ← Python dependencies
    ├── run.py                       ← Server entry point
    └── app\
        ├── main.py                  ← FastAPI app, CORS, lifespan, routers
        ├── config.py                ← Pydantic settings from .env
        ├── database.py              ← MongoDB + Beanie ODM initialization
        │
        ├── models\                  ← MongoDB Document models (Beanie ODM)
        │   ├── user.py              ← User (roles, status)
        │   ├── farm_profile.py      ← Farm Digital ID
        │   ├── mission.py           ← Mission templates
        │   ├── mission_progress.py  ← Per-farmer mission tracking
        │   ├── proof_submission.py  ← Proof uploads + AI results
        │   ├── score.py             ← Score change log (audit trail)
        │   ├── streak.py            ← Streak tracking
        │   ├── badge.py             ← Badge definitions + farmer badges
        │   ├── reward.py            ← Points wallet + vouchers
        │   ├── notification.py      ← In-app notifications
        │   ├── post.py              ← Social feed posts
        │   ├── comment.py           ← Comments on posts
        │   ├── reaction.py          ← Likes on posts
        │   ├── follow.py            ← Follow relationships
        │   ├── product.py           ← Marketplace products
        │   ├── order.py             ← Marketplace orders
        │   ├── leaderboard.py       ← Cached leaderboard data
        │   ├── fraud_flag.py        ← Fraud detection records
        │   ├── verification.py      ← GRC/Expert farm verifications
        │   ├── grc_member.py        ← Green Revolution Club registry
        │   └── refresh_token.py     ← JWT refresh token storage
        │
        ├── schemas\                 ← Pydantic request/response models
        │   ├── auth_schema.py       ← Register, Login, Token schemas
        │   ├── farm_schema.py       ← Farm create/update/checkin schemas
        │   └── common_schema.py     ← Standard API + paginated response
        │
        ├── controllers\             ← Business logic layer
        │   ├── auth_controller.py   ← Register, login, refresh, logout
        │   └── farm_controller.py   ← Farm CRUD + weekly check-in
        │
        ├── routes\                  ← FastAPI route definitions
        │   ├── auth_routes.py       ← /api/v1/auth/*
        │   ├── farm_routes.py       ← /api/v1/farm/*
        │   ├── score_routes.py      ← /api/v1/score/*
        │   └── notification_routes.py ← /api/v1/notifications/*
        │
        ├── services\                ← Reusable business services
        │   ├── score_service.py     ← Score update engine + tier logic
        │   ├── streak_service.py    ← Streak update + milestone bonuses
        │   ├── badge_service.py     ← Badge check + award + seeder
        │   └── notification_service.py ← Creates notification records
        │
        ├── utils\                   ← Utility helpers
        │   ├── jwt_utils.py         ← Create/decode JWT tokens
        │   ├── password_utils.py    ← bcrypt hash + verify
        │   ├── gps_utils.py         ← Haversine distance (GPS validation)
        │   └── response_utils.py    ← Standard success/error responses
        │
        ├── middleware\
        │   └── auth_middleware.py   ← JWT guard + role-based access control
        │
        └── jobs\                    ← Background cron jobs (APScheduler)
            ├── scheduler.py         ← Registers + starts all jobs
            ├── score_decay_job.py   ← Nightly score decay for inactivity
            ├── mission_job.py       ← Daily mission generation + expiry check
            └── leaderboard_job.py   ← 6-hourly leaderboard cache rebuild
```

---

## ⚙️ TECH STACK

| Layer | Technology |
|---|---|
| **Language** | Python 3.11+ |
| **Framework** | FastAPI 0.110 |
| **Server** | Uvicorn (ASGI) |
| **Database** | MongoDB (local) |
| **ODM** | Beanie (async, built on Motor) |
| **Auth** | JWT (python-jose) + bcrypt (passlib) |
| **AI** | Google Gemini API |
| **Weather** | OpenWeather API |
| **Scheduler** | APScheduler |
| **Validation** | Pydantic v2 |

---

## 🔌 API ENDPOINTS

Base URL: `http://localhost:8000/api/v1`  
Interactive Docs: `http://localhost:8000/docs`

### 🔐 AUTH — `/api/v1/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | ❌ | Register new user |
| `POST` | `/login` | ❌ | Login, get tokens |
| `POST` | `/refresh-token` | ❌ | Refresh access token |
| `POST` | `/logout` | ❌ | Revoke refresh token |
| `GET` | `/me` | ✅ | Get current user info |

### 🌾 FARM — `/api/v1/farm`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/create` | ✅ Farmer | Create farm profile |
| `GET` | `/me` | ✅ Farmer | View my farm |
| `GET` | `/:farmId` | ✅ Expert/Admin | View any farm |
| `PUT` | `/update` | ✅ Farmer | Update farm details |
| `POST` | `/checkin` | ✅ Farmer | Submit weekly check-in |

### 📊 SCORE — `/api/v1/score`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/me` | ✅ Farmer | Get current score + tier |
| `GET` | `/history` | ✅ Farmer | Score history (for graph) |
| `GET` | `/streak` | ✅ Farmer | Get streak info |
| `GET` | `/badges` | ✅ Farmer | Get earned + locked badges |

### 🔔 NOTIFICATIONS — `/api/v1/notifications`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | ✅ Any | Get all notifications |
| `PATCH` | `/:id/read` | ✅ Any | Mark one as read |
| `PATCH` | `/read-all` | ✅ Any | Mark all as read |

---

## 🎮 GAMIFICATION LOGIC

### Score Rules
```
GAINS:
  Mission Complete        → +10 pts
  Streak Bonus (7/30/100) → +20 pts
  Community Verified      → +25 pts
  Expert Approved         → +30 pts
  Water Saving            → +10 pts
  Organic Fertilizer      → +15 pts
  Weekly Check-in         → +5 pts

LOSSES:
  Chemical Pesticide Use  → -20 pts
  Inactivity (7 days)     → -10 pts
  Inactivity (14 days)    → -25 pts
  Inactivity (30 days)    → -50 pts
  Fraud Penalty           → -50 pts
  Proof Rejected          → -15 pts

LIMITS: min=0, max=10,000
```

### Score Tiers
```
🌱 Beginner      → 0   – 500
🌾 Intermediate  → 501 – 1500
🌍 Advanced      → 1501 – 3000
⭐ Expert        → 3001+
```

### Default Badges
| Badge | Condition |
|---|---|
| 🌱 Beginner Farmer | Score ≥ 100 |
| 🌾 Growing Farmer | Score ≥ 501 |
| 🌍 Eco Champion | Score ≥ 1501 |
| ⭐ Farming Expert | Score ≥ 3001 |
| 🔥 7-Day Streak | Streak ≥ 7 days |
| 🌟 30-Day Legend | Streak ≥ 30 days |
| 🏆 100-Day Master | Streak ≥ 100 days |
| 🎯 Mission Starter | 10 missions done |
| 💪 Mission Pro | 50 missions done |

---

## ⏰ CRON JOBS (Background Tasks)

| Job | Schedule | What It Does |
|---|---|---|
| Daily Mission Generation | Every midnight | Assigns fresh daily missions to all farmers |
| Mission Expiry Check | Every hour | Marks expired missions, resets broken streaks |
| Score Decay | Every night 2am | Applies inactivity penalty to inactive farmers |
| Leaderboard Refresh | Every 6 hours | Rebuilds and caches top-100 national leaderboard |

---

## 🗄️ DATABASE COLLECTIONS (MongoDB)

| Collection | Purpose |
|---|---|
| `users` | All user accounts |
| `farm_profiles` | Farm Digital ID data |
| `missions` | Mission templates |
| `mission_progress` | Per-farmer mission tracking |
| `proof_submissions` | Upload records + AI results |
| `score_logs` | Full score change audit trail |
| `streaks` | Daily streak tracking |
| `badge_definitions` | Badge condition templates |
| `farmer_badges` | Badges earned by farmers |
| `rewards` | Points wallet + vouchers |
| `notifications` | In-app notifications |
| `posts` | Social feed posts |
| `comments` | Comments on posts |
| `reactions` | Likes on posts |
| `follows` | Follow relationships |
| `products` | Marketplace listings |
| `orders` | Purchase records |
| `leaderboards` | Cached leaderboard entries |
| `fraud_flags` | Behavior anomaly records |
| `verifications` | GRC/Expert review records |
| `grc_members` | Green Revolution Club members |
| `refresh_tokens` | JWT refresh token storage |

---

## 🚀 HOW TO RUN

### Prerequisites
- Python 3.11+
- MongoDB running locally on port 27017

### Steps
```bash
# 1. Navigate to backend
cd E:\GOO\backend

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run the server
python run.py
```

### Server URLs
| URL | Description |
|---|---|
| `http://localhost:8000` | API root / health check |
| `http://localhost:8000/docs` | Swagger UI (interactive API docs) |
| `http://localhost:8000/redoc` | ReDoc API docs |
| `http://localhost:8000/health` | Health check endpoint |

---

## 📋 BUILD PHASES

### ✅ Phase 1 — Backend Foundation (DONE)
- [x] Auth system (register, login, refresh, logout)
- [x] Farm Digital ID (create, update, view, weekly check-in)
- [x] Sustainability Score Engine (rules, decay, history logs)
- [x] Streak system (milestones, reset, bonus)
- [x] Badge system (auto-check, award, seeder)
- [x] Notification system
- [x] All 22 MongoDB models
- [x] 4 Cron jobs (scheduler)
- [x] JWT auth middleware + role guards
- [x] GPS validation utility (Haversine)

### ✅ Phase 2 — Mission System (DONE)
- [x] Mission templates seeder (16 default missions)
- [x] Assign missions to farmers (Auto-assignment)
- [x] Start mission
- [x] Submit proof (Multipart file upload + GPS validation)
- [x] Expert reviews flagged proof (Approve/Reject)
- [x] Mission history & completion stats
- [x] Mission completion cascade (Score + Streak + Badge + Notification)

### ✅ Phase 3 — Social + Leaderboard (DONE)
- [x] Social feed (Followers/Following logic)
- [x] Post creation, deletion, and auto-posts for missions
- [x] Like/Unlike and Commenting system
- [x] Public Farmer Profiles with all stats
- [x] Leaderboard routes (National, Streak, Mission Champions)
- [x] GRC verification routes (Review farms)
- [x] GRC member management (Admin invite + eligibility)

### ✅ Phase 4 — AI Intelligence (DONE)
- [x] Gemini Farming Advisor (Contextual chat)
- [x] Crop Recommendation AI (Geo + Weather based)
- [x] Weather Intelligence (OpenWeather integration)
- [x] AI Proof Auto-verification (Gemini Vision 1.5)
- [x] AI-enhanced weather risk scanning

### ✅ Phase 5 — Marketplace + Rewards (DONE)
- [x] Product listings (CRUD for Sellers/Admins)
- [x] Marketplace browsing with price/category filters
- [x] Order placement system
- [x] Points redemption logic (100 pts = $1 discount)
- [x] Reward wallet (View points + active vouchers)
- [x] Voucher redemption system
- [x] GOO Verified product labeling support

### ✅ Phase 6 — Admin Panel (DONE)
- [x] User management (List all users, Search by role)
- [x] Role management (Update user roles)
- [x] Safety controls (Ban/Unban users)
- [x] Fraud flag management (Review and Resolve behavior anomalies)
- [x] Platform analytics (Real-time dashboard stats)

### 🔲 Phase 7 — Frontend
- [ ] Framework decision (React / Next.js)
- [ ] Farmer dashboard UI
- [ ] Gamification UI
- [ ] Social feed UI
- [ ] Marketplace UI

---

## 📝 CHANGE LOG

### 2026-03-17 — Update: Admin Panel Logic
- ✅ **Phase 6 Implementation:**
  - Created `admin_controller.py`, `admin_routes.py`, `admin_schema.py`.
  - Implemented user management (role updates, banning).
  - Implemented fraud flag resolution.
  - Added platform-wide analytics/stats engine.
- ✅ **Infrastructure:**
  - Registered Phase 6 routers in `main.py`.

### 2026-03-17 — Update: Marketplace & Rewards
- ✅ **Phase 5 Implementation:**
  - Created `marketplace_controller.py`, `reward_controller.py`
  - Created `marketplace_routes.py`, `reward_routes.py`
  - Created `marketplace_schema.py`
  - Implemented product CRUD, ordering, and point-to-cash redemption logic.
  - Added reward wallet and voucher management.
- ✅ **Infrastructure:**
  - Registered Phase 5 routers in `main.py`.

### 2026-03-17 — Initial Build
- ✅ Project structure created under `E:\GOO\`
- ✅ Tech stack decided: Python + FastAPI + MongoDB
- ✅ All 22 MongoDB Beanie models created
- ✅ Auth system (register/login/JWT/refresh/logout)
- ✅ Farm Profile system (create/update/check-in)
- ✅ Score Engine with +/- rules and decay
- ✅ Streak service with milestone detection
- ✅ Badge service with 9 default badges seeded on startup
- ✅ Notification service
- ✅ 4 background cron jobs via APScheduler
- ✅ JWT middleware with role-based access control
- ✅ GPS Haversine utility for proof validation
- ✅ 4 route modules: auth, farm, score, notifications
- ✅ `run.py` server entry point
- ✅ `.env` + `.env.example` configuration files
- ✅ `requirements.txt` with all dependencies
- ✅ This README created

---

## 🔮 FUTURE FEATURES (Ideas — Not Planned Yet)

- 📱 Mobile app (React Native / Flutter)
- 🌐 Multi-language support (Tamil, Hindi, Telugu)
- 🛰 Satellite farm monitoring integration
- 🧾 Government subsidy tracking
- 🏦 Direct bank transfer for marketplace earnings
- 📡 Offline mode with local sync
- 🤝 NGO / Government partnership portal

---

> 💡 **Note:** This README is the single source of truth for the GOO project.  
> It will be updated every time a new feature, phase, or change is made.
