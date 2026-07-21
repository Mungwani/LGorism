const GA_ID = 'G-BQV6DNR670';

// 프로덕션 빌드에서만 GA를 로드해서, 로컬 개발 트래픽이 실제 통계에 섞이지 않게 함
export function initGA() {
  if (!import.meta.env.PROD || typeof window === 'undefined' || window.gtag) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
}

function gtag(...args) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag(...args);
}

export function trackEvent(eventName, params = {}) {
  gtag('event', eventName, params);
}

// SPA라 라우팅이 없어서, 화면(탭)이 바뀔 때마다 가상 page_view를 보내야
// GA4 "페이지 및 화면" 리포트에 화면별로 잡힘 (안 그러면 전부 첫 로드 타이틀 하나로만 집계됨)
const PAGE_TITLES = {
  home: '홈',
  calendar: '캘린더',
  dangwan: '단관',
  jungmo: '정모',
  transfer: '양도게시판',
};

export function trackPageView(view) {
  const title = `엘고리즘 - ${PAGE_TITLES[view] || view}`;
  trackEvent('page_view', {
    page_title: title,
    page_location: `${window.location.origin}${window.location.pathname}#${view}`,
    page_path: `/${view}`,
  });
}

// 단관
export const GA = {
  dangwanApply:    (date, count) => trackEvent('dangwan_apply',    { game_date: date, people_count: count }),
  dangwanEdit:     (date)        => trackEvent('dangwan_edit',     { game_date: date }),
  dangwanDelete:   (date)        => trackEvent('dangwan_delete',   { game_date: date }),
  dangwanPay:      (date, paid)  => trackEvent('dangwan_pay',      { game_date: date, status: paid ? 'paid' : 'cancelled' }),

  // 직관
  jikgwanRegister: (date)        => trackEvent('jikgwan_register', { game_date: date }),
  jikgwanDelete:   (date)        => trackEvent('jikgwan_delete',   { game_date: date }),

  // 정모
  jungmoCreate:    (date)        => trackEvent('jungmo_create',    { game_date: date }),
  jungmoDelete:    (date)        => trackEvent('jungmo_delete',    { game_date: date }),

  // 양도
  transferPost:    (date)        => trackEvent('transfer_post',    { game_date: date }),
  transferReserve: (date)        => trackEvent('transfer_reserve', { game_date: date }),
  transferSold:    (date, sold)  => trackEvent('transfer_sold',    { game_date: date, status: sold ? 'sold' : 'reopened' }),
  transferDelete:  (date)        => trackEvent('transfer_delete',  { game_date: date }),
  transferSeatView: ()           => trackEvent('transfer_seatview_click', {}),

  // UX
  tabSwitch:       (tab)         => trackEvent('tab_switch',       { tab_name: tab }),
  filterChange:    (mode)        => trackEvent('filter_change',    { filter_mode: mode }),
  dateSelect:      (date)        => trackEvent('date_select',      { game_date: date }),
  mainViewSwitch:  (view)        => trackEvent('main_view_switch', { view_name: view }),
  pageView:        (view)        => trackPageView(view),
};