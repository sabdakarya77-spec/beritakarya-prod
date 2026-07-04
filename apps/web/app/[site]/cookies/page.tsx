import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LegalStandardPage } from '../../../components/legal'
import { buildPublicSiteConfig, fetchSiteSettings } from '../../../lib/siteSettings'
import { constructMetadata } from '../../../lib/metadata'

export const dynamic = 'force-dynamic'

const COOKIES_PAGE = {
  title: 'Kebijakan Cookie',
  intro: 'Penjelasan mengenai penggunaan cookie dan teknologi serupa pada layanan portal kami.',
}

export async function generateMetadata({
  params,
}: {
  params: { site: string }
}): Promise<Metadata> {
  const resolvedParams = await params
  const siteParam = resolvedParams.site
  const siteSettings = await fetchSiteSettings(siteParam)
  const siteName = siteSettings?.name || siteParam.charAt(0).toUpperCase() + siteParam.slice(1)
  const faviconUrl = siteSettings?.faviconUrl || '/favicon.ico'
  const ogImageUrl = siteSettings?.ogImageUrl || '/logo.png'

  return constructMetadata({
    title: `${COOKIES_PAGE.title} - ${siteName}`,
    image: ogImageUrl,
    icons: faviconUrl,
    siteParam,
  })
}

const FALLBACK_CONTENT = `<h2>Apa Itu Cookie?</h2>
<p>Cookie adalah file teks kecil yang disimpan di perangkat Anda ketika mengunjungi situs web. Cookie membantu situs web mengingat informasi tentang kunjungan Anda, seperti bahasa pilihan dan pengaturan lainnya, sehingga kunjungan berikutnya menjadi lebih mudah dan pengalaman menggunakan layanan kami lebih bermanfaat.</p>

<h2>Cookie yang Kami Gunakan</h2>
<h3>Cookie Esensial</h3>
<p>Cookie ini diperlukan agar situs web dapat berfungsi dengan baik. Tanpa cookie ini, layanan yang Anda minta tidak dapat disediakan, termasuk autentikasi sesi dan keamanan.</p>

<h3>Cookie Fungsional</h3>
<p>Cookie ini memungkinkan situs web mengingat pilihan yang Anda buat (seperti tema gelap/terang) dan menyediakan fitur yang lebih personal.</p>

<h3>Cookie Analitik</h3>
<p>Cookie ini membantu kami memahami bagaimana pengunjung berinteraksi dengan situs web kami dengan mengumpulkan dan melaporkan informasi secara anonim. Kami menggunakan data ini untuk meningkatkan kualitas layanan.</p>

<h3>Cookie Periklanan</h3>
<p>Cookie ini digunakan untuk menampilkan iklan yang relevan bagi Anda. Cookie ini juga digunakan untuk membatasi jumlah tampilan iklan dan mengukur efektivitas kampanye iklan.</p>

<h2>Pihak Ketiga</h2>
<p>Kami dapat menggunakan layanan pihak ketiga yang juga menetapkan cookie di perangkat Anda, termasuk namun tidak terbatas pada:</p>
<ul>
  <li>Google Analytics untuk analitik situs</li>
  <li>Google AdSense untuk periklanan</li>
  <li>Platform media sosial untuk fitur berbagi</li>
</ul>

<h2>Mengelola Cookie</h2>
<p>Anda dapat mengatur browser untuk menolak semua cookie atau memberi tahu saat cookie dikirimkan. Namun, beberapa fitur layanan kami mungkin tidak berfungsi dengan baik tanpa cookie.</p>

<p>Sebagian besar browser web secara otomatis menerima cookie, tetapi Anda biasanya dapat mengubah pengaturan browser untuk menolak cookie jika Anda lebih suka. Silakan merujuk pada dokumentasi browser Anda untuk informasi lebih lanjut tentang cara mengelola preferensi cookie.</p>

<h2>Perubahan Kebijakan</h2>
<p>Kami dapat memperbarui kebijakan cookie ini dari waktu ke waktu. Perubahan akan dipublikasikan di halaman ini dengan tanggal pembaruan terakhir.</p>

<h2>Kontak</h2>
<p>Jika Anda memiliki pertanyaan tentang penggunaan cookie kami, silakan hubungi kami melalui email redaksi yang tercantum di halaman kontak portal.</p>`

export default async function CookiesPage({ params }: { params: { site: string } }) {
  const resolvedParams = await params
  const siteParam = resolvedParams.site
  const siteSettings = await fetchSiteSettings(siteParam)

  if (!siteSettings && siteParam !== 'pusat') {
    notFound()
  }

  const siteConfig = buildPublicSiteConfig(siteParam, siteSettings)

  return (
    <LegalStandardPage
      siteConfig={siteConfig}
      title={COOKIES_PAGE.title}
      intro={COOKIES_PAGE.intro}
      content={(siteSettings as Record<string, unknown>)?.cookiePolicy as string | null | undefined || FALLBACK_CONTENT}
      emptyMessage={`Konten kebijakan cookie belum tersedia. Silakan hubungi redaksi ${siteConfig.name} untuk informasi lebih lanjut.`}
    />
  )
}
