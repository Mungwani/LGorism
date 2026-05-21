export function shareContent({ title, text }) {
  const key = import.meta.env.VITE_KAKAO_APP_KEY
  const fullText = `${title}\n\n${text}`

  if (key && window.Kakao) {
    if (!window.Kakao.isInitialized()) window.Kakao.init(key)
    window.Kakao.Share.sendDefault({
      objectType: 'text',
      text: fullText,
      link: {
        mobileWebUrl: 'https://lgorism.vercel.app',
        webUrl: 'https://lgorism.vercel.app',
      },
      buttonTitle: '엘고리즘 바로가기',
    })
    return
  }

  if (navigator.share) {
    navigator.share({ title, text: fullText + '\nhttps://lgorism.vercel.app' }).catch(() => {})
    return
  }

  const copyText = `${fullText}\nhttps://lgorism.vercel.app`
  navigator.clipboard?.writeText(copyText)
    .then(() => alert('링크가 복사됐어요!'))
    .catch(() => alert('lgorism.vercel.app'))
}