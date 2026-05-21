export function formatDateKo(dateStr) {
  const [, m, d] = dateStr.split('-')
  return `${parseInt(m)}월 ${parseInt(d)}일`
}

export function shareContent({ title, text, url }) {
  const key = import.meta.env.VITE_KAKAO_APP_KEY
  const shareUrl = url || 'https://lgorism.vercel.app'

  if (key && window.Kakao) {
    if (!window.Kakao.isInitialized()) window.Kakao.init(key)
    window.Kakao.Share.sendDefault({
      objectType: 'text',
      text: `${title}\n\n${text}`,
      link: {
        mobileWebUrl: shareUrl,
        webUrl: shareUrl,
      },
      buttonTitle: '바로 가기',
    })
    return
  }

  // 카카오 SDK 없을 때 Web Share API 폴백
  if (navigator.share) {
    navigator.share({ title, text, url: shareUrl }).catch(() => {})
    return
  }

  navigator.clipboard?.writeText(`${title}\n\n${text}\n${shareUrl}`)
    .then(() => alert('링크가 복사됐어요!'))
    .catch(() => alert(shareUrl))
}
