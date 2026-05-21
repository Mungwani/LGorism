export function formatDateKo(dateStr) {
  const [, m, d] = dateStr.split('-')
  return `${parseInt(m)}월 ${parseInt(d)}일`
}

export function shareContent({ title, text, url }) {
  const key = import.meta.env.VITE_KAKAO_APP_KEY
  const shareUrl = url || 'https://lgorism.vercel.app'

  const fullText = `${title}\n\n${text}\n\n${shareUrl}`

  if (key && window.Kakao) {
    if (!window.Kakao.isInitialized()) window.Kakao.init(key)
    window.Kakao.Share.sendDefault({
      objectType: 'text',
      text: fullText,
      link: {
        mobileWebUrl: shareUrl,
        webUrl: shareUrl,
      },
      buttonTitle: '바로 가기',
    })
    return
  }

  if (navigator.share) {
    navigator.share({ title, text: fullText }).catch(() => {})
    return
  }

  navigator.clipboard?.writeText(fullText)
    .then(() => alert('링크가 복사됐어요!'))
    .catch(() => alert(shareUrl))
}
