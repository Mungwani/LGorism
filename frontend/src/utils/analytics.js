const GA_ID = 'G-BQV6DNR670';

function gtag(...args) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag(...args);
}

export function trackEvent(eventName, params = {}) {
  gtag('event', eventName, { send_to: GA_ID, ...params });
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

  // UX
  tabSwitch:       (tab)         => trackEvent('tab_switch',       { tab_name: tab }),
  filterChange:    (mode)        => trackEvent('filter_change',    { filter_mode: mode }),
  dateSelect:      (date)        => trackEvent('date_select',      { game_date: date }),
};