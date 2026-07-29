const CANCEL_HOUR = 17 // 경기 당일 이 시각까지 양도완료 처리 안 되면 취소로 간주

export function isTransferExpired(transfer) {
  if (transfer.isSold) return false
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  if (transfer.gameDate < today) return true
  if (transfer.gameDate === today) return now.getHours() >= CANCEL_HOUR
  return false
}
