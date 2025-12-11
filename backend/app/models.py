from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy import Boolean # Boolean

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    political_party = Column(String)
    real_name = Column(String)
    affiliation = Column(String)
    level = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

class Topic(Base):
    __tablename__ = "topics"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String)  # politics, economy, society, culture, it, world
    region = Column(String)  # seoul, gyeonggi, etc.
    district = Column(String)  # 강동구, 고양시, etc.
    topic_type = Column(String)  # topic, region, pledge
    created_at = Column(DateTime, default=datetime.utcnow)
    
    claims = relationship("Claim", back_populates="topic")

class Claim(Base):
    __tablename__ = "claims"
    
    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    type = Column(String)  # pro, con
    votes = Column(Integer, default=0)
    sticker = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    topic = relationship("Topic", back_populates="claims")
    user = relationship("User")
    rebuttals = relationship("Rebuttal", back_populates="claim")
    evidence = relationship("Evidence", back_populates="claim")
    vote_records = relationship("Vote", back_populates="claim")

class Rebuttal(Base):
    __tablename__ = "rebuttals"
    
    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id"))
    parent_id = Column(Integer, ForeignKey("rebuttals.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=True) 
    content = Column(Text, nullable=False)
    type = Column(String)
    votes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    claim = relationship("Claim", back_populates="rebuttals")
    user = relationship("User")
    evidence = relationship("Evidence", back_populates="rebuttal")
    vote_records = relationship("Vote", back_populates="rebuttal")

class Evidence(Base):
    __tablename__ = "evidence"
    
    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=True)
    rebuttal_id = Column(Integer, ForeignKey("rebuttals.id"), nullable=True)
    source = Column(String, nullable=False)
    publisher = Column(String, nullable=False)
    text = Column(Text)
    url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    claim = relationship("Claim", back_populates="evidence")
    rebuttal = relationship("Rebuttal", back_populates="evidence")

class Vote(Base):
    __tablename__ = "votes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=True)
    rebuttal_id = Column(Integer, ForeignKey("rebuttals.id"), nullable=True)
    vote_type = Column(String, nullable=False)  # like, dislike
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")
    claim = relationship("Claim")
    rebuttal = relationship("Rebuttal")

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id")) # 신고자
    target_type = Column(String) # 'claim' or 'rebuttal'
    target_id = Column(Integer)
    reason = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id")) # 알림 받을 사람
    content = Column(String)
    link = Column(String) # 클릭 시 이동할 링크
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")