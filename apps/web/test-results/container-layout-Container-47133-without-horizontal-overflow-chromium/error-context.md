# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: container-layout.spec.ts >> Container Layout System >> public info pages render without horizontal overflow
- Location: tests\e2e\container-layout.spec.ts:17:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/pusat/p/ethics", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - link "Langsung ke konten" [ref=e3] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e6]:
    - generic [ref=e11]: TERKINI
    - generic [ref=e13]:
      - generic [ref=e15] [cursor=pointer]: Sri Mulyani Paparkan Strategi Fiskal 2026 di Hadapan DPR
      - generic [ref=e18] [cursor=pointer]: Rupiah Menguat ke Level Rp 15.200 per Dolar AS Pagi Ini
      - generic [ref=e21] [cursor=pointer]: Timnas Indonesia Siap Hadapi Laga Krusial di Kualifikasi Piala Dunia
      - generic [ref=e24] [cursor=pointer]: Pemerintah Resmi Luncurkan Program Insentif Kendaraan Listrik Tahap II
      - generic [ref=e27] [cursor=pointer]: Sri Mulyani Paparkan Strategi Fiskal 2026 di Hadapan DPR
      - generic [ref=e30] [cursor=pointer]: Rupiah Menguat ke Level Rp 15.200 per Dolar AS Pagi Ini
      - generic [ref=e33] [cursor=pointer]: Timnas Indonesia Siap Hadapi Laga Krusial di Kualifikasi Piala Dunia
      - generic [ref=e36] [cursor=pointer]: Pemerintah Resmi Luncurkan Program Insentif Kendaraan Listrik Tahap II
  - banner [ref=e38]:
    - generic [ref=e40]:
      - link "BERITAKARYA Nusantara Berbicara•Sabtu, 20 Juni 2026" [ref=e42] [cursor=pointer]:
        - /url: /pusat
        - heading "BERITAKARYA" [level=1] [ref=e43]
        - generic [ref=e44]: Nusantara Berbicara•Sabtu, 20 Juni 2026
      - generic [ref=e45]:
        - img [ref=e46]
        - textbox "Cari berita, topik, penulis..." [ref=e49]
      - generic [ref=e50]:
        - link "Artikel tersimpan" [ref=e51] [cursor=pointer]:
          - /url: /pusat?cat=tersimpan
          - img [ref=e52]
        - button "Aktifkan mode gelap" [ref=e54] [cursor=pointer]:
          - img [ref=e55]
        - link "Masuk" [ref=e57] [cursor=pointer]:
          - /url: /login
          - img [ref=e58]
          - generic [ref=e61]: Masuk
    - generic [ref=e63]:
      - button "Terbaru" [ref=e65] [cursor=pointer]:
        - generic [ref=e66]: Terbaru
      - button "Nasional" [ref=e69] [cursor=pointer]:
        - generic [ref=e70]: Nasional
      - button "Daerah" [ref=e72] [cursor=pointer]:
        - generic [ref=e73]: Daerah
      - button "Ekonomi" [ref=e75] [cursor=pointer]:
        - generic [ref=e76]: Ekonomi
      - button "Olahraga" [ref=e78] [cursor=pointer]:
        - generic [ref=e79]: Olahraga
      - button "Teknologi" [ref=e81] [cursor=pointer]:
        - generic [ref=e82]: Teknologi
      - button "Opini" [ref=e84] [cursor=pointer]:
        - generic [ref=e85]: Opini
      - button "Investigasi" [ref=e87] [cursor=pointer]:
        - generic [ref=e88]: Investigasi
      - button "Gaya Hidup" [ref=e90] [cursor=pointer]:
        - generic [ref=e91]: Gaya Hidup
      - button "Advertorial" [ref=e93] [cursor=pointer]:
        - generic [ref=e94]: Advertorial
      - button "Video" [ref=e96] [cursor=pointer]:
        - generic [ref=e97]: Video
      - button "Tersimpan" [ref=e99] [cursor=pointer]:
        - img [ref=e100]
        - generic [ref=e102]: Tersimpan
  - main [ref=e103]:
    - generic [ref=e105]:
      - heading "Kode Etik" [level=1] [ref=e107]
      - paragraph [ref=e112]: Kode etik jurnalistik BeritaKarya.
  - contentinfo [ref=e113]:
    - generic [ref=e114]:
      - generic [ref=e115]:
        - generic [ref=e116]:
          - button "BeritaKarya Pusat" [ref=e117] [cursor=pointer]:
            - generic [ref=e118]: BeritaKarya Pusat
          - paragraph [ref=e119]: Portal berita independen menyajikan analisis tajam, investigasi mendalam, dan informasi tepercaya dari seluruh pelosok Indonesia.
          - generic [ref=e120]:
            - paragraph [ref=e121]:
              - img [ref=e122]
              - generic [ref=e125]: Jl. Merdeka No. 123, Jakarta Pusat, Indonesia
            - paragraph [ref=e126]:
              - img [ref=e127]
              - text: +62 815 9921 922
            - paragraph [ref=e129]:
              - img [ref=e130]
              - text: support.beritakarya@gmail.com
        - generic [ref=e133]:
          - heading "Kategori Utama" [level=5] [ref=e134]
          - generic [ref=e135]:
            - link "Nasional" [ref=e136] [cursor=pointer]:
              - /url: /pusat?cat=nasional
            - link "Daerah" [ref=e137] [cursor=pointer]:
              - /url: /pusat?cat=daerah
            - link "Ekonomi" [ref=e138] [cursor=pointer]:
              - /url: /pusat?cat=ekonomi
            - link "Olahraga" [ref=e139] [cursor=pointer]:
              - /url: /pusat?cat=olahraga
            - link "Teknologi" [ref=e140] [cursor=pointer]:
              - /url: /pusat?cat=teknologi
            - link "Opini" [ref=e141] [cursor=pointer]:
              - /url: /pusat?cat=opini
            - link "Investigasi" [ref=e142] [cursor=pointer]:
              - /url: /pusat?cat=investigasi
            - link "Gaya Hidup" [ref=e143] [cursor=pointer]:
              - /url: /pusat?cat=gaya-hidup
            - link "Video" [ref=e144] [cursor=pointer]:
              - /url: /pusat?cat=video
        - generic [ref=e145]:
          - heading "Kerja Sama" [level=5] [ref=e146]
          - list [ref=e147]:
            - listitem [ref=e148]:
              - link "Iklan" [ref=e149] [cursor=pointer]:
                - /url: /pusat/p/ads
            - listitem [ref=e150]:
              - link "Advertorial" [ref=e151] [cursor=pointer]:
                - /url: /pusat?cat=advertorial
            - listitem [ref=e152]:
              - link "Kemitraan & Partner" [ref=e153] [cursor=pointer]:
                - /url: /pusat/p/ads
      - generic [ref=e154]:
        - link "Tentang Kami" [ref=e155] [cursor=pointer]:
          - /url: /pusat/p/about
        - link "Redaksi" [ref=e156] [cursor=pointer]:
          - /url: /pusat/p/editorial
        - link "Kode Etik" [ref=e157] [cursor=pointer]:
          - /url: /pusat/p/ethics
        - link "Kebijakan Privasi" [ref=e158] [cursor=pointer]:
          - /url: /pusat/kebijakan-privasi
        - link "Pedoman Media Siber" [ref=e159] [cursor=pointer]:
          - /url: /pusat/p/media-siber
        - link "Ketentuan Penggunaan" [ref=e160] [cursor=pointer]:
          - /url: /pusat/p/terms
      - generic [ref=e161]: © 2026 BERITA KARYA. ALL RIGHTS RESERVED.
```

# Test source

```ts
  1  | import { test, expect, type Page } from '@playwright/test'
  2  | 
  3  | const PUBLIC_ROUTES = ['/pusat', '/pusat/p/about', '/pusat/p/ethics']
  4  | 
  5  | async function hasHorizontalOverflow(page: Page) {
  6  |   return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  7  | }
  8  | 
  9  | test.describe('Container Layout System', () => {
  10 |   test('homepage has no horizontal overflow on mobile', async ({ page }) => {
  11 |     await page.setViewportSize({ width: 375, height: 667 })
  12 |     await page.goto('/pusat')
  13 |     await expect(page.locator('main')).toBeVisible()
  14 |     await expect.poll(() => hasHorizontalOverflow(page)).toBe(false)
  15 |   })
  16 | 
  17 |   test('public info pages render without horizontal overflow', async ({ page }) => {
  18 |     await page.setViewportSize({ width: 1280, height: 800 })
  19 | 
  20 |     for (const route of PUBLIC_ROUTES) {
> 21 |       await page.goto(route, { timeout: 45000 })
     |                  ^ Error: page.goto: Test timeout of 30000ms exceeded.
  22 |       await expect(page.locator('main, article').first()).toBeVisible()
  23 |       await expect.poll(() => hasHorizontalOverflow(page)).toBe(false)
  24 |     }
  25 |   })
  26 | 
  27 |   test('main content stays within viewport across breakpoints', async ({ page }) => {
  28 |     const viewports = [
  29 |       { width: 375, height: 667 },
  30 |       { width: 768, height: 800 },
  31 |       { width: 1280, height: 800 },
  32 |     ]
  33 | 
  34 |     for (const viewport of viewports) {
  35 |       await page.setViewportSize(viewport)
  36 |       await page.goto('/pusat')
  37 | 
  38 |       const container = page.locator('main').first()
  39 |       await expect(container).toBeVisible()
  40 | 
  41 |       const box = await container.boundingBox()
  42 |       expect(box).not.toBeNull()
  43 | 
  44 |       if (box) {
  45 |         expect(box.x).toBeGreaterThanOrEqual(0)
  46 |         expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
  47 |       }
  48 |     }
  49 |   })
  50 | 
  51 |   test('layout remains stable after initial render', async ({ page }) => {
  52 |     await page.setViewportSize({ width: 1280, height: 800 })
  53 |     await page.goto('/pusat')
  54 | 
  55 |     const initialWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  56 |     await page.waitForLoadState('domcontentloaded')
  57 |     await expect(page.locator('main')).toBeVisible()
  58 | 
  59 |     await expect
  60 |       .poll(async () => {
  61 |         const currentWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  62 |         return Math.abs(currentWidth - initialWidth)
  63 |       })
  64 |       .toBeLessThanOrEqual(1)
  65 |   })
  66 | })
  67 | 
```