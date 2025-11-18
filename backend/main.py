from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from app.routers import auth, topics, claims, rebuttals, votes, ai
from app.database import init_db

load_dotenv()

app = FastAPI(title="토론형 커뮤니티 API", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(topics.router)
app.include_router(claims.router)
app.include_router(rebuttals.router)
app.include_router(votes.router)
app.include_router(ai.router)

# Initialize database
init_db()

@app.get("/")
async def root():
    return {"message": "토론형 커뮤니티 API"}

@app.get("/health")
async def health():
    return {"status": "ok"}

