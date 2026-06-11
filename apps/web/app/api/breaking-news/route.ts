import { NextResponse } from 'next/server';

export const revalidate = 300; // Cache API Route selama 5 menit

const FEEDS = [
  'https://www.antaranews.com/rss/terkini.xml',
  'https://www.republika.co.id/rss'
];

const FALLBACK_NEWS = [
  "Sri Mulyani Paparkan Strategi Fiskal 2026 di Hadapan DPR",
  "Rupiah Menguat ke Level Rp 15.200 per Dolar AS Pagi Ini",
  "Timnas Indonesia Siap Hadapi Laga Krusial di Kualifikasi Piala Dunia",
  "Pemerintah Resmi Luncurkan Program Insentif Kendaraan Listrik Tahap II"
];

export async function GET() {
  let xmlText = '';
  let success = false;

  // Mencoba mem-fetch feed secara bergantian (fallback jika salah satu server down)
  for (const url of FEEDS) {
    try {
      const res = await fetch(url, {
        next: { revalidate: 300 }, // Menyimpan response selama 5 menit
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: AbortSignal.timeout(4000) // Timeout request dalam 4 detik
      });

      if (res.ok) {
        xmlText = await res.text();
        if (xmlText.includes('<item>')) {
          success = true;
          break;
        }
      }
    } catch (err) {
      console.error(`Gagal mengambil RSS dari ${url}:`, err);
    }
  }

  // Jika semua RSS feed gagal di-fetch, kembalikan data fallback statis
  if (!success) {
    return NextResponse.json({
      success: false,
      data: FALLBACK_NEWS
    });
  }

  try {
    // Parser XML menggunakan regex teroptimasi untuk tag <item>
    const matchItems = xmlText.match(/<item>([\s\S]*?)<\/item>/g);
    if (!matchItems) {
      throw new Error('Tidak ditemukan tag <item> pada RSS Feed XML');
    }

    const titles: string[] = [];
    for (const item of matchItems) {
      if (titles.length >= 10) break; // Ambil maksimal 10 berita terkini saja

      // Cari judul, periksa struktur CDATA terlebih dahulu
      let titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/);
      if (!titleMatch) {
        titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
      }

      if (titleMatch && titleMatch[1]) {
        let cleanTitle = titleMatch[1]
          .replace(/<!\[CDATA\[/g, '')
          .replace(/\]\]>/g, '')
          .trim();

        // Dekode karakter HTML khusus yang sering muncul pada judul berita
        cleanTitle = cleanTitle
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .replace(/&apos;/g, "'")
          .replace(/&ndash;/g, '-')
          .replace(/&mdash;/g, '-')
          .replace(/&lsquo;/g, "'")
          .replace(/&rsquo;/g, "'")
          .replace(/&ldquo;/g, '"')
          .replace(/&rdquo;/g, '"');

        if (cleanTitle) {
          titles.push(cleanTitle);
        }
      }
    }

    if (titles.length === 0) {
      throw new Error('Hasil ekstraksi judul kosong');
    }

    return NextResponse.json({
      success: true,
      data: titles
    });
  } catch (parseError) {
    console.error('Error saat mem-parsing RSS XML:', parseError);
    return NextResponse.json({
      success: false,
      data: FALLBACK_NEWS
    });
  }
}
