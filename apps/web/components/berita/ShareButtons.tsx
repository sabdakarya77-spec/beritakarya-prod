'use client'

import { useEffect, useState } from 'react'

export function ShareButtons({ title }: { title: string }) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    setUrl(window.location.href)
  }, [])

  const handleShare = (platform: string) => {
    const text = encodeURIComponent(title)
    const link = encodeURIComponent(url)
    
    let shareUrl = ''
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${text}%20${link}`
        break
      case 'x':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${link}`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${link}`
        break
      case 'copy':
        navigator.clipboard.writeText(url)
        alert('Tautan berhasil disalin!')
        return
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400')
    }
  }

  return (
    <div className="flex flex-col md:fixed md:left-8 md:top-1/3 z-40 gap-4 my-8 md:my-0">
      <div className="md:hidden text-xs font-bold uppercase tracking-widest text-brand-text-muted mb-2">Bagikan</div>
      
      <div className="flex flex-row md:flex-col gap-3">
        {/* WhatsApp */}
        <button 
          onClick={() => handleShare('whatsapp')}
          className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.05] text-gray-600 dark:text-gray-300 hover:bg-green-500 hover:text-white hover:border-green-500 flex items-center justify-center transition-all shadow-sm"
          title="Bagikan ke WhatsApp"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
        </button>

        {/* X / Twitter */}
        <button 
          onClick={() => handleShare('x')}
          className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.05] text-gray-600 dark:text-gray-300 hover:bg-black hover:text-white hover:border-black flex items-center justify-center transition-all shadow-sm"
          title="Bagikan ke X"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </button>

        {/* Facebook */}
        <button 
          onClick={() => handleShare('facebook')}
          className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.05] text-gray-600 dark:text-gray-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 flex items-center justify-center transition-all shadow-sm"
          title="Bagikan ke Facebook"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
        </button>

        {/* Copy Link */}
        <button 
          onClick={() => handleShare('copy')}
          className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.05] text-gray-600 dark:text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-800 flex items-center justify-center transition-all shadow-sm"
          title="Salin Tautan"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
        </button>
      </div>
    </div>
  )
}
