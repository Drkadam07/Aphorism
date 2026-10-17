from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, users, posts, interactions, feed
from app.config import settings
# Create SQLite tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Quote & Public Message Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup for web and mobile frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount modular routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(posts.router)
app.include_router(interactions.router)
app.include_router(feed.router)

@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "Quotes API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)