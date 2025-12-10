from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from typing import List, Optional
from app import schemas, models
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/rebuttals", tags=["rebuttals"])

@router.get("/claim/{claim_id}", response_model=List[schemas.RebuttalResponse])
def get_rebuttals_by_claim(
    claim_id: int, 
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user)
):
    rebuttals = db.query(models.Rebuttal).options(joinedload(models.Rebuttal.user)).filter(models.Rebuttal.claim_id == claim_id).all()
    result = []
    for rebuttal in rebuttals:
        rebuttal_dict = {
            "id": rebuttal.id,
            "claim_id": rebuttal.claim_id,
            "parent_id": rebuttal.parent_id,
            "user_id": rebuttal.user_id,
            "content": rebuttal.content,
            "type": rebuttal.type,
            "votes": rebuttal.votes,
            "created_at": rebuttal.created_at,
        }
        # 사용자 정보 추가
        if rebuttal.user:
            rebuttal_dict["author"] = {
                "name": rebuttal.user.username,
                "affiliation": rebuttal.user.affiliation or rebuttal.user.political_party or "",
                "level": rebuttal.user.level
            }
        # 현재 사용자의 투표 정보 추가
        if current_user:
            user_vote = db.query(models.Vote).filter(
                and_(
                    models.Vote.user_id == current_user.id,
                    models.Vote.rebuttal_id == rebuttal.id
                )
            ).first()
            rebuttal_dict["user_vote"] = user_vote.vote_type if user_vote else None
        else:
            rebuttal_dict["user_vote"] = None
        result.append(rebuttal_dict)
    return result

@router.post("/", response_model=schemas.RebuttalResponse)
def create_rebuttal(
    rebuttal: schemas.RebuttalCreate, 
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다")
    
    db_rebuttal = models.Rebuttal(
        claim_id=rebuttal.claim_id,
        parent_id=rebuttal.parent_id,
        user_id=current_user.id,
        content=rebuttal.content,
        type=rebuttal.type
    )
    db.add(db_rebuttal)
    db.commit()
    db.refresh(db_rebuttal)
    
    # 사용자 정보를 다시 로드
    db_rebuttal = db.query(models.Rebuttal).options(joinedload(models.Rebuttal.user)).filter(models.Rebuttal.id == db_rebuttal.id).first()
    
    # 사용자 정보 포함하여 반환
    rebuttal_dict = {
        "id": db_rebuttal.id,
        "claim_id": db_rebuttal.claim_id,
        "parent_id": db_rebuttal.parent_id,
        "user_id": db_rebuttal.user_id,
        "content": db_rebuttal.content,
        "type": db_rebuttal.type,
        "votes": db_rebuttal.votes,
        "created_at": db_rebuttal.created_at,
    }
    # 사용자 정보 추가
    if db_rebuttal.user:
        rebuttal_dict["author"] = {
            "name": db_rebuttal.user.username,
            "affiliation": db_rebuttal.user.affiliation or db_rebuttal.user.political_party or "",
            "level": db_rebuttal.user.level
        }
    return rebuttal_dict

@router.get("/{rebuttal_id}", response_model=schemas.RebuttalResponse)
def get_rebuttal(rebuttal_id: int, db: Session = Depends(get_db)):
    rebuttal = db.query(models.Rebuttal).filter(models.Rebuttal.id == rebuttal_id).first()
    if not rebuttal:
        raise HTTPException(status_code=404, detail="반박을 찾을 수 없습니다")
    return rebuttal

