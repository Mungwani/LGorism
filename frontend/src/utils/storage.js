/**
 * 스토리지 유틸리티 — Supabase 버전
 * ─────────────────────────────────────────────────────────────
 * DB 테이블: applications
 *   id         uuid (PK, auto)
 *   game_date  text  (예: "2026-05-12")
 *   name       text
 *   count      integer
 *   request    text (nullable)
 *   created_at timestamptz (auto)
 *   updated_at timestamptz (nullable)
 */

import { supabase } from './supabase'

// password 컬럼은 select 권한에서 빠져있어서, 반드시 아래 컬럼 목록으로만 select 해야 함 ('*' 사용 불가)
const APPLICATION_COLS = 'id, game_date, name, count, request, created_at, updated_at, is_paid'
const JIKGWAN_COLS = 'id, game_date, nickname, section, is_towel_fairy, created_at, towel_meeting_area, towel_inning'
const JUNGMO_COLS = 'id, event_date, title, description, created_at'
const JUNGMO_APPLICATION_COLS = 'id, jungmo_id, nickname, note, created_at, count, is_paid'
const TRANSFER_COLS = 'id, game_date, seat_section, seat_row, seat_number, quantity, price, note, nickname, is_sold, created_at, sold_to, is_deleted'
const TRANSFER_RESERVATION_COLS = 'id, transfer_id, nickname, created_at'

export async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const buf  = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 관리자 비밀번호 검증 — 실제 값은 DB에만 있고 클라이언트에는 절대 내려오지 않음
export async function verifyAdminPassword(password) {
  const { data, error } = await supabase.rpc('verify_admin_password', { p_password: password })
  if (error) throw error
  return data === true
}

// DB row → 앱 내부 포맷 변환
function toApp(row) {
  return {
    id:        row.id,
    name:      row.name,
    count:     row.count,
    request:   row.request || '',
    isPaid:    row.is_paid || false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ── 신청 CRUD ──────────────────────────────────────────────────

/** 특정 날짜의 신청 목록 반환 */
export async function getApplications(date) {
  const { data, error } = await supabase
    .from('applications')
    .select(APPLICATION_COLS)
    .eq('game_date', date)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []).map(toApp)
}

/** 신청 추가 */
export async function saveApplication(date, application) {
  const { data, error } = await supabase
    .from('applications')
    .insert({
      game_date: date,
      name:      application.name,
      count:     Number(application.count),
      request:   application.request || null,
      password:  await hashPassword(application.password || ''),
    })
    .select(APPLICATION_COLS)
    .single()

  if (error) throw error
  return toApp(data)
}

/** 신청 수정 — 비밀번호는 서버(RPC)에서 검증 */
export async function updateApplication(date, id, password, updatedFields) {
  const { data, error } = await supabase.rpc('rpc_update_application', {
    p_id: id,
    p_game_date: date,
    p_password: password,
    p_name: updatedFields.name,
    p_count: Number(updatedFields.count),
    p_request: updatedFields.request || null,
  })
  if (error) throw error
  return data === true
}

/** 신청 삭제 — 비밀번호는 서버(RPC)에서 검증 */
export async function deleteApplication(date, id, password) {
  const { data, error } = await supabase.rpc('rpc_delete_application', {
    p_id: id,
    p_game_date: date,
    p_password: password,
  })
  if (error) throw error
  return data === true
}

/** 입금 여부 토글 — 관리자 비밀번호는 서버(RPC)에서 검증 */
export async function updatePaymentStatus(date, id, isPaid, adminPassword) {
  const { data, error } = await supabase.rpc('rpc_admin_update_payment', {
    p_id: id,
    p_game_date: date,
    p_is_paid: isPaid,
    p_admin_password: adminPassword,
  })
  if (error) throw error
  return data === true
}

// ── 통계 ───────────────────────────────────────────────────────

/** applications 배열로 총 인원 계산 (DB 추가 호출 없이) */
export function getTotalCount(applications) {
  return applications.reduce((sum, item) => sum + (Number(item.count) || 0), 0)
}

/** 날짜별 신청 요약 (달력 뱃지용) — 전체 조회 1회 */
export async function getApplicationSummary() {
  const { data, error } = await supabase
    .from('applications')
    .select('game_date, count')

  if (error) throw error

  const summary = {}
  ;(data || []).forEach((row) => {
    if (!summary[row.game_date]) {
      summary[row.game_date] = { applicantCount: 0, totalPeople: 0 }
    }
    summary[row.game_date].applicantCount += 1
    summary[row.game_date].totalPeople += Number(row.count) || 0
  })
  return summary
}

// ── 직관 CRUD ──────────────────────────────────────────────────

function toJikgwan(row) {
  return {
    id:               row.id,
    nickname:         row.nickname,
    section:          row.section || '',
    isTowelFairy:     row.is_towel_fairy || false,
    towelMeetingArea: row.towel_meeting_area || '',
    towelInning:      row.towel_inning || '5회말',
    createdAt:        row.created_at,
  }
}

export async function getJikgwanList(date) {
  const { data, error } = await supabase
    .from('jikgwan')
    .select(JIKGWAN_COLS)
    .eq('game_date', date)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []).map(toJikgwan)
}

export async function addJikgwan(date, { nickname, section, isTowelFairy, towelMeetingArea, towelInning, password }) {
  const { data, error } = await supabase
    .from('jikgwan')
    .insert({
      game_date: date,
      nickname,
      section: section || null,
      is_towel_fairy: isTowelFairy,
      towel_meeting_area: isTowelFairy ? (towelMeetingArea || null) : null,
      towel_inning: isTowelFairy ? (towelInning || '5회말') : null,
      password: await hashPassword(password || ''),
    })
    .select(JIKGWAN_COLS)
    .single()
  if (error) throw error
  return toJikgwan(data)
}

export async function updateJikgwan(id, password, { isTowelFairy, towelMeetingArea, towelInning }) {
  const { data, error } = await supabase.rpc('rpc_update_jikgwan', {
    p_id: id,
    p_password: password,
    p_is_towel_fairy: isTowelFairy,
    p_towel_meeting_area: isTowelFairy ? (towelMeetingArea || null) : null,
    p_towel_inning: isTowelFairy ? (towelInning || '5회말') : null,
  })
  if (error) throw error
  return data === true
}

export async function deleteJikgwan(id, password) {
  const { data, error } = await supabase.rpc('rpc_delete_jikgwan', { p_id: id, p_password: password })
  if (error) throw error
  return data === true
}

export async function getJikgwanSummary() {
  const { data, error } = await supabase.from('jikgwan').select('game_date')
  if (error) throw error
  const summary = {}
  ;(data || []).forEach((row) => {
    summary[row.game_date] = (summary[row.game_date] || 0) + 1
  })
  return summary
}

// ── 정모 CRUD ──────────────────────────────────────────────────

function toJungmo(row) {
  return {
    id:          row.id,
    title:       row.title,
    description: row.description || '',
    eventDate:   row.event_date,
    createdAt:   row.created_at,
  }
}

export async function getJungmoList(date) {
  const { data, error } = await supabase
    .from('jungmo')
    .select(JUNGMO_COLS)
    .eq('event_date', date)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []).map(toJungmo)
}

export async function createJungmo(date, { title, description, password }) {
  const { data, error } = await supabase
    .from('jungmo')
    .insert({ event_date: date, title, description: description || null, password: await hashPassword(password || '') })
    .select(JUNGMO_COLS)
    .single()
  if (error) throw error
  return toJungmo(data)
}

export async function updateJungmo(id, password, { title, description }) {
  const { data, error } = await supabase.rpc('rpc_update_jungmo', {
    p_id: id, p_password: password, p_title: title, p_description: description || null,
  })
  if (error) throw error
  return data === true
}

export async function deleteJungmo(id, password) {
  const { data, error } = await supabase.rpc('rpc_delete_jungmo', { p_id: id, p_password: password })
  if (error) throw error
  return data === true
}

export async function getJungmoSummary() {
  const { data, error } = await supabase.from('jungmo').select('event_date')
  if (error) throw error
  const summary = {}
  ;(data || []).forEach((row) => {
    summary[row.event_date] = (summary[row.event_date] || 0) + 1
  })
  return summary
}

// ── 정모 신청 CRUD ─────────────────────────────────────────────

function toJungmoApp(row) {
  return {
    id:        row.id,
    jungmoId:  row.jungmo_id,
    nickname:  row.nickname,
    count:     row.count || 1,
    note:      row.note || '',
    isPaid:    row.is_paid || false,
    createdAt: row.created_at,
    updatedAt: row.updated_at || null,
  }
}

export async function getJungmoApplications(jungmoId) {
  const { data, error } = await supabase
    .from('jungmo_applications')
    .select(JUNGMO_APPLICATION_COLS)
    .eq('jungmo_id', jungmoId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []).map(toJungmoApp)
}

export async function addJungmoApplication(jungmoId, { nickname, count, note, password }) {
  const { data, error } = await supabase
    .from('jungmo_applications')
    .insert({ jungmo_id: jungmoId, nickname, count: Number(count) || 1, note: note || null, password: await hashPassword(password || '') })
    .select(JUNGMO_APPLICATION_COLS)
    .single()
  if (error) throw error
  return toJungmoApp(data)
}

export async function updateJungmoApplication(id, password, { nickname, count, note }) {
  const { data, error } = await supabase.rpc('rpc_update_jungmo_application', {
    p_id: id, p_password: password, p_nickname: nickname, p_count: Number(count) || 1, p_note: note || null,
  })
  if (error) throw error
  return data === true
}

export async function deleteJungmoApplication(id, password) {
  const { data, error } = await supabase.rpc('rpc_delete_jungmo_application', { p_id: id, p_password: password })
  if (error) throw error
  return data === true
}

export async function updateJungmoPaymentStatus(id, isPaid, adminPassword) {
  const { data, error } = await supabase.rpc('rpc_admin_update_jungmo_payment', {
    p_id: id, p_is_paid: isPaid, p_admin_password: adminPassword,
  })
  if (error) throw error
  return data === true
}

export async function getAllJungmoApplicationsWithInfo() {
  const [{ data: apps, error: appError }, { data: jungmos, error: jungmoError }] = await Promise.all([
    supabase.from('jungmo_applications').select(JUNGMO_APPLICATION_COLS).order('created_at', { ascending: true }),
    supabase.from('jungmo').select('id, title, event_date'),
  ])
  if (appError) throw appError
  if (jungmoError) throw jungmoError

  const jungmoMap = Object.fromEntries((jungmos || []).map(j => [j.id, j]))
  return (apps || []).map(row => {
    const jungmo = jungmoMap[row.jungmo_id] || {}
    return {
      id:          row.id,
      jungmoId:    row.jungmo_id,
      nickname:    row.nickname,
      count:       row.count || 1,
      note:        row.note || '',
      isPaid:      row.is_paid || false,
      jungmoTitle: jungmo.title || '',
      eventDate:   jungmo.event_date || '',
    }
  })
}

// ── 감사 로그 ──────────────────────────────────────────────────

export function logAudit(action, category, gameDate, actorName, details) {
  supabase.from('audit_logs').insert({
    action,
    category,
    game_date: gameDate || null,
    actor_name: actorName,
    details: details || null,
  }).then(() => {})
}

export async function getAuditLogs(limit = 200) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

// ── 단관 오픈 날짜 ─────────────────────────────────────────────

export async function getDangwanOpenDates() {
  const { data, error } = await supabase
    .from('dangwan_open_dates')
    .select('game_date')
    .eq('is_open', true)
  if (error) throw error
  return new Set((data || []).map(r => r.game_date))
}

export async function getAllDangwanDates() {
  const { data, error } = await supabase
    .from('dangwan_open_dates')
    .select('game_date, is_open')
    .order('game_date', { ascending: true })
  if (error) throw error
  return data || []
}

export async function openDangwanDate(date, adminPassword) {
  const { data, error } = await supabase.rpc('rpc_admin_open_dangwan_date', {
    p_game_date: date, p_admin_password: adminPassword,
  })
  if (error) throw error
  return data === true
}

export async function closeDangwanDate(date, adminPassword) {
  const { data, error } = await supabase.rpc('rpc_admin_close_dangwan_date', {
    p_game_date: date, p_admin_password: adminPassword,
  })
  if (error) throw error
  return data === true
}

export async function getAllApplications() {
  const { data, error } = await supabase
    .from('applications')
    .select(APPLICATION_COLS)
    .order('game_date', { ascending: false })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []).map(row => ({ ...toApp(row), gameDate: row.game_date }))
}

export async function getAllJungmo() {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('jungmo')
    .select(JUNGMO_COLS)
    .gte('event_date', today)
    .order('event_date', { ascending: true })
  if (error) throw error
  return (data || []).map(toJungmo)
}

/** 정모별 참여 인원 합계 { jungmoId: count } */
export async function getJungmoParticipantCounts() {
  const { data, error } = await supabase
    .from('jungmo_applications')
    .select('jungmo_id, count')
  if (error) throw error
  const counts = {}
  ;(data || []).forEach(row => {
    counts[row.jungmo_id] = (counts[row.jungmo_id] || 0) + (Number(row.count) || 1)
  })
  return counts
}

// ── 공지 CRUD ──────────────────────────────────────────────────

function toNotice(row) {
  return {
    id:        row.id,
    content:   row.content,
    isActive:  row.is_active,
    createdAt: row.created_at,
  }
}

export async function getActiveNotices() {
  const { data, error } = await supabase
    .from('notices')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(toNotice)
}

export async function getAllNotices() {
  const { data, error } = await supabase
    .from('notices')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(toNotice)
}

export async function createNotice(content, adminPassword) {
  const { data, error } = await supabase.rpc('rpc_admin_create_notice', {
    p_content: content, p_admin_password: adminPassword,
  })
  if (error) throw error
  return toNotice(data)
}

export async function updateNotice(id, content, adminPassword) {
  const { data, error } = await supabase.rpc('rpc_admin_update_notice', {
    p_id: id, p_content: content, p_admin_password: adminPassword,
  })
  if (error) throw error
  return data === true
}

export async function toggleNoticeActive(id, isActive, adminPassword) {
  const { data, error } = await supabase.rpc('rpc_admin_toggle_notice', {
    p_id: id, p_is_active: isActive, p_admin_password: adminPassword,
  })
  if (error) throw error
  return data === true
}

export async function deleteNotice(id, adminPassword) {
  const { data, error } = await supabase.rpc('rpc_admin_delete_notice', {
    p_id: id, p_admin_password: adminPassword,
  })
  if (error) throw error
  return data === true
}

// ── 배너 CRUD ─────────────────────────────────────────────────

function toBanner(row) {
  return {
    id:          row.id,
    imageBase64: row.image_base64,
    title:       row.title || '',
    description: row.description || '',
    isActive:    row.is_active,
    sortOrder:   row.sort_order,
    createdAt:   row.created_at,
  }
}

export async function getActiveBanners() {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data || []).map(toBanner)
}

export async function getAllBanners() {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data || []).map(toBanner)
}

export async function createBanner({ imageBase64, title, description }, adminPassword) {
  const { data, error } = await supabase.rpc('rpc_admin_create_banner', {
    p_image_base64: imageBase64, p_title: title, p_description: description, p_admin_password: adminPassword,
  })
  if (error) throw error
  return toBanner(data)
}

export async function updateBannerSortOrder(id, sortOrder, adminPassword) {
  const { data, error } = await supabase.rpc('rpc_admin_set_banner_sort_order', {
    p_id: id, p_sort_order: sortOrder, p_admin_password: adminPassword,
  })
  if (error) throw error
  return data === true
}

export async function updateBanner(id, { title, description }, adminPassword) {
  const { data, error } = await supabase.rpc('rpc_admin_update_banner', {
    p_id: id, p_title: title, p_description: description, p_admin_password: adminPassword,
  })
  if (error) throw error
  return data === true
}

export async function toggleBannerActive(id, isActive, adminPassword) {
  const { data, error } = await supabase.rpc('rpc_admin_toggle_banner', {
    p_id: id, p_is_active: isActive, p_admin_password: adminPassword,
  })
  if (error) throw error
  return data === true
}

export async function deleteBanner(id, adminPassword) {
  const { data, error } = await supabase.rpc('rpc_admin_delete_banner', {
    p_id: id, p_admin_password: adminPassword,
  })
  if (error) throw error
  return data === true
}

// ── 경기 결과 CRUD ─────────────────────────────────────────────

export async function getGameResults() {
  const { data, error } = await supabase
    .from('game_results')
    .select('*')
    .order('game_date', { ascending: true })
  if (error) throw error
  return data || []
}

export async function setGameResult(date, result, adminPassword) {
  const { data, error } = await supabase.rpc('rpc_admin_set_game_result', {
    p_game_date: date, p_result: result, p_admin_password: adminPassword,
  })
  if (error) throw error
  return data === true
}

export async function deleteGameResult(date, adminPassword) {
  const { data, error } = await supabase.rpc('rpc_admin_delete_game_result', {
    p_game_date: date, p_admin_password: adminPassword,
  })
  if (error) throw error
  return data === true
}

// ── 양도게시판 CRUD ────────────────────────────────────────────

function toTransfer(row) {
  return {
    id:          row.id,
    gameDate:    row.game_date,
    seatSection: row.seat_section,
    seatRow:     row.seat_row || '',
    seatNumber:  row.seat_number || '',
    quantity:    row.quantity,
    price:       row.price,
    note:        row.note || '',
    nickname:    row.nickname,
    isSold:      row.is_sold || false,
    soldTo:      row.sold_to || '',
    isDeleted:   row.is_deleted || false,
    createdAt:   row.created_at,
  }
}

function toReservation(row) {
  return {
    id:         row.id,
    transferId: row.transfer_id,
    nickname:   row.nickname,
    createdAt:  row.created_at,
  }
}

export async function getTransfers() {
  const { data, error } = await supabase
    .from('transfers')
    .select(TRANSFER_COLS)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(toTransfer)
}

export async function createTransfer({ gameDate, seatSection, seatRow, seatNumber, quantity, price, note, nickname, password }) {
  const { data, error } = await supabase
    .from('transfers')
    .insert({
      game_date:    gameDate,
      seat_section: seatSection,
      seat_row:     seatRow || null,
      seat_number:  seatNumber || null,
      quantity:     Number(quantity) || 1,
      price:        Number(price),
      note:         note || null,
      nickname,
      password:     await hashPassword(password || ''),
    })
    .select(TRANSFER_COLS)
    .single()
  if (error) throw error
  return toTransfer(data)
}

export async function deleteTransfer(id, password) {
  const { data, error } = await supabase.rpc('rpc_delete_transfer', { p_id: id, p_password: password })
  if (error) throw error
  return data === true
}

export async function toggleTransferSold(id, password, isSold, soldTo) {
  const { data, error } = await supabase.rpc('rpc_toggle_transfer_sold', {
    p_id: id, p_password: password, p_is_sold: isSold, p_sold_to: isSold ? (soldTo || null) : null,
  })
  if (error) throw error
  return data === true
}

export async function getTransferReservations(transferId) {
  const { data, error } = await supabase
    .from('transfer_reservations')
    .select(TRANSFER_RESERVATION_COLS)
    .eq('transfer_id', transferId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []).map(toReservation)
}

export async function addTransferReservation(transferId, { nickname, password }) {
  const { data, error } = await supabase
    .from('transfer_reservations')
    .insert({ transfer_id: transferId, nickname, password: await hashPassword(password || '') })
    .select(TRANSFER_RESERVATION_COLS)
    .single()
  if (error) throw error
  return toReservation(data)
}

export async function deleteTransferReservation(id, password) {
  const { data, error } = await supabase.rpc('rpc_delete_transfer_reservation', { p_id: id, p_password: password })
  if (error) throw error
  return data === true
}

