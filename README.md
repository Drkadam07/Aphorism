
# Aphorism — Letters & Threads

> A minimalist, high-performance REST API backend for a text-first public quote and thread platform inspired by X and Threads. Built with **FastAPI**, **SQLAlchemy**, **SQLite**, **JWT authentication**, and **email OTP verification**.

---

## ✨ Features

### 🔐 Authentication & Security
- **User Registration:** Register using an email address, username, and password.
- **Email OTP Verification:** Automatic 6-digit OTP verification during registration.
- **JWT Authentication:** Secure Bearer access tokens with standard token lifecycle controls.
- **Password Hashing:** Passwords securely hashed using `bcrypt`.
- **Account Security Audit Logs:** Track security-critical account events (e.g., successful logins, IP addresses).
- **Token-Based Authorization:** Protect endpoints that require user authentication.

### 📝 Quotes & Public Messaging
- **Standalone Quotes:** Create text posts with a strict 500-character limit.
- **Quote Reposts:** Repost existing quotes with an embedded reference to the original thought.
- **Conversational Threads:** Support replies using parent and root post relational links.
- **Thread Hierarchy:** Retrieve nested conversations and complete thread structures in a single query.
- **Post Management:** Fetch individual posts and safely delete posts owned by the authenticated user.

### ❤️ Interactions
- **Like/Unlike:** Toggle likes on posts with instant counter updates.
- **Bookmarks:** Save and remove quotes from personal collections.
- **Comments:** Add comments to posts and retrieve discussion threads.
- **Interaction Status:** Dynamically determine whether the requesting user has liked or saved a post.

### 📰 Feed System
- **Global Timeline:** Retrieve public posts through an unauthenticated/authenticated feed endpoint.
- **Cursor-Based Pagination:** Efficiently navigate large feeds without offset-scan performance penalties.
- **Optimized Batch Queries:** Reduce $N+1$ query bottlenecks when fetching like and bookmark states across feeds.
- **Public Access:** Browse public quotes without requiring account creation or login.

### 🗄️ Database & Performance
- **SQLAlchemy ORM:** Declarative data models and relationship bindings.
- **SQLite Foreign Keys:** Foreign key enforcement enabled via SQLite `PRAGMA foreign_keys=ON`.
- **Cascading Deletes:** Maintain referential integrity across replies, quotes, comments, and likes.
- **Pydantic v2:** Fast input validation, type coercion, and response serialization.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Python 3.10+** | Core programming language |
| **FastAPI** | High-performance asynchronous REST API framework |
| **SQLite** | Embedded relational database |
| **SQLAlchemy 2.0+** | Object-Relational Mapping (ORM) and session management |
| **Pydantic v2** | Request validation and response schemas |
| **Python-Jose** | JWT token generation and validation |
| **Passlib + Bcrypt** | Password hashing |
| **aiosmtplib** | Asynchronous email dispatch for OTP delivery |
| **Uvicorn** | Lightning-fast ASGI production/development server |

---
```markdown
## 📁 Project Structure

```text
aphorism/
├── app/
│   ├── __init__.py
│   ├── config.py              # Settings, JWT keys, and SMTP configuration
│   ├── database.py            # Engine setup and SQLite PRAGMA hook
│   ├── models.py              # SQLAlchemy ORM models
│   ├── schemas.py             # Pydantic validation models
│   ├── security.py            # Password hashing and JWT generation
│   ├── email_service.py       # OTP email delivery and dev fallback
│   ├── dependencies.py        # Authentication guards and DB sessions
│   └── routers/
│       ├── __init__.py
│       ├── auth.py             # Registration, verification, login, logout
│       ├── users.py            # Profile retrieval and updates
│       ├── posts.py            # Quotes, replies, and thread trees
│       ├── interactions.py     # Likes, bookmarks, and comments
│       └── feed.py             # Cursor-paginated public timeline
├── .env                        # Sample environment configuration
├── requirements.txt            # Python dependencies
├── main.py                     # Application entry point and CORS setup
└── README.md                   # Project documentation

```

---

## 🚀 Getting Started

### 1. Prerequisites

Ensure you have the following installed:

* **Python 3.10 or higher**
* **pip** package manager
* **Git**

### 2. Clone the Repository

```bash
git clone https://github.com/Drkadam07/Aphorism.git
cd aphorism

```

### 3. Create a Virtual Environment

**Linux / macOS:**

```bash
python3 -m venv venv
source venv/bin/activate

```


**Windows (PowerShell):**

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1

```

### 4. Install Dependencies

```bash
pip install -r requirements.txt

```

### 5. Configure Environment Variables

Copy the template configuration file:

**Linux / macOS:**

```bash
cp .env.example .env

```

**Windows:**

```cmd
copy .env.example .env

```

Open `.env` and fill in your configuration:

```env
APP_NAME="Aphorism — Letters & Threads"

# Authentication
SECRET_KEY="replace_with_a_secure_random_secret"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# OTP Configuration
OTP_EXPIRE_MINUTES=10

# Database
DATABASE_URL="sqlite:///./aphorism.db"

# SMTP Configuration (Optional for local development)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
EMAIL_FROM="noreply@aphorism.app"

```

> **Security Notes:**
> * Generate a long, random `SECRET_KEY` (e.g., via `openssl rand -hex 32`).
> * Never commit your active `.env` file to version control.
> * For Gmail SMTP, use a dedicated **Google App Password** instead of your primary password.
> 
> 

---

## 💻 Running the Application

Launch the development server with live reload:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000

```

Once started, access the server and interactive documentation:

| Resource | URL |
| --- | --- |
| **API Base URL** | `http://127.0.0.1:8000/api/v1` |
| **Interactive Swagger UI** | `http://127.0.0.1:8000/docs` |
| **ReDoc Documentation** | `http://127.0.0.1:8000/redoc` |

---

---

## 🔑 Authentication Workflow

```
[Register]          POST /auth/register
   │
   ▼
[OTP Dispatched]    Email sent (or terminal fallback in dev)
   │
   ▼
[Verify OTP]        POST /auth/verify-otp
   │
   ▼
[Access Token]      Receive Bearer JWT
   │
   ▼
[Authorized API]    Pass "Authorization: Bearer <token>"

```

1. **Register:** Send account details to `POST /api/v1/auth/register`.
2. **Receive OTP:** The server generates a single-use 6-digit code with an expiry window (default: 10 minutes).
3. **Verify Email:** Send the code to `POST /api/v1/auth/verify-otp`.
4. **Token Issued:** A verified response issues a Bearer JWT access token.
5. **Subsequent Logins:** Log in at any time with `POST /api/v1/auth/login`.

---

## ⚡ Performance Considerations

* **Cursor Pagination:** Feeds paginate using post IDs (`Post.id < cursor`) rather than offset limits, eliminating slow index skips over large datasets.
* **Batch Interaction Lookups:** The global feed aggregates like and bookmark statuses for all returned posts in batch queries, preventing $N+1$ overhead.
* **Indexed Lookups:** Key relational fields (`author_id`, `parent_id`, `root_id`, `created_at`, `email`, `username`) are indexed for fast lookup times.

---

## 🛡️ Production Checklist

Before deploying this API to production:

* [ ] Replace `SECRET_KEY` with a cryptographically secure value.
* [ ] Configure a real SMTP transactional email service.
* [ ] Set strict CORS origins in `main.py` to match your frontend domain.
* [ ] Add rate limiting (e.g., `slowapi`) to `/auth/login`, `/auth/register`, and `/auth/verify-otp`.
* [ ] Enforce HTTPS termination via Nginx, Caddy, or your cloud ingress.
* [ ] If high concurrent write volume is expected, switch `DATABASE_URL` to **PostgreSQL**.

---

## 🧪 Testing

Run automated tests using `pytest`:

```bash
pytest

```

---

## 🗺️ Roadmap

* [ ] Follower graph & personalized timeline (`/feed/following`)
* [ ] Real-time notifications for likes, quotes, and thread replies
* [ ] Hashtags, full-text search, and curated quote topics
* [ ] Refresh token rotation & Redis token revocation list
* [ ] PostgreSQL migration scripts with Alembic

---

## 📄 License

This project is open-source and licensed under the [MIT License](https://www.google.com/search?q=LICENSE).

---

*Built with FastAPI and Python for a distraction-free, text-first social web.*

