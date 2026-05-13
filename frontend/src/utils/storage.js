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

// DB row → 앱 내부 포맷 변환
function toApp(row) {
  return {
    id:        row.id,
    name:      row.name,
    count:     row.count,
    request:   row.request || '',
    password:  row.password || '',
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
      password:  application.password || '',
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
    id:           row.id,
    nickname:     row.nickname,
    section:      row.section || '',
    isTowelFairy: row.is_towel_fairy || false,
    password:     row.password || '',
    createdAt:    row.created_at,
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

export async function addJikgwan(date, { nickname, section, isTowelFairy, password }) {
  const { data, error } = await supabase
    .from('jikgwan')
    .insert({ game_date: date, nickname, section: section || null, is_towel_fairy: isTowelFairy, password: password || '' })
    .select()
    .single()
  if (error) throw error
  return toJikgwan(data)
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
    .insert({ event_date: date, title, description: description || null, password })
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
    note:      row.note || '',
    createdAt: row.created_at,
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

export async function addJungmoApplication(jungmoId, { nickname, note }) {
  const { data, error } = await supabase
    .from('jungmo_applications')
    .insert({ jungmo_id: jungmoId, nickname, note: note || null })
    .select()
    .single()
  if (error) throw error
  return toJungmoApp(data)
}

export async function deleteJungmoApplication(id) {
  const { error } = await supabase.from('jungmo_applications').delete().eq('id', id)
  if (error) throw error
}
