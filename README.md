# ⚾ 엘고리즘 (LGorism)

LG 트윈스 팬 커뮤니티를 위한 **단관 · 직관 · 정모 통합 관리 웹앱**

경기 일정을 달력으로 확인하고, 단관 신청부터 직관 인증, 정모 이벤트까지 한 곳에서 관리합니다.

🔗 **https://lgorism.vercel.app**

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React 18 + Vite |
| Database | Supabase (PostgreSQL) |
| 배포 | Vercel |

---

## 주요 기능

### 📅 경기 일정 달력
- 2026 시즌 LG 트윈스 전체 경기 일정 표시 (홈 / 원정 구분)
- 날짜별 단관 신청자 수 · 직관 인증 수 · 정모 수 뱃지 표시
- 필터 칩으로 뷰 전환
  - **전체**: 달력 기본 뷰
  - **정모**: 오늘 이후 전체 정모 목록
  - **단관**: 단관이 열린 날짜 목록

### 📋 단관 신청
- 관리자가 오픈한 날짜에만 신청 가능 (미오픈 시 안내 카드 표시)
- 닉네임 · 인원 · 특이사항 · 비밀번호 입력
- 비밀번호 인증 기반 수정 · 삭제
- 입금 완료 버튼 — 비밀번호 확인 후 본인이 직접 입금 처리
- 지난 경기 자동 마감 처리

### 🏟 직관 인증
- 날짜별 직관 멤버 등록 (닉네임 · 구역 · 수건 요정 여부)
- 비밀번호 인증 기반 삭제

### 🎮 정모
- 날짜별 정모 이벤트 생성 (제목 · 설명 · 비밀번호)
- 정모별 참가 신청 (닉네임 · 인원 · 메모)
- 전체 정모 목록 한눈에 보기 (오늘 이후 기준)

### 🛡 관리자 페이지
- **진입**: 헤더 LG 로고 5번 탭 → 관리자 비밀번호 입력
- **활동 로그**: 단관·직관·정모의 등록·수정·삭제·입금 이력 (카테고리·액션별 필터)
- **입금 관리**: 날짜별 신청자 입금 여부 토글 (변경 전 확인 모달)
- **단관 날짜 관리**: 홈 경기 날짜별 단관 오픈 / 마감 토글

---

## 프로젝트 구조

```
LGorism/
├── frontend/                        # React 앱 (실제 서비스)
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx                 # 진입점
│       ├── App.jsx                  # 루트 컴포넌트 + 전체 상태 관리
│       ├── App.css
│       ├── index.css
│       ├── components/
│       │   ├── Calendar.jsx         # 경기 일정 달력 (뱃지 포함)
│       │   ├── GameCard.jsx         # 선택된 날짜의 경기 정보 카드
│       │   ├── ApplicationForm.jsx  # 단관 신청 폼 (신규·수정 겸용)
│       │   ├── ApplicationList.jsx  # 단관 신청 목록
│       │   ├── DangwanDateList.jsx  # 단관 오픈 날짜 목록 (필터 뷰)
│       │   ├── JikgwanPanel.jsx     # 직관 등록 + 목록
│       │   ├── JungmoPanel.jsx      # 정모 생성 + 참가 신청
│       │   ├── AllJungmoList.jsx    # 전체 정모 목록 (필터 뷰)
│       │   ├── PhotoUpload.jsx      # 사진 업로드
│       │   └── AdminPage.jsx        # 관리자 페이지 (로그·입금·단관 관리)
│       ├── data/
│       │   └── games.js             # 2026 시즌 경기 일정 정적 데이터
│       └── utils/
│           ├── supabase.js          # Supabase 클라이언트 초기화
│           └── storage.js           # 전체 DB CRUD + 감사 로그 함수
└── src/                             # Spring Boot 백엔드 (초기 스캐폴딩)
    └── main/java/com/back/
        └── LGorismApplication.java
```

---

## 데이터 흐름

```
App.jsx (전역 상태)
  ├── 날짜 선택 → getApplications / getJikgwanList / getJungmoList 호출
  ├── 요약 데이터 → getApplicationSummary / getJikgwanSummary / getJungmoSummary
  │     └── Calendar에 뱃지로 전달
  └── 각 액션(생성·수정·삭제·입금) → storage.js → Supabase → 상태 갱신
```

모든 DB 통신은 `frontend/src/utils/storage.js` 에서 담당하며, Supabase JS SDK를 직접 호출합니다. 백엔드 서버는 없습니다.

---

## 로컬 실행

**1. 환경 변수 설정**

`frontend/.env.local` 파일 생성:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ADMIN_PASSWORD=your-admin-password
```

**2. 의존성 설치 및 실행**

```bash
cd frontend
npm install
npm run dev
```

**3. 빌드 및 미리보기**

```bash
npm run build
npm run preview
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

-- 직관 인증
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

-- 정모 참가 신청
create table jungmo_applications (
  id         uuid primary key default gen_random_uuid(),
  jungmo_id  uuid references jungmo(id) on delete cascade,
  nickname   text not null,
  count      integer default 1,
  note       text,
  password   text not null,
  created_at timestamptz default now()
);

-- 단관 오픈 날짜 (관리자가 관리)
create table dangwan_open_dates (
  game_date text primary key
);

-- 감사 로그
create table audit_logs (
  id         uuid primary key default gen_random_uuid(),
  action     text not null,   -- create | update | delete | pay
  category   text not null,   -- dangwan | jikgwan | jungmo
  game_date  text,
  actor_name text not null,
  details    text,
  created_at timestamptz default now()
);
```

---

## 컴포넌트 상세

| 컴포넌트 | 역할 |
|----------|------|
| `App.jsx` | 전역 상태(날짜·탭·각 목록·요약) 관리, 모든 핸들러 정의 |
| `Calendar` | 월 단위 달력, 날짜별 단관·직관·정모 뱃지 렌더링 |
| `GameCard` | 선택 날짜의 상대팀·시간·구장 정보 표시 |
| `ApplicationForm` | 단관 신청 폼, `editingItem` prop으로 수정 모드 전환 |
| `ApplicationList` | 신청 목록, 입금 상태·비밀번호 인증 UI 포함 |
| `DangwanDateList` | 단관 필터 뷰에서 오픈 날짜 목록 표시 |
| `JikgwanPanel` | 직관 등록 폼 + 해당 날짜 직관 목록 |
| `JungmoPanel` | 정모 생성 + 정모별 참가 신청 목록 |
| `AllJungmoList` | 정모 필터 뷰에서 오늘 이후 전체 정모 표시 |
| `AdminPage` | 로그 조회·입금 토글·단관 날짜 오픈/마감 |

---

오늘도 엘지 화이팅! 🔴⚾
