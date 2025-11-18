# 토론형 커뮤니티 서비스

논리적 토론을 위한 커뮤니티 플랫폼입니다.

## 기술 스택

- **프론트엔드**: Next.js, Chakra UI
- **백엔드**: FastAPI, SQLAlchemy
- **데이터베이스**: SQLite (개발 환경)

## 주요 기능

1. **회원가입/로그인**: 정당 선택 포함
2. **주제별 토론 게시판**: 정치, 경제, 사회, 문화, IT, 세계 카테고리
3. **지역별 토론 게시판**: 광역/기초 지역 선택, 지역 현안 및 공약 토론
4. **찬반 토론 화면**: 주장 카드, 반박 트리 구조
5. **근거 제시 기능**: 인라인 근거 표시, 근거 자료 요약
6. **AI 지원 기능**: AI 근거 찾기, AI 글 수정

## 설치 및 실행

### 프론트엔드

```bash
cd frontend
npm install
npm run dev
```

프론트엔드는 `http://localhost:3000`에서 실행됩니다.

### 백엔드

```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

백엔드는 `http://localhost:8000`에서 실행됩니다.

## 프로젝트 구조

```
COSE480/
├── frontend/          # Next.js 프론트엔드
│   ├── app/           # Next.js App Router
│   │   ├── auth/      # 인증 페이지
│   │   ├── debate/    # 토론 게시판
│   │   └── write/     # 글 작성
│   └── ...
├── backend/           # FastAPI 백엔드
│   ├── app/
│   │   ├── routers/   # API 라우터
│   │   ├── models.py  # 데이터베이스 모델
│   │   └── schemas.py # Pydantic 스키마
│   └── main.py        # FastAPI 앱
└── README.md
```

## API 문서

백엔드 서버 실행 후 `http://localhost:8000/docs`에서 Swagger UI를 통해 API 문서를 확인할 수 있습니다.

## API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인

### 토론 주제
- `GET /api/topics` - 주제 목록 조회
- `GET /api/topics/{id}` - 주제 상세 조회
- `POST /api/topics` - 주제 생성

### 주장
- `GET /api/claims/topic/{topic_id}` - 주제별 주장 목록
- `GET /api/claims/{id}` - 주장 상세 조회
- `GET /api/claims/{id}/evidence` - 주장의 근거 목록
- `POST /api/claims` - 주장 생성

### 반박
- `GET /api/rebuttals/claim/{claim_id}` - 주장별 반박 목록
- `POST /api/rebuttals` - 반박 생성

## 개발 참고사항

- 모든 텍스트는 한글로 작성되어 있습니다.
- Chakra UI v2를 사용합니다.
- 데이터베이스는 SQLite를 사용하며, `backend/debate_community.db`에 생성됩니다.

