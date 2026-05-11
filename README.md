# ⚾ 엘고리즘 (LGorism)

LG 트윈스 팬들을 위한 **단관 신청 웹앱**입니다.  
경기 일정을 달력으로 확인하고, 날짜를 선택해 단체 관람 신청을 간편하게 관리할 수 있어요.

---

## 주요 기능

- **경기 일정 달력** — 2026 시즌 LG 트윈스 홈/원정 경기 일정 표시
- **단관 신청** — 닉네임, 인원 수, 특이사항, 비밀번호 입력으로 신청
- **신청 목록 조회** — 날짜별 신청 현황 및 총 인원 확인
- **신청 수정/삭제** — 비밀번호 인증 기반의 개인 신청 관리
- **달력 뱃지** — 신청 인원이 있는 날짜에 뱃지 표시
- **신청 마감** — 지난 경기는 자동으로 신청 마감 처리

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React 18, Vite |
| Backend (DB) | Supabase (PostgreSQL) |
| 배포 | Vercel |

---

## 프로젝트 구조

```
LGorism/
├── frontend/               # React 프론트엔드
│   └── src/
│       ├── components/     # Calendar, GameCard, ApplicationForm, ApplicationList
│       ├── data/           # games.js (2026 시즌 경기 일정)
│       └── utils/          # supabase.js, storage.js (CRUD)
└── src/                    # Spring Boot 백엔드 (기본 설정)
```

---

## 로컬 실행

### 환경 변수 설정

`frontend/.env.local` 파일을 생성하고 Supabase 키를 입력하세요:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 실행

```bash
cd frontend
npm install
npm run dev
```

---

## Supabase 테이블 구조

```sql
create table applications (
  id         uuid primary key default gen_random_uuid(),
  game_date  text not null,
  name       text not null,
  count      integer not null,
  request    text,
  password   text not null,
  created_at timestamptz default now(),
  updated_at timestamptz
);
```

---

오늘도 엘지 화이팅! 🔴⚾
