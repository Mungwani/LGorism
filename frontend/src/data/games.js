/**
 * LG 트윈스 2026 공식 경기 일정
 * ─────────────────────────────────────────────
 * XvsLG  → LG 홈 (isHome: true)
 * LGvsX  → LG 원정 (isHome: false)
 * 두산vsLG / LGvs두산 at 잠실 → 잠실 더비 (홈/원정 구분)
 * 05.09까지 → 이미 완료된 경기 (isClosed: true)
 */
export const games = [

  // ── 5월 ────────────────────────────────────────────────────
  { id: 1,  date: "2026-05-01", opponent: "NC",   time: "17:00", stadium: "잠실",                  isHome: true,  isClosed: true  },
  { id: 2,  date: "2026-05-02", opponent: "NC",   time: "17:00", stadium: "잠실",                  isHome: true,  isClosed: true  },
  { id: 3,  date: "2026-05-03", opponent: "NC",   time: "14:00", stadium: "잠실",                  isHome: true,  isClosed: true  },
  { id: 4,  date: "2026-05-05", opponent: "두산", time: "14:00", stadium: "잠실",                  isHome: true,  isClosed: true  },
  { id: 5,  date: "2026-05-06", opponent: "두산", time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: true  },
  { id: 6,  date: "2026-05-07", opponent: "두산", time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: true  },
  { id: 7,  date: "2026-05-08", opponent: "한화", time: "18:30", stadium: "한화생명이글스파크",       isHome: false, isClosed: true  },
  { id: 8,  date: "2026-05-09", opponent: "한화", time: "14:00", stadium: "한화생명이글스파크",       isHome: false, isClosed: true  },
  { id: 9,  date: "2026-05-10", opponent: "한화", time: "14:00", stadium: "한화생명이글스파크",       isHome: false, isClosed: false },
  { id: 10, date: "2026-05-12", opponent: "삼성", time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 11, date: "2026-05-13", opponent: "삼성", time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 12, date: "2026-05-14", opponent: "삼성", time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 13, date: "2026-05-15", opponent: "SSG",  time: "18:30", stadium: "인천SSG랜더스필드",       isHome: false, isClosed: false },
  { id: 14, date: "2026-05-16", opponent: "SSG",  time: "17:00", stadium: "인천SSG랜더스필드",       isHome: false, isClosed: false },
  { id: 15, date: "2026-05-17", opponent: "SSG",  time: "14:00", stadium: "인천SSG랜더스필드",       isHome: false, isClosed: false },
  { id: 16, date: "2026-05-19", opponent: "KIA",  time: "18:30", stadium: "광주-기아 챔피언스필드",   isHome: false, isClosed: false },
  { id: 17, date: "2026-05-20", opponent: "KIA",  time: "18:30", stadium: "광주-기아 챔피언스필드",   isHome: false, isClosed: false },
  { id: 18, date: "2026-05-21", opponent: "KIA",  time: "18:30", stadium: "광주-기아 챔피언스필드",   isHome: false, isClosed: false },
  { id: 19, date: "2026-05-22", opponent: "키움", time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 20, date: "2026-05-23", opponent: "키움", time: "14:00", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 21, date: "2026-05-24", opponent: "키움", time: "14:00", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 22, date: "2026-05-26", opponent: "롯데", time: "18:30", stadium: "사직",                  isHome: false, isClosed: false },
  { id: 23, date: "2026-05-27", opponent: "롯데", time: "18:30", stadium: "사직",                  isHome: false, isClosed: false },
  { id: 24, date: "2026-05-28", opponent: "롯데", time: "18:30", stadium: "사직",                  isHome: false, isClosed: false },
  { id: 25, date: "2026-05-29", opponent: "KIA",  time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 26, date: "2026-05-30", opponent: "KIA",  time: "17:00", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 27, date: "2026-05-31", opponent: "KIA",  time: "14:00", stadium: "잠실",                  isHome: true,  isClosed: false },

  // ── 6월 ────────────────────────────────────────────────────
  { id: 28, date: "2026-06-02", opponent: "KT",   time: "18:30", stadium: "수원KT위즈파크",          isHome: false, isClosed: false },
  { id: 29, date: "2026-06-03", opponent: "KT",   time: "17:00", stadium: "수원KT위즈파크",          isHome: false, isClosed: false },
  { id: 30, date: "2026-06-04", opponent: "KT",   time: "18:30", stadium: "수원KT위즈파크",          isHome: false, isClosed: false },
  { id: 31, date: "2026-06-05", opponent: "NC",   time: "18:30", stadium: "창원NC파크",             isHome: false, isClosed: false },
  { id: 32, date: "2026-06-06", opponent: "NC",   time: "17:00", stadium: "창원NC파크",             isHome: false, isClosed: false },
  { id: 33, date: "2026-06-07", opponent: "NC",   time: "17:00", stadium: "창원NC파크",             isHome: false, isClosed: false },
  { id: 34, date: "2026-06-09", opponent: "SSG",  time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 35, date: "2026-06-10", opponent: "SSG",  time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 36, date: "2026-06-11", opponent: "SSG",  time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 37, date: "2026-06-12", opponent: "롯데", time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 38, date: "2026-06-13", opponent: "롯데", time: "17:00", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 39, date: "2026-06-14", opponent: "롯데", time: "17:00", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 40, date: "2026-06-16", opponent: "KIA",  time: "18:30", stadium: "광주-기아 챔피언스필드",   isHome: false, isClosed: false },
  { id: 41, date: "2026-06-17", opponent: "KIA",  time: "18:30", stadium: "광주-기아 챔피언스필드",   isHome: false, isClosed: false },
  { id: 42, date: "2026-06-18", opponent: "KIA",  time: "18:30", stadium: "광주-기아 챔피언스필드",   isHome: false, isClosed: false },
  { id: 43, date: "2026-06-19", opponent: "두산", time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 44, date: "2026-06-20", opponent: "두산", time: "17:00", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 45, date: "2026-06-21", opponent: "두산", time: "17:00", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 46, date: "2026-06-23", opponent: "삼성", time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 47, date: "2026-06-24", opponent: "삼성", time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 48, date: "2026-06-25", opponent: "삼성", time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 49, date: "2026-06-26", opponent: "롯데", time: "18:30", stadium: "사직",                  isHome: false, isClosed: false },
  { id: 50, date: "2026-06-27", opponent: "롯데", time: "17:00", stadium: "사직",                  isHome: false, isClosed: false },
  { id: 51, date: "2026-06-28", opponent: "롯데", time: "17:00", stadium: "사직",                  isHome: false, isClosed: false },
  { id: 52, date: "2026-06-30", opponent: "키움", time: "18:30", stadium: "고척스카이돔",            isHome: false, isClosed: false },

  // ── 7월 ────────────────────────────────────────────────────
  { id: 53, date: "2026-07-01", opponent: "키움", time: "18:30", stadium: "고척스카이돔",            isHome: false, isClosed: false },
  { id: 54, date: "2026-07-02", opponent: "키움", time: "18:30", stadium: "고척스카이돔",            isHome: false, isClosed: false },
  { id: 55, date: "2026-07-03", opponent: "한화", time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 56, date: "2026-07-04", opponent: "한화", time: "18:00", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 57, date: "2026-07-05", opponent: "한화", time: "18:00", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 58, date: "2026-07-07", opponent: "삼성", time: "18:30", stadium: "대구삼성라이온즈파크",    isHome: false, isClosed: false },
  { id: 59, date: "2026-07-08", opponent: "삼성", time: "18:30", stadium: "대구삼성라이온즈파크",    isHome: false, isClosed: false },
  { id: 60, date: "2026-07-09", opponent: "삼성", time: "18:30", stadium: "대구삼성라이온즈파크",    isHome: false, isClosed: false },
  { id: 61, date: "2026-07-16", opponent: "KT",   time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 62, date: "2026-07-17", opponent: "KT",   time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 63, date: "2026-07-18", opponent: "KT",   time: "18:00", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 64, date: "2026-07-19", opponent: "KT",   time: "18:00", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 65, date: "2026-07-21", opponent: "NC",   time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 66, date: "2026-07-22", opponent: "NC",   time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 67, date: "2026-07-23", opponent: "NC",   time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 68, date: "2026-07-24", opponent: "한화", time: "18:30", stadium: "한화생명이글스파크",       isHome: false, isClosed: false },
  { id: 69, date: "2026-07-25", opponent: "한화", time: "18:00", stadium: "한화생명이글스파크",       isHome: false, isClosed: false },
  { id: 70, date: "2026-07-26", opponent: "한화", time: "18:00", stadium: "한화생명이글스파크",       isHome: false, isClosed: false },
  { id: 71, date: "2026-07-28", opponent: "키움", time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 72, date: "2026-07-29", opponent: "키움", time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 73, date: "2026-07-30", opponent: "키움", time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 74, date: "2026-07-31", opponent: "두산", time: "18:30", stadium: "잠실",                  isHome: false, isClosed: false },

  // ── 8월 ────────────────────────────────────────────────────
  { id: 75,  date: "2026-08-01", opponent: "두산", time: "18:00", stadium: "잠실",                  isHome: false, isClosed: false },
  { id: 76,  date: "2026-08-02", opponent: "두산", time: "14:00", stadium: "잠실",                  isHome: false, isClosed: false },
  { id: 77,  date: "2026-08-04", opponent: "SSG",  time: "18:30", stadium: "인천SSG랜더스필드",       isHome: false, isClosed: false },
  { id: 78,  date: "2026-08-05", opponent: "SSG",  time: "18:30", stadium: "인천SSG랜더스필드",       isHome: false, isClosed: false },
  { id: 79,  date: "2026-08-06", opponent: "SSG",  time: "18:30", stadium: "인천SSG랜더스필드",       isHome: false, isClosed: false },
  { id: 80,  date: "2026-08-07", opponent: "KIA",  time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 81,  date: "2026-08-08", opponent: "KIA",  time: "17:00", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 82,  date: "2026-08-09", opponent: "KIA",  time: "14:00", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 83,  date: "2026-08-11", opponent: "키움", time: "18:30", stadium: "고척스카이돔",            isHome: false, isClosed: false },
  { id: 84,  date: "2026-08-12", opponent: "키움", time: "18:30", stadium: "고척스카이돔",            isHome: false, isClosed: false },
  { id: 85,  date: "2026-08-13", opponent: "키움", time: "18:30", stadium: "고척스카이돔",            isHome: false, isClosed: false },
  { id: 86,  date: "2026-08-14", opponent: "SSG",  time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 87,  date: "2026-08-15", opponent: "SSG",  time: "17:00", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 88,  date: "2026-08-16", opponent: "SSG",  time: "14:00", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 89,  date: "2026-08-18", opponent: "KT",   time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 90,  date: "2026-08-19", opponent: "KT",   time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 91,  date: "2026-08-20", opponent: "KT",   time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 92,  date: "2026-08-21", opponent: "한화", time: "18:30", stadium: "한화생명이글스파크",       isHome: false, isClosed: false },
  { id: 93,  date: "2026-08-22", opponent: "한화", time: "17:00", stadium: "한화생명이글스파크",       isHome: false, isClosed: false },
  { id: 94,  date: "2026-08-23", opponent: "한화", time: "14:00", stadium: "한화생명이글스파크",       isHome: false, isClosed: false },
  { id: 95,  date: "2026-08-25", opponent: "NC",   time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 96,  date: "2026-08-26", opponent: "NC",   time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 97,  date: "2026-08-27", opponent: "NC",   time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 98,  date: "2026-08-28", opponent: "롯데", time: "18:30", stadium: "사직",                  isHome: false, isClosed: false },
  { id: 99,  date: "2026-08-29", opponent: "롯데", time: "17:00", stadium: "사직",                  isHome: false, isClosed: false },
  { id: 100, date: "2026-08-30", opponent: "롯데", time: "14:00", stadium: "사직",                  isHome: false, isClosed: false },

  // ── 9월 ────────────────────────────────────────────────────
  { id: 101, date: "2026-09-01", opponent: "두산", time: "18:30", stadium: "잠실",                  isHome: false, isClosed: false },
  { id: 102, date: "2026-09-02", opponent: "두산", time: "18:30", stadium: "잠실",                  isHome: false, isClosed: false },
  { id: 103, date: "2026-09-03", opponent: "두산", time: "18:30", stadium: "잠실",                  isHome: false, isClosed: false },
  { id: 104, date: "2026-09-04", opponent: "삼성", time: "18:30", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 105, date: "2026-09-05", opponent: "삼성", time: "17:00", stadium: "잠실",                  isHome: true,  isClosed: false },
  { id: 106, date: "2026-09-06", opponent: "삼성", time: "14:00", stadium: "잠실",                  isHome: true,  isClosed: false },
];

/** 날짜 문자열로 경기 찾기 */
export function getGameByDate(dateStr) {
  return games.find((g) => g.date === dateStr) || null;
}

/** 홈 경기 날짜 Set */
export const gameDateSet = new Set(
  games.filter((g) => g.isHome).map((g) => g.date)
);

/** 전체 경기 날짜 Set (홈+원정) */
export const allGameDateSet = new Set(games.map((g) => g.date));
