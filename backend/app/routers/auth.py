from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas, models
from app.database import get_db
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import os
import hashlib
import re

router = APIRouter(prefix="/api/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"

def _prehash_password(password: str) -> str:
    """비밀번호를 SHA256으로 사전 해시하여 72바이트 제한 문제를 해결
    
    모든 비밀번호를 SHA256으로 해시하여 항상 64바이트(hex 문자열)로 고정합니다.
    이렇게 하면 bcrypt의 72바이트 제한을 넘지 않습니다.
    """
    # 항상 SHA256으로 해시 (64바이트 hex 문자열로 고정)
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def verify_password(plain_password, hashed_password):
    """비밀번호 검증
    
    기존 방식(사전 해시 없음)과 새 방식(사전 해시) 모두 지원합니다.
    """
    # bcrypt 해시는 항상 $2a$, $2b$ 등으로 시작
    if hashed_password.startswith('$2'):
        # 먼저 원본 비밀번호로 시도 (기존 데이터 호환)
        if pwd_context.verify(plain_password, hashed_password):
            return True
        # 사전 해시된 비밀번호로 시도 (새 방식)
        prehashed = _prehash_password(plain_password)
        return pwd_context.verify(prehashed, hashed_password)
    return False

def get_password_hash(password):
    """비밀번호 해시 생성
    
    비밀번호를 SHA256으로 사전 해시한 후 bcrypt로 해시합니다.
    """
    # 비밀번호를 SHA256으로 사전 해시 (항상 64바이트)
    prehashed = _prehash_password(password)
    # bcrypt로 해시 (72바이트 제한 내에서 안전)
    return pwd_context.hash(prehashed)

def validate_password(password: str):
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="비밀번호는 최소 8자 이상이어야 합니다.")
    if not re.search(r"[a-zA-Z]", password):
        raise HTTPException(status_code=400, detail="비밀번호에는 영문자가 포함되어야 합니다.")
    if not re.search(r"\d", password):
        raise HTTPException(status_code=400, detail="비밀번호에는 숫자가 포함되어야 합니다.")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise HTTPException(status_code=400, detail="비밀번호에는 특수문자가 포함되어야 합니다.")

@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="이미 존재하는 사용자입니다")
    
    validate_password(user.password)
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        password_hash=hashed_password,
        political_party=user.political_party
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 잘못되었습니다")
    
    # Create JWT token
    access_token_expires = timedelta(hours=24)
    expire = datetime.utcnow() + access_token_expires
    to_encode = {"sub": db_user.username, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return {"access_token": encoded_jwt, "token_type": "bearer", "user": schemas.UserResponse.model_validate(db_user)}
