from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func, desc
from typing import List, Optional
from app import schemas, models
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/claims", tags=["claims"])

@router.get("/topic/{topic_id}", response_model=List[schemas.ClaimResponse])
def get_claims_by_topic(
    topic_id: int, 
    sort_by: str = "best",  # 정렬 파라미터 추가 (best, new, trend)
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user)
):
    # 기본 쿼리 생성
    query = db.query(models.Claim).options(joinedload(models.Claim.user)).filter(models.Claim.topic_id == topic_id)
    
    # 정렬 로직 적용
    if sort_by == "new":
        # 최신순
        query = query.order_by(models.Claim.created_at.desc())
    elif sort_by == "best":
        # 반박(댓글) 많은 순
        # Rebuttal 테이블과 조인하여 개수(count) 기준으로 정렬
        query = query.outerjoin(models.Rebuttal).group_by(models.Claim.id).order_by(func.count(models.Rebuttal.id).desc())
    elif sort_by == "trend":
        # 최근 활동순 (가장 최근에 반박이 달린 주장 우선)
        # 반박 생성 시간의 최댓값을 기준으로 정렬, 반박이 없으면 주장 생성 시간 기준
        query = query.outerjoin(models.Rebuttal).group_by(models.Claim.id).order_by(
            func.coalesce(func.max(models.Rebuttal.created_at), models.Claim.created_at).desc()
        )
    else:
        # 기본값 (votes 순 혹은 id 순)
        query = query.order_by(models.Claim.votes.desc())

    claims = query.all()
    
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

# ... (create_claim, get_claim, get_claim_evidence 함수는 기존과 동일하게 유지) ...
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
    
    if claim.evidence:
        for ev in claim.evidence:
            db_evidence = models.Evidence(
                claim_id=db_claim.id,
                source=ev.get('source', ''),
                publisher=ev.get('publisher', 'User'),
                text=ev.get('text'),
                url=ev.get("url")
            )
            db.add(db_evidence)
        db.commit()
    
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
    if claim.user:
        claim_dict["author"] = {
            "name": claim.user.username,
            "affiliation": claim.user.affiliation or claim.user.political_party or "",
            "level": claim.user.level
        }
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
            "text": e.text,
            "url": e.url
        }
        for e in evidence
    ]

@router.delete("/{claim_id}")
def delete_claim(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다")

    claim = db.query(models.Claim).filter(models.Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다")

    # 작성자 본인 또는 관리자(level 999)만 삭제 가능
    if claim.user_id != current_user.id and current_user.level < 999:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다")

    # 연관된 반박, 투표, 근거 등은 DB 설정(Cascade)에 따라 자동 삭제되거나
    # 수동으로 지워야 할 수 있습니다. 여기서는 글 자체 삭제만 처리합니다.
    db.delete(claim)
    db.commit()
    
    return {"message": "삭제되었습니다"}