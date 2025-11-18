from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional
from app import schemas, models
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/votes", tags=["votes"])

@router.post("/", response_model=dict)
def vote(
    vote_data: schemas.VoteCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user)
):
    """좋아요/싫어요 투표"""
    if not current_user:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다")
    
    if not vote_data.claim_id and not vote_data.rebuttal_id:
        raise HTTPException(status_code=400, detail="claim_id 또는 rebuttal_id가 필요합니다")
    
    if vote_data.claim_id and vote_data.rebuttal_id:
        raise HTTPException(status_code=400, detail="claim_id와 rebuttal_id를 동시에 지정할 수 없습니다")
    
    # 기존 투표 확인
    if vote_data.claim_id:
        existing_vote = db.query(models.Vote).filter(
            and_(
                models.Vote.user_id == current_user.id,
                models.Vote.claim_id == vote_data.claim_id
            )
        ).first()
        target = db.query(models.Claim).filter(models.Claim.id == vote_data.claim_id).first()
        if not target:
            raise HTTPException(status_code=404, detail="주장을 찾을 수 없습니다")
    else:
        existing_vote = db.query(models.Vote).filter(
            and_(
                models.Vote.user_id == current_user.id,
                models.Vote.rebuttal_id == vote_data.rebuttal_id
            )
        ).first()
        target = db.query(models.Rebuttal).filter(models.Rebuttal.id == vote_data.rebuttal_id).first()
        if not target:
            raise HTTPException(status_code=404, detail="반박을 찾을 수 없습니다")
    
    if existing_vote:
        # 같은 투표면 취소, 다른 투표면 변경
        if existing_vote.vote_type == vote_data.vote_type:
            # 투표 취소
            if vote_data.claim_id:
                if existing_vote.vote_type == 'like':
                    target.votes -= 1
                else:
                    target.votes += 1
            else:
                if existing_vote.vote_type == 'like':
                    target.votes -= 1
                else:
                    target.votes += 1
            db.delete(existing_vote)
            db.commit()
            db.refresh(target)
            return {"message": "투표가 취소되었습니다", "votes": target.votes, "user_vote": None}
        else:
            # 투표 변경
            if vote_data.claim_id:
                if existing_vote.vote_type == 'like':
                    target.votes -= 2  # like -> dislike
                else:
                    target.votes += 2  # dislike -> like
            else:
                if existing_vote.vote_type == 'like':
                    target.votes -= 2
                else:
                    target.votes += 2
            existing_vote.vote_type = vote_data.vote_type
            db.commit()
            db.refresh(target)
            return {"message": "투표가 변경되었습니다", "votes": target.votes, "user_vote": vote_data.vote_type}
    else:
        # 새 투표
        new_vote = models.Vote(
            user_id=current_user.id,
            claim_id=vote_data.claim_id,
            rebuttal_id=vote_data.rebuttal_id,
            vote_type=vote_data.vote_type
        )
        db.add(new_vote)
        # 좋아요는 +1, 싫어요는 -1
        if vote_data.vote_type == 'like':
            target.votes += 1
        else:
            target.votes -= 1
        db.commit()
        db.refresh(target)
        return {"message": "투표가 완료되었습니다", "votes": target.votes, "user_vote": vote_data.vote_type}

@router.get("/claim/{claim_id}")
def get_user_vote_for_claim(claim_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """주장에 대한 현재 사용자의 투표 정보"""
    vote = db.query(models.Vote).filter(
        and_(
            models.Vote.user_id == current_user.id,
            models.Vote.claim_id == claim_id
        )
    ).first()
    return {"user_vote": vote.vote_type if vote else None}

@router.get("/rebuttal/{rebuttal_id}")
def get_user_vote_for_rebuttal(rebuttal_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """반박에 대한 현재 사용자의 투표 정보"""
    vote = db.query(models.Vote).filter(
        and_(
            models.Vote.user_id == current_user.id,
            models.Vote.rebuttal_id == rebuttal_id
        )
    ).first()
    return {"user_vote": vote.vote_type if vote else None}

