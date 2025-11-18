from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from tavily import TavilyClient
from dotenv import load_dotenv
import os
from pathlib import Path

# .env 파일 경로 명시 (backend 디렉토리 기준)
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

router = APIRouter(prefix="/api/ai", tags=["ai"])

# Tavily API 키 설정
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")
tavily_client = TavilyClient(api_key=TAVILY_API_KEY) if TAVILY_API_KEY else None

class SearchEvidenceRequest(BaseModel):
    query: str
    search_depth: str = "advanced"

class SearchEvidenceResponse(BaseModel):
    evidence: List[dict]
    query: str

class ImproveTextRequest(BaseModel):
    text: str
    context: Optional[str] = None

class ImproveTextResponse(BaseModel):
    improved_text: str
    original_text: str

@router.post("/search-evidence", response_model=SearchEvidenceResponse)
def search_evidence(request: SearchEvidenceRequest):
    """Tavily를 사용하여 AI 근거 찾기"""
    if not tavily_client:
        raise HTTPException(
            status_code=500,
            detail="Tavily API 키가 설정되지 않았습니다. TAVILY_API_KEY 환경 변수를 설정해주세요."
        )
    
    try:
        # Tavily 검색 실행
        response = tavily_client.search(
            query=request.query,
            search_depth=request.search_depth
        )
        
        # 검색 결과를 근거 형식으로 변환
        evidence_list = []
        if "results" in response:
            for result in response["results"]:
                evidence_list.append({
                    "source": result.get("title", ""),
                    "publisher": result.get("url", ""),
                    "text": result.get("content", ""),
                    "url": result.get("url", ""),
                })
        
        return SearchEvidenceResponse(
            evidence=evidence_list,
            query=request.query
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"근거 검색 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/improve-text", response_model=ImproveTextResponse)
def improve_text(request: ImproveTextRequest):
    """AI를 사용하여 글 수정 (다듬기)"""
    if not tavily_client:
        raise HTTPException(
            status_code=500,
            detail="Tavily API 키가 설정되지 않았습니다. TAVILY_API_KEY 환경 변수를 설정해주세요."
        )
    
    try:
        # 글 수정을 위한 검색 쿼리 생성
        # 사용자의 글 내용을 기반으로 관련 정보를 검색하여 개선된 텍스트 생성
        text_preview = request.text[:200].replace('\n', ' ')
        search_query = f"{text_preview} 논리적 근거 개선"
        
        # Tavily로 관련 정보 검색
        response = tavily_client.search(
            query=search_query,
            search_depth="advanced"
        )
        
        # 검색 결과를 기반으로 텍스트 개선
        # 실제로는 LLM을 사용해야 하지만, 여기서는 검색 결과를 기반으로 간단히 개선
        improved_text = request.text
        
        if "results" in response and len(response["results"]) > 0:
            # 검색 결과를 요약하여 텍스트에 통합
            relevant_info = []
            for result in response["results"][:3]:  # 상위 3개 결과만 사용
                title = result.get("title", "")
                content = result.get("content", "")[:150]
                if title and content:
                    relevant_info.append(f"[{title}] {content}")
            
            if relevant_info:
                # 원본 텍스트에 검색된 정보를 참고 문구로 추가
                improved_text = f"{request.text}\n\n--- 참고 자료 ---\n" + "\n\n".join(relevant_info)
        
        return ImproveTextResponse(
            improved_text=improved_text,
            original_text=request.text
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"글 수정 중 오류가 발생했습니다: {str(e)}"
        )

