from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, SessionLocal
from app import models, schemas
from app.routers import auth, topics, claims, rebuttals, votes, ai
from passlib.context import CryptContext
import os

# DB 테이블 생성
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth.router)
app.include_router(topics.router)
app.include_router(claims.router)
app.include_router(rebuttals.router)
app.include_router(votes.router)
app.include_router(ai.router)

# [추가] 관리자 계정 자동 생성 함수
def create_admin_user():
    db = SessionLocal()
    try:
        admin_user = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin_user:
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            # 비밀번호 해시 생성 (auth.py의 로직과 동일하게)
            # 여기서는 간단히 bcrypt로 바로 해시 (실제 auth.py에 맞춰 조정 가능)
            hashed_password = pwd_context.hash("1234qwer!")
            
            admin = models.User(
                username="admin",
                password_hash=hashed_password,
                political_party="None",
                level=999 # 관리자 레벨
            )
            db.add(admin)
            db.commit()
            print("Admin user created: admin / 1234qwer!")
    except Exception as e:
        print(f"Error creating admin user: {e}")
    finally:
        db.close()

create_admin_user()

@app.get("/")
def read_root():
    return {"message": "Welcome to Debate API"}

