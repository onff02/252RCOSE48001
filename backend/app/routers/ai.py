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
        # 원본 텍스트를 문장 단위로 분리
        original_sentences = [s.strip() for s in request.text.split('.') if s.strip()]
        
        # 글 수정을 위한 검색 쿼리 생성
        # 사용자의 글 내용을 기반으로 관련 정보를 검색하여 개선된 텍스트 생성
        text_preview = request.text[:200].replace('\n', ' ')
        search_query = f"{text_preview} 관련 정보"
        
        # Tavily로 관련 정보 검색
        response = tavily_client.search(
            query=search_query,
            search_depth="advanced"
        )
        
        # 원본 텍스트를 기반으로 개선
        improved_text = request.text
        
        if "results" in response and len(response["results"]) > 0:
            # 검색 결과에서 핵심 정보 추출
            key_points = []
            for result in response["results"][:2]:  # 상위 2개 결과만 사용
                title = result.get("title", "")
                content = result.get("content", "")
                
                if content:
                    # 내용에서 핵심 문장 추출 (첫 2-3문장)
                    sentences = [s.strip() for s in content.split('.') if s.strip()][:3]
                    if sentences:
                        key_info = '. '.join(sentences)
                        if len(key_info) > 200:
                            key_info = key_info[:200] + "..."
                        key_points.append({
                            "title": title,
                            "info": key_info
                        })
            
            if key_points:
                # 원본 텍스트의 구조를 유지하면서 자연스럽게 개선
                # 검색 결과를 참고하여 문장을 더 구체적이고 논리적으로 만들기
                
                # 원본 텍스트를 그대로 유지하되, 끝에 자연스러운 참고 문구 추가
                improved_sentences = original_sentences.copy()
                
                # 마지막 문장이 완전한 문장인지 확인
                if improved_sentences and not improved_sentences[-1].endswith(('.', '!', '?')):
                    improved_sentences[-1] += '.'
                
                # 참고 자료를 자연스럽게 추가
                if len(key_points) > 0:
                    # 자연스러운 연결 문구 추가
                    improved_sentences.append("")
                    improved_sentences.append("이러한 주장을 뒷받침하는 자료로는 다음과 같은 내용이 있습니다.")
                    
                    for i, point in enumerate(key_points, 1):
                        if point["title"] and point["info"]:
                            # 자연스러운 문장으로 변환
                            improved_sentences.append(f"{point['title']}에 따르면, {point['info']}")
                
                improved_text = '. '.join(improved_sentences)
                # 마지막에 불필요한 점이 여러 개 있는 경우 정리
                improved_text = improved_text.replace('..', '.').replace('...', '...')
        
        return ImproveTextResponse(
            improved_text=improved_text,
            original_text=request.text
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"글 수정 중 오류가 발생했습니다: {str(e)}"
        )

