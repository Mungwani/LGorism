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
