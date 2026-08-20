/** Metadata & helpers for public legal / policy document pages. */

export const LEGAL_PAGE_EYEBROW = 'Halaman Informasi'
export const LEGAL_DOCUMENT_EYEBROW = 'Dokumen Portal'

export const LEGAL_SLUGS = [
  'about',
  'ethics',
  'editorial',
  'terms',
  'media-siber',
  'cookies',
] as const

export type LegalSlug = (typeof LEGAL_SLUGS)[number]

export const LEGAL_SLUG_TITLES: Record<LegalSlug, string> = {
  about: 'Tentang Kami',
  ethics: 'Kode Etik',
  editorial: 'Redaksi',
  terms: 'Ketentuan Penggunaan',
  'media-siber': 'Pedoman Media Siber',
  cookies: 'Kebijakan Cookie',
}

export const LEGAL_PAGE_INTROS: Record<LegalSlug, string> = {
  about: 'Mengenal identitas, arah editorial, dan komitmen portal dalam melayani pembaca di wilayah ini.',
  ethics: 'Pedoman etika redaksi dan prinsip kerja jurnalistik yang menjadi dasar setiap proses peliputan.',
  editorial: 'Struktur redaksi, penanggung jawab, dan informasi kelembagaan yang menjadi fondasi operasional portal.',
  terms: 'Ketentuan penggunaan layanan, hak cipta, serta batas tanggung jawab yang berlaku bagi seluruh pengguna.',
  'media-siber':
    'Rujukan pedoman media siber dan praktik publikasi yang mengikuti prinsip tanggung jawab pers.',
  cookies: 'Penjelasan mengenai penggunaan cookie dan teknologi serupa pada layanan portal kami.',
}

type SiteSettingsLike = {
  aboutUs?: string | null
  codeOfEthics?: string | null
  editorial?: string | null
  termsOfService?: string | null
  mediaSiber?: string | null
  privacyPolicy?: string | null
  cookiePolicy?: string | null
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
  {
    id: 'cookiePolicy',
    slug: 'cookies',
    title: 'Kebijakan Cookie',
    settingsKey: 'cookiePolicy' as keyof SiteSettingsLike,
    intro: 'Penjelasan mengenai penggunaan cookie dan teknologi serupa pada layanan portal kami.',
    href: (siteId) => `/${siteId}/cookies`,
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
  cookies: { title: LEGAL_SLUG_TITLES.cookies, settingsKey: 'cookiePolicy' },
}

export function isLegalSlug(slug: string): slug is LegalSlug {
  return (LEGAL_SLUGS as readonly string[]).includes(slug)
}

/** Professional fallback content for legal pages (Dewan Pers Indonesia standards) */
const FALLBACK_CONTENT: Record<LegalSlug, string> = {
  about: `<h2>Visi Kami</h2>
<p>Menjadi portal berita independen, terdepan, dan tepercaya yang menyajikan informasi akurat, berimbang, dan berintegritas untuk seluruh masyarakat di berbagai penjuru daerah. Kami berkomitmen menjadi pilar informasi publik yang menjunjung tinggi kebenaran dan etika jurnalistik.</p>

<h2>Misi Kami</h2>
<p>1. Menyajikan karya jurnalistik yang terverifikasi, faktual, dan mendalam dari sumber-sumber yang kredibel.</p>
<p>2. Menegakkan prinsip keberimbangan dengan mewakili seluruh sudut pandang publik yang relevan secara adil.</p>
<p>3. Menjaga independensi ruang redaksi dari segala bentuk intervensi politik, kekuasaan, maupun kepentingan komersial.</p>
<p>4. Mengutamakan kepentingan publik, keadilan sosial, dan supremasi hukum dalam setiap pemberitaan.</p>
<p>5. Mendorong literasi informasi masyarakat guna menangkal penyebaran disinformasi dan berita bohong (hoaks).</p>

<h2>Nilai & Standar Editorial</h2>
<p>BeritaKarya beroperasi di bawah payung Undang-Undang Republik Indonesia Nomor 40 Tahun 1999 tentang Pers. Setiap produk jurnalistik yang diterbitkan melalui proses verifikasi, penyuntingan berlapis, dan mematuhi Kode Etik Jurnalistik (KEJ) serta Pedoman Pemberitaan Media Siber (PPMS) yang ditetapkan oleh Dewan Pers.</p>`,

  editorial: `<h2>Susunan Redaksi & Tata Kelola</h2>
<p>Sebagai wujud transparansi dan akuntabilitas pers nasional sesuai amanat Undang-Undang Pers No. 40 Tahun 1999 dan Pedoman Dewan Pers, berikut adalah struktur organisasi dan manajemen redaksi BeritaKarya:</p>

<h3>Penerbit / Badan Hukum</h3>
<p>PT Sabda Karya Media</p>

<h3>Penanggung Jawab & Pemimpin Redaksi</h3>
<p>Bertanggung jawab penuh atas keseluruhan isi pemberitaan, kebijakan redaksional, penegakan Kode Etik Jurnalistik, dan kepatuhan terhadap regulasi pers yang berlaku di Indonesia.</p>

<h3>Redaktur Pelaksana & Editor Senior</h3>
<p>Mengkoordinasikan perencanaan liputan harian, memimpin rapat proyeksi redaksi, mengarahkan liputan investigasi mendalam, serta memastikan standar verifikasi dan akurasi naskah sebelum dipublikasikan.</p>

<h3>Sekretariat Redaksi & Manajemen Berita</h3>
<p>Mengelola alur kerja administratif keredaksian, dokumentasi penerbitan, komunikasi kelembagaan, serta layanan permohonan hak jawab dan koreksi pemberitaan dari masyarakat.</p>

<h3>Wartawan & Koresponden Daerah</h3>
<p>Tim jurnalis profesional yang bertugas melakukan peliputan langsung di lapangan di berbagai wilayah daerah, memegang teguh kartu identitas pers resmi, dan dilarang menerima imbalan dalam bentuk apapun terkait tugas jurnalistik.</p>

<h3>Divisi Teknologi, Desain & Multimedia</h3>
<p>Mengembangkan infrastruktur portal siber, menyajikan visualisasi data, infografis, dan tata letak multimedia demi kenyamanan dan kecepatan akses pembaca.</p>

<h3>Kantor Redaksi Pusat & Layanan Pengaduan</h3>
<p>Jl. Semeru No.54, Wonotakan, Kec. Berbek, Kabupaten Nganjuk, Jawa Timur</p>
<p>Telepon / Hotline Redaksi: +628159921922 | Email: supportberitakarya@gmail.com</p>

<h2>Pedoman Kerja & Integritas Wartawan</h2>
<p>Dalam menjalankan tugas jurnalistik, seluruh jurnalis BeritaKarya dibekali identitas pers resmi, tercatat dalam basis data redaksi, serta dilarang meminta atau menerima suap, fasilitas, maupun gratifikasi dari narasumber atau pihak manapun.</p>`,

  ethics: `<h2>Kode Etik Jurnalistik (KEJ)</h2>
<p>BeritaKarya mengadopsi dan tunduk sepenuhnya pada Kode Etik Jurnalistik yang ditetapkan oleh Dewan Pers sesuai Keputusan Dewan Pers Nomor 03/SK-DP/III/2006:</p>

<h3>Pasal 1: Independensi dan Akurasi</h3>
<p>Wartawan Indonesia bersikap independen, menghasilkan berita yang akurat, berimbang, dan tidak beriktikad buruk.</p>

<h3>Pasal 2: Profesionalisme dan Integritas</h3>
<p>Wartawan Indonesia menempuh cara-cara yang profesional dalam melaksanakan tugas jurnalistik.</p>

<h3>Pasal 3: Uji Informasi dan Asas Praduga Tak Bersalah</h3>
<p>Wartawan Indonesia selalu menguji informasi, memberitakan secara berimbang, tidak mencampurkan fakta dan opini yang menghakimi, serta menerapkan asas praduga tak bersalah.</p>

<h3>Pasal 4: Perlindungan Terhadap Korban dan Privasi</h3>
<p>Wartawan Indonesia tidak membuat berita bohong, fitnah, sadis, dan cabul, serta menghormati hak privasi narasumber kecuali berkaitan langsung dengan kepentingan publik.</p>

<h3>Pasal 5: Perlindungan Anak dan Korban Kejahatan Susila</h3>
<p>Wartawan Indonesia tidak menyebutkan dan menyiarkan identitas korban kejahatan susila dan tidak menyebutkan identitas anak yang menjadi pelaku kejahatan.</p>

<h3>Pasal 6: Larangan Penyalahgunaan Profesi dan Suap</h3>
<p>Wartawan Indonesia tidak menyalahgunakan profesi dan tidak menerima suap atau imbalan dalam bentuk apapun yang dapat mempengaruhi independensi pemberitaan.</p>

<h3>Pasal 7: Hak Tolak dan Narasumber Terpercaya</h3>
<p>Wartawan Indonesia memiliki Hak Tolak untuk melindungi narasumber yang tidak bersedia diketahui identitas maupun keberadaannya, menghargai ketentuan embargo, informasi latar belakang, dan <em>off the record</em>.</p>

<h3>Pasal 8: Larangan Diskriminasi SARA</h3>
<p>Wartawan Indonesia tidak menulis atau menyiarkan berita berdasarkan prasangka atau diskriminasi terhadap seseorang atas dasar perbedaan suku, ras, warna kulit, agama, jenis kelamin, dan bahasa serta tidak merendahkan martabat orang lemah, miskin, sakit, cacat jiwa atau cacat jasmani.</p>

<h3>Pasal 9: Hak Narasumber atas Kehidupan Pribadi</h3>
<p>Wartawan Indonesia menghormati hak narasumber tentang kehidupan pribadinya, kecuali untuk kepentingan publik.</p>

<h3>Pasal 10: Pencabutan dan Ralat Berita</h3>
<p>Wartawan Indonesia segera mencabut, meralat, dan memperbaiki berita yang keliru dan tidak akurat disertai dengan permintaan maaf kepada pembaca, pendengar, dan atau pemirsa.</p>

<h3>Pasal 11: Hak Jawab dan Hak Koreksi</h3>
<p>Wartawan Indonesia melayani Hak Jawab dan Hak Koreksi secara proporsional sesuai ketentuan Undang-Undang Pers.</p>

<h2>Penegakan Disiplin & Pelanggaran Etika</h2>
<p>Setiap dugaan pelanggaran terhadap Kode Etik Jurnalistik akan diproses melalui sidang etik internal redaksi dan mekanisme penyelesaian sengketa pers di Dewan Pers.</p>`,

  terms: `<h2>Ketentuan Penggunaan Layanan (Terms of Service)</h2>
<p>Selamat datang di portal BeritaKarya. Dengan mengakses dan menggunakan layanan kami, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh ketentuan penggunaan berikut:</p>

<h3>1. Penerimaan Ketentuan</h3>
<p>Akses dan pemanfaatan seluruh konten di situs BeritaKarya tunduk pada syarat dan ketentuan ini serta peraturan perundang-undangan Republik Indonesia yang berlaku. Apabila Anda tidak menyetujui ketentuan ini, kami sarankan untuk tidak menggunakan layanan portal kami.</p>

<h3>2. Hak Cipta & Penggunaan Konten</h3>
<p>Seluruh materi publikasi di portal BeritaKarya, termasuk naskah artikel, foto jurnalistik, video, grafis, logo, dan tata letak, dilindungi oleh Undang-Undang Hak Cipta. Pengutipan berita diperbolehkan dengan mencantumkan kredit sumber secara jelas (nama media dan tautan aktif ke artikel rujukan). Penggandaan massal atau komersialisasi konten tanpa izin tertulis dari redaksi BeritaKarya dilarang keras.</p>

<h3>3. Batasan Tanggung Jawab</h3>
<p>BeritaKarya berupaya menyajikan informasi yang akurat dan terkini. Namun, kami tidak bertanggung jawab atas segala kerugian materiil maupun immateriil yang timbul akibat pemanfaatan informasi dari situs ini atau tautan pihak ketiga yang berada di luar kendali kami.</p>

<h3>4. Panduan Komentar Pengguna</h3>
<p>Pengguna yang memanfaatkan fitur komentar atau interaksi publik dilarang memuat konten yang mengandung ujaran kebencian, fitnah, pornografi, diskriminasi SARA, maupun materi yang melanggar hukum. Redaksi berhak memoderasi, menyunting, atau menghapus komentar yang melanggar ketentuan tersebut.</p>

<h3>5. Perubahan Ketentuan</h3>
<p>Redaksi BeritaKarya berhak memperbarui ketentuan penggunaan ini sewaktu-waktu. Perubahan mulai berlaku sejak tanggal naskah pembaruan diterbitkan pada halaman ini.</p>

<h3>6. Hukum yang Mengatur</h3>
<p>Ketentuan penggunaan ini diatur dan ditafsirkan berdasarkan hukum Negara Kesatuan Republik Indonesia. Setiap sengketa yang timbul akan diselesaikan secara musyawarah atau melalui forum penyelesaian sengketa yang berwenang di Indonesia.</p>`,

  'media-siber': `<h2>Pedoman Pemberitaan Media Siber (PPMS)</h2>
<p>Kemerdekaan berpendapat, kemerdekaan berekspresi, dan kemerdekaan pers adalah hak asasi manusia yang dilindungi Pancasila, Undang-Undang Dasar 1945, dan Deklarasi Universal Hak Asasi Manusia PBB. BeritaKarya mematuhi Pedoman Pemberitaan Media Siber yang ditetapkan oleh Dewan Pers:</p>

<h3>1. Ruang Lingkup</h3>
<p>Media Siber adalah segala bentuk media yang menggunakan wahana internet dan melaksanakan kegiatan jurnalistik, serta memenuhi persyaratan Undang-Undang Pers dan Standar Perusahaan Pers yang ditetapkan Dewan Pers.</p>

<h3>2. Verifikasi dan Keberimbangan Berita</h3>
<p>a. Pada prinsipnya setiap berita harus melalui verifikasi fakta dari berbagai sumber yang relevan.</p>
<p>b. Berita yang dapat merugikan pihak lain memerlukan verifikasi pada berita yang sama untuk memenuhi prinsip akurasi dan keberimbangan.</p>
<p>c. Setiap berita harus mencantumkan keterangan waktu publikasi dan pembaruan secara transparan.</p>

<h3>3. Konten Buatan Pengguna (User Generated Content)</h3>
<p>Media siber wajib mencantumkan syarat dan ketentuan mengenai Konten Buatan Pengguna yang tidak bertentangan dengan Undang-Undang No. 40 Tahun 1999 tentang Pers dan Kode Etik Jurnalistik. Redaksi memiliki kewajiban untuk melakukan moderasi terhadap konten interaktif pengguna.</p>

<h3>4. Ralat, Koreksi, dan Hak Jawab</h3>
<p>a. Ralat, koreksi, dan hak jawab mengacu pada Undang-Undang Pers, Kode Etik Jurnalistik, dan Pedoman Hak Jawab yang ditetapkan Dewan Pers.</p>
<p>b. Ralat, koreksi, dan hak jawab wajib ditautkan pada berita yang diralat, dikoreksi, atau diberi hak jawab.</p>
<p>c. Pada setiap berita yang diralat, dikoreksi, atau diberi hak jawab wajib dicantumkan waktu pemuatan ralat, koreksi, atau hak jawab tersebut.</p>

<h3>5. Pencabutan Berita</h3>
<p>Berita yang sudah dipublikasikan tidak dapat dicabut karena alasan penyensoran dari pihak luar redaksi, kecuali terkait masalah SARA, kesusilaan, masa depan anak, pengalaman traumatik korban, atau pertimbangan khusus lain yang ditetapkan Dewan Pers.</p>

<h3>6. Praktik Iklan & Editorial</h3>
<p>Media siber wajib membedakan dengan tegas antara produk jurnalistik dan iklan. Setiap berita/artikel/isi yang merupakan iklan dan atau konten berbayar wajib mencantumkan keterangan 'iklan', 'advertorial', atau 'sponsor'.</p>`,

  cookies: `<h2>Kebijakan Cookie & Teknologi Pelacak</h2>
<p>Kebijakan Cookie ini menjelaskan bagaimana portal BeritaKarya menggunakan cookie dan teknologi serupa untuk mengenali Anda saat mengunjungi situs web kami. Kebijakan ini menjelaskan apa itu teknologi tersebut, mengapa kami menggunakannya, serta hak Anda untuk mengontrol penggunaannya.</p>

<h2>Apa Itu Cookie?</h2>
<p>Cookie adalah file data teks kecil yang disimpan di perangkat peramban (browser) Anda saat mengunjungi sebuah situs web. Cookie digunakan secara luas oleh pemilik situs web untuk membuat situs berfungsi secara efisien, mengingat preferensi pengguna, dan menyediakan informasi analitik.</p>

<h2>Jenis Cookie yang Kami Gunakan</h2>
<h3>1. Cookie Esensial & Keamanan</h3>
<p>Cookie ini sangat penting untuk pengoperasian dasar situs web, seperti autentikasi sesi login, pencegahan penipuan, dan keamanan transfer data.</p>

<h3>2. Cookie Preferensi & Fungsional</h3>
<p>Cookie ini memungkinkan situs mengingat pengaturan yang Anda pilih (misalnya pilihan tema gelap/terang atau wilayah daerah berita pilihan) guna memberikan pengalaman yang lebih personal.</p>

<h3>3. Cookie Analitik & Performa</h3>
<p>Cookie ini membantu kami memahami bagaimana pengunjung berinteraksi dengan situs web dengan mengumpulkan data statistik anonim (seperti jumlah pembaca artikel dan waktu muat halaman) untuk meningkatkan kualitas layanan.</p>

<h3>4. Cookie Periklanan</h3>
<p>Cookie ini digunakan oleh mitra periklanan tepercaya (seperti Google AdSense) untuk menyajikan iklan yang relevan serta membatasi frekuensi penayangan iklan yang sama kepada pengguna.</p>

<h2>Pengaturan & Pengelolaan Cookie</h2>
<p>Anda berhak untuk menerima atau menolak cookie melalui pengaturan pada peramban web Anda. Sebagian besar peramban secara otomatis menerima cookie, namun Anda dapat memodifikasi pengaturan peramban untuk menolak cookie jika diinginkan. Harap diperhatikan bahwa menonaktifkan cookie tertentu dapat mempengaruhi fungsi beberapa fitur di portal kami.</p>

<h2>Pembaruan Kebijakan</h2>
<p>Kami dapat memperbarui Kebijakan Cookie ini dari waktu ke waktu untuk menyesuaikan dengan perubahan operasional, hukum, atau regulasi yang berlaku. Tanggal pembaruan terkini akan selalu tertera di bagian atas halaman ini.</p>

<h2>Kontak & Layanan Pembaca</h2>
<p>Jika Anda memiliki pertanyaan mengenai penggunaan cookie atau kebijakan privasi di BeritaKarya, silakan hubungi tim kami melalui formulir kontak atau email resmi redaksi di <strong>supportberitakarya@gmail.com</strong>.</p>`
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
