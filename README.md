# ⚾ 엘고리즘 (LGorism)

LG 트윈스 팬 커뮤니티를 위한 **단관 · 직관 · 정모 통합 관리 웹앱**입니다.  
경기 일정을 달력으로 확인하고, 단관 신청부터 직관 인증, 정모 이벤트까지 한 곳에서 관리할 수 있어요.

🔗 **https://lgorism.vercel.app**

---

## 주요 기능

### 📅 경기 일정
- 2026 시즌 LG 트윈스 홈/원정 경기 달력 표시
- 날짜별 단관·직관·정모 현황 뱃지 표시
- 필터 칩으로 전체 / 정모 / 단관 빠른 전환

### 📋 단관 신청
- 닉네임·인원·특이사항·비밀번호로 신청
- 비밀번호 인증 기반 수정 / 삭제
- **💳 입금 완료** 버튼 — 비밀번호 확인 후 본인이 직접 입금 처리
- 지난 경기 자동 마감

### 🏟 직관 인증
- 날짜별 직관 멤버 등록 및 구역 입력
- 수건 요정 여부 체크

### 🎮 정모
- 날짜별 정모 이벤트 생성 및 신청
- 전체 정모 목록 한눈에 보기

### 🛡 관리자 페이지
- **진입 방법**: 헤더 LG 로고 5번 탭 → 비밀번호 입력
- **활동 로그**: 단관·직관·정모의 등록·수정·삭제·입금 기록 (카테고리/액션별 필터)
- **입금 관리**: 날짜별 신청자 입금 여부 토글 (변경 전 확인 모달)

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React 18, Vite |
| Database | Supabase (PostgreSQL) |
| 배포 | Vercel |

---

## 프로젝트 구조

```
LGorism/
└── frontend/
    └── src/
        ├── components/
        │   ├── AdminPage.jsx       # 관리자 페이지 (로그 + 입금 관리)
        │   ├── ApplicationForm.jsx # 단관 신청 폼
        │   ├── ApplicationList.jsx # 단관 신청 목록
        │   ├── AllJungmoList.jsx   # 전체 정모 목록
        │   ├── Calendar.jsx        # 경기 일정 달력
        │   ├── DangwanDateList.jsx # 단관 날짜 목록
        │   ├── GameCard.jsx        # 경기 정보 카드
        │   ├── JikgwanPanel.jsx    # 직관 패널
        │   └── JungmoPanel.jsx     # 정모 패널
        ├── data/
        │   └── games.js            # 2026 시즌 경기 일정
        └── utils/
            ├── storage.js          # Supabase CRUD + 감사 로그
            └── supabase.js         # Supabase 클라이언트
```

---

## 로컬 실행

`frontend/.env.local` 파일 생성 후 Supabase 키 입력:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

```bash
cd frontend
npm install
npm run dev
```

---

## Supabase 테이블 구조

```sql
-- 단관 신청
create table applications (
  id         uuid primary key default gen_random_uuid(),
  game_date  text not null,
  name       text not null,
  count      integer not null,
  request    text,
  password   text not null,
  is_paid    boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz
);

-- 직관
create table jikgwan (
  id             uuid primary key default gen_random_uuid(),
  game_date      text not null,
  nickname       text not null,
  section        text,
  is_towel_fairy boolean default false,
  password       text not null,
  created_at     timestamptz default now()
);

-- 정모
create table jungmo (
  id          uuid primary key default gen_random_uuid(),
  event_date  text not null,
  title       text not null,
  description text,
  password    text not null,
  created_at  timestamptz default now()
);

-- 정모 신청
create table jungmo_applications (
  id        uuid primary key default gen_random_uuid(),
  jungmo_id uuid references jungmo(id) on delete cascade,
  nickname  text not null,
  count     integer default 1,
  note      text,
  password  text not null,
  created_at timestamptz default now()
);

-- 감사 로그
create table audit_logs (
  id         uuid primary key default gen_random_uuid(),
  action     text not null,  -- create | update | delete | pay
  category   text not null,  -- dangwan | jikgwan | jungmo
  game_date  text,
  actor_name text not null,
  details    text,
  created_at timestamptz default now()
);
```

---

오늘도 엘지 화이팅! 🔴⚾
