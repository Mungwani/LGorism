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

export async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const buf  = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 비밀번호 검증 — 해시 비교 우선, 평문이면 valid + needsUpgrade 반환 (마이그레이션용)
export async function verifyPassword(input, stored) {
  if (input === import.meta.env.VITE_ADMIN_PASSWORD) return { valid: true, needsUpgrade: false };
  const hashed = await hashPassword(input);
  if (hashed === stored) return { valid: true, needsUpgrade: false };
  if (input === stored)  return { valid: true, needsUpgrade: true, hash: hashed };
  return { valid: false };
}

// DB row → 앱 내부 포맷 변환
function toApp(row) {
  return {
    id:        row.id,
    name:      row.name,
    count:     row.count,
    request:   row.request || '',
    password:  row.password || '',
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
    .select('*')
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
    .select()
    .single()

  if (error) throw error
  return toApp(data)
}

/** 신청 수정 */
export async function updateApplication(date, id, updatedFields) {
  const { error } = await supabase
    .from('applications')
    .update({
      name:       updatedFields.name,
      count:      Number(updatedFields.count),
      request:    updatedFields.request || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('game_date', date)

  if (error) throw error
}

/** 신청 삭제 */
export async function deleteApplication(date, id) {
  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id)
    .eq('game_date', date)

  if (error) throw error
}

/** 입금 여부 토글 */
export async function updatePaymentStatus(date, id, isPaid) {
  const { error } = await supabase
    .from('applications')
    .update({ is_paid: isPaid, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('game_date', date)

  if (error) throw error
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
    password:         row.password || '',
    createdAt:        row.created_at,
  }
}

export async function getJikgwanList(date) {
  const { data, error } = await supabase
    .from('jikgwan')
    .select('*')
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
    .select()
    .single()
  if (error) throw error
  return toJikgwan(data)
}

export async function updateJikgwan(id, { isTowelFairy, towelMeetingArea, towelInning }) {
  const { error } = await supabase
    .from('jikgwan')
    .update({
      is_towel_fairy: isTowelFairy,
      towel_meeting_area: isTowelFairy ? (towelMeetingArea || null) : null,
      towel_inning: isTowelFairy ? (towelInning || '5회말') : null,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteJikgwan(id) {
  const { error } = await supabase.from('jikgwan').delete().eq('id', id)
  if (error) throw error
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
    password:    row.password,
    eventDate:   row.event_date,
    createdAt:   row.created_at,
  }
}

export async function getJungmoList(date) {
  const { data, error } = await supabase
    .from('jungmo')
    .select('*')
    .eq('event_date', date)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []).map(toJungmo)
}

export async function createJungmo(date, { title, description, password }) {
  const { data, error } = await supabase
    .from('jungmo')
    .insert({ event_date: date, title, description: description || null, password: await hashPassword(password || '') })
    .select()
    .single()
  if (error) throw error
  return toJungmo(data)
}

export async function deleteJungmo(id) {
  const { error } = await supabase.from('jungmo').delete().eq('id', id)
  if (error) throw error
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
    password:  row.password || '',
    isPaid:    row.is_paid || false,
    createdAt: row.created_at,
    updatedAt: row.updated_at || null,
  }
}

export async function getJungmoApplications(jungmoId) {
  const { data, error } = await supabase
    .from('jungmo_applications')
    .select('*')
    .eq('jungmo_id', jungmoId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []).map(toJungmoApp)
}

export async function addJungmoApplication(jungmoId, { nickname, count, note, password }) {
  const { data, error } = await supabase
    .from('jungmo_applications')
    .insert({ jungmo_id: jungmoId, nickname, count: Number(count) || 1, note: note || null, password: await hashPassword(password || '') })
    .select()
    .single()
  if (error) throw error
  return toJungmoApp(data)
}

export async function updateJungmoApplication(id, { nickname, count, note }) {
  const { error } = await supabase
    .from('jungmo_applications')
    .update({ nickname, count: Number(count) || 1, note: note || null })
    .eq('id', id)
  if (error) throw error
}

export async function deleteJungmoApplication(id) {
  const { error } = await supabase.from('jungmo_applications').delete().eq('id', id)
  if (error) throw error
}

export async function updateJungmoPaymentStatus(id, isPaid) {
  const { error } = await supabase
    .from('jungmo_applications')
    .update({ is_paid: isPaid })
    .eq('id', id)
  if (error) throw error
}

export async function getAllJungmoApplicationsWithInfo() {
  const [{ data: apps, error: appError }, { data: jungmos, error: jungmoError }] = await Promise.all([
    supabase.from('jungmo_applications').select('*').order('created_at', { ascending: true }),
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

export async function openDangwanDate(date) {
  const { error } = await supabase
    .from('dangwan_open_dates')
    .upsert({ game_date: date, is_open: true })
  if (error) throw error
}

export async function closeDangwanDate(date) {
  const { error } = await supabase
    .from('dangwan_open_dates')
    .update({ is_open: false })
    .eq('game_date', date)
  if (error) throw error
}

export async function getAllApplications() {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('game_date', { ascending: false })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []).map(row => ({ ...toApp(row), gameDate: row.game_date }))
}

export async function getAllJungmo() {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('jungmo')
    .select('*')
    .gte('event_date', today)
    .order('event_date', { ascending: true })
  if (error) throw error
  return (data || []).map(toJungmo)
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

export async function createNotice(content) {
  const { data, error } = await supabase
    .from('notices')
    .insert({ content })
    .select()
    .single()
  if (error) throw error
  return toNotice(data)
}

export async function updateNotice(id, content) {
  const { error } = await supabase
    .from('notices')
    .update({ content })
    .eq('id', id)
  if (error) throw error
}

export async function toggleNoticeActive(id, isActive) {
  const { error } = await supabase
    .from('notices')
    .update({ is_active: isActive })
    .eq('id', id)
  if (error) throw error
}

export async function deleteNotice(id) {
  const { error } = await supabase.from('notices').delete().eq('id', id)
  if (error) throw error
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

export async function setGameResult(date, result) {
  const { error } = await supabase
    .from('game_results')
    .upsert({ game_date: date, result })
  if (error) throw error
}

export async function deleteGameResult(date) {
  const { error } = await supabase.from('game_results').delete().eq('game_date', date)
  if (error) throw error
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
    password:    row.password,
    isSold:      row.is_sold || false,
    soldTo:      row.sold_to || '',
    createdAt:   row.created_at,
  }
}

function toReservation(row) {
  return {
    id:         row.id,
    transferId: row.transfer_id,
    nickname:   row.nickname,
    password:   row.password,
    createdAt:  row.created_at,
  }
}

export async function getTransfers() {
  const { data, error } = await supabase
    .from('transfers')
    .select('*')
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
    .select()
    .single()
  if (error) throw error
  return toTransfer(data)
}

export async function deleteTransfer(id) {
  const { error } = await supabase.from('transfers').delete().eq('id', id)
  if (error) throw error
}

export async function toggleTransferSold(id, isSold, soldTo) {
  const { error } = await supabase
    .from('transfers')
    .update({ is_sold: isSold, sold_to: isSold ? (soldTo || null) : null })
    .eq('id', id)
  if (error) throw error
}

export async function getTransferReservations(transferId) {
  const { data, error } = await supabase
    .from('transfer_reservations')
    .select('*')
    .eq('transfer_id', transferId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []).map(toReservation)
}

export async function addTransferReservation(transferId, { nickname, password }) {
  const { data, error } = await supabase
    .from('transfer_reservations')
    .insert({ transfer_id: transferId, nickname, password: await hashPassword(password || '') })
    .select()
    .single()
  if (error) throw error
  return toReservation(data)
}

export async function deleteTransferReservation(id) {
  const { error } = await supabase.from('transfer_reservations').delete().eq('id', id)
  if (error) throw error
}

// ── 비밀번호 해시 마이그레이션 (평문 → SHA-256) ────────────────
export async function upgradeApplicationPassword(date, id, hash) {
  await supabase.from('applications').update({ password: hash }).eq('id', id).eq('game_date', date);
}
export async function upgradeJikgwanPassword(id, hash) {
  await supabase.from('jikgwan').update({ password: hash }).eq('id', id);
}
export async function upgradeJungmoPassword(id, hash) {
  await supabase.from('jungmo').update({ password: hash }).eq('id', id);
}
export async function upgradeJungmoApplicationPassword(id, hash) {
  await supabase.from('jungmo_applications').update({ password: hash }).eq('id', id);
}
