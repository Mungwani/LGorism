export function formatDateKo(dateStr) {
  const [, m, d] = dateStr.split('-')
  return `${parseInt(m)}월 ${parseInt(d)}일`
}

export function shareContent({ title, text, url }) {
  const shareUrl = url || 'https://lgorism.vercel.app'

  if (navigator.share) {
    navigator.share({
      title,
      text,
      url: shareUrl,
    }).catch(() => {})
    return
  }

  navigator.clipboard?.writeText(`${title}\n\n${text}\n${shareUrl}`)
    .then(() => alert('링크가 복사됐어요!'))
    .catch(() => alert(shareUrl))
}
