from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

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
    sticker = Column(String)  # Best, Debate
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
    content = Column(Text, nullable=False)
    type = Column(String)  # rebuttal, counter
    votes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    claim = relationship("Claim", back_populates="rebuttals")
    user = relationship("User")
    vote_records = relationship("Vote", back_populates="rebuttal")

class Evidence(Base):
    __tablename__ = "evidence"
    
    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id"))
    source = Column(String, nullable=False)
    publisher = Column(String, nullable=False)
    text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    claim = relationship("Claim", back_populates="evidence")

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

