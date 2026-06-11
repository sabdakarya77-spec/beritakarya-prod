/** Metadata & helpers for public legal / policy document pages. */

export const LEGAL_PAGE_EYEBROW = 'Halaman Informasi'
export const LEGAL_DOCUMENT_EYEBROW = 'Dokumen Portal'

export const LEGAL_SLUGS = [
  'about',
  'ethics',
  'editorial',
  'terms',
  'media-siber',
] as const

export type LegalSlug = (typeof LEGAL_SLUGS)[number]

export const LEGAL_SLUG_TITLES: Record<LegalSlug, string> = {
  about: 'Tentang Kami',
  ethics: 'Kode Etik',
  editorial: 'Redaksi',
  terms: 'Ketentuan Penggunaan',
  'media-siber': 'Pedoman Media Siber',
}

export const LEGAL_PAGE_INTROS: Record<LegalSlug, string> = {
  about: 'Mengenal identitas, arah editorial, dan komitmen portal dalam melayani pembaca di wilayah ini.',
  ethics: 'Pedoman etika redaksi dan prinsip kerja jurnalistik yang menjadi dasar setiap proses peliputan.',
  editorial: 'Struktur redaksi, penanggung jawab, dan informasi kelembagaan yang menjadi fondasi operasional portal.',
  terms: 'Ketentuan penggunaan layanan, hak cipta, serta batas tanggung jawab yang berlaku bagi seluruh pengguna.',
  'media-siber':
    'Rujukan pedoman media siber dan praktik publikasi yang mengikuti prinsip tanggung jawab pers.',
}

type SiteSettingsLike = {
  aboutUs?: string | null
  codeOfEthics?: string | null
  editorial?: string | null
  termsOfService?: string | null
  mediaSiber?: string | null
  privacyPolicy?: string | null
}

export type LegalPageConfig = {
  id: string
  slug: string
  title: string
  settingsKey: keyof SiteSettingsLike
  intro: string
  href: (siteId: string) => string
}

export const ALL_LEGAL_PAGES: LegalPageConfig[] = [
  {
    id: 'aboutUs',
    slug: 'about',
    title: 'Tentang Kami',
    settingsKey: 'aboutUs',
    intro: 'Mengenal identitas, arah editorial, dan komitmen portal dalam melayani pembaca di wilayah ini.',
    href: (siteId) => `/${siteId}/p/about`,
  },
  {
    id: 'editorial',
    slug: 'editorial',
    title: 'Redaksi',
    settingsKey: 'editorial',
    intro: 'Struktur redaksi, penanggung jawab, dan informasi kelembagaan yang menjadi fondasi operasional portal.',
    href: (siteId) => `/${siteId}/p/editorial`,
  },
  {
    id: 'codeOfEthics',
    slug: 'ethics',
    title: 'Kode Etik',
    settingsKey: 'codeOfEthics',
    intro: 'Pedoman etika redaksi dan prinsip kerja jurnalistik yang menjadi dasar setiap proses peliputan.',
    href: (siteId) => `/${siteId}/p/ethics`,
  },
  {
    id: 'privacyPolicy',
    slug: 'kebijakan-privasi',
    title: 'Kebijakan Privasi',
    settingsKey: 'privacyPolicy',
    intro: 'Penjelasan mengenai bagaimana portal mengumpulkan, menggunakan, menyimpan, dan melindungi data pengguna serta informasi yang relevan dengan operasional layanan.',
    href: (siteId) => `/${siteId}/kebijakan-privasi`,
  },
  {
    id: 'mediaSiber',
    slug: 'media-siber',
    title: 'Pedoman Media Siber',
    settingsKey: 'mediaSiber',
    intro: 'Rujukan pedoman media siber dan praktik publikasi yang mengikuti prinsip tanggung jawab pers.',
    href: (siteId) => `/${siteId}/p/media-siber`,
  },
  {
    id: 'termsOfService',
    slug: 'terms',
    title: 'Ketentuan Penggunaan',
    settingsKey: 'termsOfService',
    intro: 'Ketentuan penggunaan layanan, hak cipta, serta batas tanggung jawab yang berlaku bagi seluruh pengguna.',
    href: (siteId) => `/${siteId}/p/terms`,
  },
]

export const PRIVACY_PAGE = {
  title: 'Kebijakan Privasi',
  intro:
    'Penjelasan mengenai bagaimana portal mengumpulkan, menggunakan, menyimpan, dan melindungi data pengguna serta informasi yang relevan dengan operasional layanan.',
  settingsKey: 'privacyPolicy' as const,
}

const CONTENT_BY_SLUG: Record<
  LegalSlug,
  { title: string; settingsKey: keyof SiteSettingsLike }
> = {
  about: { title: LEGAL_SLUG_TITLES.about, settingsKey: 'aboutUs' },
  ethics: { title: LEGAL_SLUG_TITLES.ethics, settingsKey: 'codeOfEthics' },
  editorial: { title: LEGAL_SLUG_TITLES.editorial, settingsKey: 'editorial' },
  terms: { title: LEGAL_SLUG_TITLES.terms, settingsKey: 'termsOfService' },
  'media-siber': { title: LEGAL_SLUG_TITLES['media-siber'], settingsKey: 'mediaSiber' },
}

export function isLegalSlug(slug: string): slug is LegalSlug {
  return (LEGAL_SLUGS as readonly string[]).includes(slug)
}

/** Professional fallback content for legal pages (Dewan Pers Indonesia standards) */
const FALLBACK_CONTENT: Record<LegalSlug, string> = {
  about: `<h2>Visi Kami</h2>
<p>Menjadi portal berita independen yang menyajikan informasi akurat, berimbang, dan terpercaya untuk masyarakat Nusantara. Kami berkomitmen menjadi sumber informasi yang dapat dipercaya dalam memberikan pemberitaan yang bertanggung jawab.</p>

<h2>Misi Kami</h2>
<p>1. Menyajikan berita yang akurat dan dapat diverifikasi dari berbagai sumber terpercaya.</p>
<p>2. Memberikan pemberitaan berimbang dengan mewakili berbagai sudut pandang yang relevan.</p>
<p>3. Menjaga independensi редакции dari pengaruh politik dan komersial.</p>
<p>4. Mengutamakan kepentingan publik dalam setiap keputusan editorial.</p>
<p>5. Meningkatkan literasi media dan kemampuan masyarakat dalam menyaring informasi.</p>

<h2>Nilai-Nilai Editorial</h2>
<p>Kami menjunjung tinggi prinsip-prinsip jurnalistik yang bertanggung jawab sesuai dengan Kode Etik Jurnalistik Dewan Pers dan Pedoman Pemberitaan Media Siber. Setiap berita yang kami publikasikan melewati proses verifikasi yang ketat untuk memastikan akurasi dan kebenaran informasi.</p>`,

  editorial: `<h2>Struktur Redaksi</h2>
<p>Portal Berita Karya berkomitmen untuk menjaga transparansi dalam struktur organisasi редакции kami demi membangun kepercayaan publik.</p>

<h3>Penanggung Jawab</h3>
<p>Penanggung jawab memiliki peran dalam memastikan seluruh operasional редакции berjalan sesuai dengan aturan dan regulasi yang berlaku di Indonesia, termasuk mengikuti pedoman dari Dewan Pers.</p>

<h3>Pemimpin Redaksi</h3>
<p>Pemimpin Redaksi bertanggung jawab atas keseluruhan isi pemberitaan, memastikan kualitas, akurasi, dan keberimbangan setiap artikel yang dipublikasikan. Pemimpin Redaksi juga memimpin conferences редакции harian untuk menentukan prioritas liputan.</p>

<h3>Sekretaris Redaksi</h3>
<p>Sekretaris Redaksi mengelola administrasi редакции, mengkoordinasikan jadwal peliputan, dan memastikan kelancaran komunikasi internal serta dengan pihak eksternal.</p>

<h3>Jurnalis dan Reporter</h3>
<p>Tim jurnalis kami terdiri dari profesional berpengalaman yang tersebar di berbagai wilayah untuk memberikan peliputan mendalam tentang peristiwa penting yang mempengaruhi masyarakat.</p>

<h2>Komitmen Profesionalisme</h2>
<p>Seluruh anggota редакции kami berkomitmen untuk mengikuti pelatihan jurnalistik berkelanjutan dan memahami perkembangan terbaru dalam standar pemberitaan yang bertanggung jawab.</p>`,

  ethics: `<h2>Kode Etik Jurnalistik Dewan Pers</h2>
<p>Portal Berita Karya mengadopsi Kode Etik Jurnalistik Dewan Pers sebagai pedoman utama dalam menjalankan tugas jurnalistik. Kode etik ini merupakan komitmen kami untuk menjaga profesionalisme dan tanggung jawab dalam pemberitaan.</p>

<h3>Pasal 1: Wahrheit und Genauigkeit (Kebenaran dan Akurasi)</h3>
<p>Jurnalis Indonesia harus mengutamakan kebenaran dan akurasi dalam setiap pemberitaan. Informasi yang disajikan harus dapat diverifikasi dari sumber-sumber terpercaya dan di.Cross-check dengan minimal dua sumber independen.</p>

<h3>Pasal 2: Unabhängigkeit (Independensi)</h3>
<p>Jurnalis harus menjaga independensi dari objek yang diberitakan. Pemberitaan tidak boleh dipengaruhi oleh kepentingan pribadi, politik, atau komersial. Segala bentuk konflik kepentingan harus diungkapkan secara transparan.</p>

<h3>Pasal 3: Fairness und Ausgewogenheit (Kejujuran dan Keseimbangan)</h3>
<p>Jurnalis harus memberikan kesempatan yang sama untuk memberikan tanggapan kepada pihak-pihak yang的红会受到 pemberitaan kami. Kami memastikan semua pihak terkait memiliki kesempatan untuk membalas atau memberikan klarifikasi.</p>

<h3>Pasal 4: Humanity (Kemanusiaan)</h3>
<p>Jurnalis Indonesia harus menghormati privasi individu dan tidak melakukan intersive-interogasi yang melanggar etika. Pemberitaan tentang korban kejahatan dan tragedi harus dilakukan dengan penuh empati dan hormat.</p>

<h3>Pasal 5: Tanggung Jawab</h3>
<p>Jurnalis Indonesia berani untuk menyampaikan informasi yang benar, penting, dan bermanfaat bagi masyarakat. Kami siap menerima kritik dan koreksi dari publik sebagai bentuk tanggung jawab editorial.</p>

<h2>Sanksi Pelanggaran</h2>
<p>Pelanggaran terhadap Kode Etik Jurnalistik akan ditindaklanjuti melalui mekanisme yang berlaku di редакции, termasuk koreksi publik, minta maaf, atau tindakan disipliner sesuai kebijakan внутренние редакции.</p>`,

  terms: `<h2>Ketentuan Penggunaan Layanan</h2>
<p>Selamat datang di Portal Berita Karya. Dengan mengakses dan menggunakan layanan kami, Anda menyetujui ketentuan penggunaan berikut. Mohon membaca dengan seksama sebelum menggunakan layanan kami.</p>

<h3>1. Penerimaan Ketentuan</h3>
<p>Dengan mengakses atau menggunakan layanan Portal Berita Karya, Anda dianggap telah membaca, memahami, dan menyetujui terikat oleh semua syarat dan ketentuan yang berlaku. Jika Anda tidak setuju dengan ketentuan ini, silakan tidak menggunakan layanan kami.</p>

<h3>2. Deskripsi Layanan</h3>
<p>Portal Berita Karya menyediakan layanan informasi berita dan artikel yang meliputi liputan peristiwa terkini, analisis, dan konten editorial lainnya. Layanan ini bersifat informatif dan tidak dimaksudkan sebagai nasihat profesional.</p>

<h3>3. Hak Cipta dan Hak Kekayaan Intelektual</h3>
<p>Seluruh konten yang dipublikasikan di Portal Berita Karya, termasuk namun tidak terbatas pada teks, gambar, grafik, logo, dan desain, dilindungi oleh hak cipta dan hak kekayaan intelektual yang berlaku. Penggunaan kembali konten memerlukan izin tertulis dari редакции.</p>

<h3>4. Penggunaan yang Dilarang</h3>
<p>Pengguna dilarang menggunakan layanan kami untuk tujuan ilegal, menyebarkan konten yang melanggar hukum, mengganggu ketertiban umum, atau做任何 hal yang dapat merusak reputasi редакции dan pihak lain.</p>

<h3>5. Batasan Tanggung Jawab</h3>
<p>Portal Berita Karya tidak bertanggung jawab atas kerugian langsung maupun tidak langsung yang timbul dari penggunaan layanan ini. Seluruh risiko penggunaan layanan sepenuhnya ditanggung oleh pengguna.</p>

<h3>6. Perubahan Ketentuan</h3>
<p>Portal Berita Karya berhak mengubah ketentuan penggunaan sewaktu-waktu tanpa pemberitahuan terlebih dahulu. Perubahan akan berlaku sejak tanggal publikasi di situs ini.</p>

<h3>7. Hukum yang Berlaku</h3>
<p>Ketentuan penggunaan ini diatur oleh dan ditafsirkan sesuai dengan hukum Negara Republik Indonesia.</p>`,

  'media-siber': `<h2>Pedoman Media Siber - Keputusan Dewan Pers</h2>
<p>Portal Berita Karya berkomitmen untuk mengikuti Pedoman Pemberitaan Media Siber sesuai dengan Keputusan Dewan Pers Nomor: 03/DP-Kode Etik Jurnalistik/KEJ/2014 tentang Pedoman Pemberitaan Media Siber.</p>

<h3>Prinsip Umum Pemberitaan Media Siber</h3>
<p>1. Setiap berita harus memenuhi standar verifikasi dan cross-check sebelum dipublikasikan.</p>
<p>2. Redaksi harus menjaga independensi editorial dari tekanan pihak manapun.</p>
<p>3. Pemberitaan harus berimbang dan memberikan kesempatan kepada semua pihak yang terkait untuk membalas.</p>
<p>4. Privasi individu harus dihormati kecuali jika informasi tersebut menjadi berita yang legítima.</p>
<p>5. Tidak boleh memuat konten yang melanggar kesusilaan, SARA, atau memicu konflik.</p>

<h3>Hal-Hal yang Harus Dihindari</h3>
<p>1. Tidak memuat berita bohong (hoax) atau informasi yang tidak dapat diverifikasi kebenarannya.</p>
<p>2. Tidak memuat konten yang dapat mengganggu stabilitas sosial, politik, dan ekonomi.</p>
<p>3. Tidak memuat konten yang bersifat pornografi, kekerasan, atau diskriminasi.</p>
<p>4. Tidak melakukan plagiarisme atau pengambilan konten tanpa izin dari sumber asli.</p>
<p>5. Tidak memuat konten yang melanggar hak cipta atau hak kekayaan intelektual pihak lain.</p>

<h3>Koreksi dan Hak Jawab</h3>
<p>Portal Berita Karya menyediakan mekanisme koreksi untuk setiap kesalahan faktual yang ditemukan. Pihak-pihak yang merasa dirugikan oleh pemberitaan kami memiliki hak untuk memberikan tanggapan atau hak jawab sesuai ketentuan yang berlaku.</p>

<h3>Penerapan dan Pengawasan</h3>
<p>Pedoman ini diterapkan secara internal di редакции Portal Berita Karya. Kami secara berkala mengevaluasi kepatuhan terhadap pedoman ini dan menerima masukan dari publik untuk meningkatkan kualitas pemberitaan kami.</p>`
}

export function resolveLegalPage(
  slug: LegalSlug,
  siteSettings: SiteSettingsLike | null | undefined
): { title: string; content: string | null | undefined; intro: string } {
  const meta = CONTENT_BY_SLUG[slug]
  const content = siteSettings?.[meta.settingsKey] ?? null

  return {
    title: meta.title,
    content: content || FALLBACK_CONTENT[slug] || null,
    intro: LEGAL_PAGE_INTROS[slug],
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value)
}

/** Normalize CMS HTML or plain text into safe HTML for legal document bodies. */
export function formatLegalRichContent(value: string | null | undefined) {
  if (!value) return ''
  if (looksLikeHtml(value)) return value

  return value
    .trim()
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

function normalizeComparableText(value: string) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

const LEADING_BLOCK_RE =
  /^\s*<(h[1-3]|p|div)(?:\s[^>]*)?>([\s\S]*?)<\/\1>\s*/i

/**
 * Remove only the leading heading when it repeats the page H1 exactly.
 * Paragraphs/divs are kept because they are considered authored content.
 */
export function prepareLegalDocumentContent(
  value: string | null | undefined,
  options?: { pageTitle?: string; intro?: string }
) {
  let html = formatLegalRichContent(value)
  if (!html || !options?.pageTitle) return html

  const titleNorm = normalizeComparableText(options.pageTitle)
  let guard = 0
  while (guard < 8) {
    guard += 1
    const match = html.match(LEADING_BLOCK_RE)
    if (!match) break

    const tagName = match[1].toLowerCase()
    const inner = match[2]
    const innerNorm = normalizeComparableText(inner)

    const duplicatesTitle = /^h[1-3]$/.test(tagName) && innerNorm === titleNorm

    if (!duplicatesTitle) break

    html = html.slice(match[0].length).trim()
  }

  return html
}
