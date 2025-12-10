from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from app import schemas, models
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/topics", tags=["topics"])

@router.get("/", response_model=List[schemas.TopicResponse])
def get_topics(
    category: Optional[str] = None,
    region: Optional[str] = None,
    district: Optional[str] = None,
    topic_type: Optional[str] = None,
    sort_by: str = "best",
    db: Session = Depends(get_db)
):
    query = db.query(models.Topic)
    
    if category:
        query = query.filter(models.Topic.category == category)
    if region:
        query = query.filter(models.Topic.region == region)
    if district:
        query = query.filter(models.Topic.district == district)
    if topic_type:
        query = query.filter(models.Topic.topic_type == topic_type)
    
    # 정렬 처리
    from sqlalchemy import func
    
    if sort_by == "best":
        # 인기순: 주장의 votes 합계가 높은 순
        # Claim.votes 컬럼을 명시적으로 참조
        topics = query.outerjoin(models.Claim).group_by(models.Topic.id).order_by(
            desc(func.coalesce(func.sum(models.Claim.__table__.c.votes), 0))
        ).all()
    elif sort_by == "trend":
        # 트렌드: 최근 7일 내 생성된 주제 중 votes 합계가 높은 순
        from datetime import datetime, timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        topics = query.filter(models.Topic.created_at >= week_ago).outerjoin(models.Claim).group_by(models.Topic.id).order_by(
            desc(func.coalesce(func.sum(models.Claim.__table__.c.votes), 0))
        ).all()
    elif sort_by == "new":
        # 최신순
        topics = query.order_by(desc(models.Topic.created_at)).all()
    else:
        # 기본: 최신순
        topics = query.order_by(desc(models.Topic.created_at)).all()
    
    return topics

@router.post("/", response_model=schemas.TopicResponse)
def create_topic(
    topic: schemas.TopicCreate, 
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다")
    
    # 관리자 아이디 체크 (admin)
    if current_user.username != "admin":
        raise HTTPException(status_code=403, detail="관리자만 토론 주제를 생성할 수 있습니다")
    
    db_topic = models.Topic(
        title=topic.title,
        category=topic.category,
        region=topic.region,
        district=topic.district,
        topic_type=topic.topic_type
    )
    db.add(db_topic)
    db.commit()
    db.refresh(db_topic)
    return db_topic

@router.get("/{topic_id}", response_model=schemas.TopicResponse)
def get_topic(topic_id: int, db: Session = Depends(get_db)):
    topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="토론 주제를 찾을 수 없습니다")
    return topic

