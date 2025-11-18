from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from typing import List, Optional
from app import schemas, models
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/claims", tags=["claims"])

@router.get("/topic/{topic_id}", response_model=List[schemas.ClaimResponse])
def get_claims_by_topic(
    topic_id: int, 
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user)
):
    claims = db.query(models.Claim).options(joinedload(models.Claim.user)).filter(models.Claim.topic_id == topic_id).all()
    result = []
    for claim in claims:
        claim_dict = {
            "id": claim.id,
            "topic_id": claim.topic_id,
            "user_id": claim.user_id,
            "title": claim.title,
            "content": claim.content,
            "type": claim.type,
            "votes": claim.votes,
            "sticker": claim.sticker,
            "created_at": claim.created_at,
        }
        # 사용자 정보 추가
        if claim.user:
            claim_dict["author"] = {
                "name": claim.user.username,
                "affiliation": claim.user.affiliation or claim.user.political_party or "",
                "level": claim.user.level
            }
        # 현재 사용자의 투표 정보 추가
        if current_user:
            user_vote = db.query(models.Vote).filter(
                and_(
                    models.Vote.user_id == current_user.id,
                    models.Vote.claim_id == claim.id
                )
            ).first()
            claim_dict["user_vote"] = user_vote.vote_type if user_vote else None
        else:
            claim_dict["user_vote"] = None
        result.append(claim_dict)
    return result

@router.post("/", response_model=schemas.ClaimResponse)
def create_claim(
    claim: schemas.ClaimCreate, 
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다")
    
    db_claim = models.Claim(
        topic_id=claim.topic_id,
        user_id=current_user.id,
        title=claim.title,
        content=claim.content,
        type=claim.type
    )
    db.add(db_claim)
    db.commit()
    db.refresh(db_claim)
    
    # 근거 추가
    if claim.evidence:
        for ev in claim.evidence:
            db_evidence = models.Evidence(
                claim_id=db_claim.id,
                source=ev.get('source', ''),
                publisher=ev.get('publisher', ''),
                text=ev.get('text', '')
            )
            db.add(db_evidence)
        db.commit()
    
    # 사용자 정보 포함하여 반환
    db_claim = db.query(models.Claim).options(joinedload(models.Claim.user)).filter(models.Claim.id == db_claim.id).first()
    claim_dict = {
        "id": db_claim.id,
        "topic_id": db_claim.topic_id,
        "user_id": db_claim.user_id,
        "title": db_claim.title,
        "content": db_claim.content,
        "type": db_claim.type,
        "votes": db_claim.votes,
        "sticker": db_claim.sticker,
        "created_at": db_claim.created_at,
    }
    # 사용자 정보 추가
    if db_claim.user:
        claim_dict["author"] = {
            "name": db_claim.user.username,
            "affiliation": db_claim.user.affiliation or db_claim.user.political_party or "",
            "level": db_claim.user.level
        }
    return claim_dict

@router.get("/{claim_id}", response_model=schemas.ClaimResponse)
def get_claim(
    claim_id: int, 
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user)
):
    claim = db.query(models.Claim).options(joinedload(models.Claim.user)).filter(models.Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="주장을 찾을 수 없습니다")
    
    claim_dict = {
        "id": claim.id,
        "topic_id": claim.topic_id,
        "user_id": claim.user_id,
        "title": claim.title,
        "content": claim.content,
        "type": claim.type,
        "votes": claim.votes,
        "sticker": claim.sticker,
        "created_at": claim.created_at,
    }
    # 사용자 정보 추가
    if claim.user:
        claim_dict["author"] = {
            "name": claim.user.username,
            "affiliation": claim.user.affiliation or claim.user.political_party or "",
            "level": claim.user.level
        }
    # 현재 사용자의 투표 정보 추가
    if current_user:
        user_vote = db.query(models.Vote).filter(
            and_(
                models.Vote.user_id == current_user.id,
                models.Vote.claim_id == claim.id
            )
        ).first()
        claim_dict["user_vote"] = user_vote.vote_type if user_vote else None
    else:
        claim_dict["user_vote"] = None
    return claim_dict

@router.get("/{claim_id}/evidence", response_model=List[dict])
def get_claim_evidence(claim_id: int, db: Session = Depends(get_db)):
    evidence = db.query(models.Evidence).filter(models.Evidence.claim_id == claim_id).all()
    return [
        {
            "id": e.id,
            "source": e.source,
            "publisher": e.publisher,
            "text": e.text
        }
        for e in evidence
    ]

