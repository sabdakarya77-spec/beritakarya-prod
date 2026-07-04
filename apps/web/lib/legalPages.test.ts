import { describe, it, expect } from 'vitest'
import { prepareLegalDocumentContent, ALL_LEGAL_PAGES, type LegalPageConfig } from './legalPages'

describe('prepareLegalDocumentContent', () => {
  it('menghapus heading CMS yang mengulang judul halaman', () => {
    const html = prepareLegalDocumentContent(
      '<h2>Kebijakan Privasi</h2><p>Isi kebijakan yang sebenarnya.</p>',
      { pageTitle: 'Kebijakan Privasi', intro: 'Penjelasan singkat.' }
    )
    expect(html).not.toMatch(/<h2>\s*Kebijakan Privasi/i)
    expect(html).toContain('Isi kebijakan yang sebenarnya')
  })

  it('tetap mempertahankan paragraf pembuka walau mirip intro statis', () => {
    const intro =
      'Penjelasan mengenai bagaimana portal mengumpulkan data pengguna.'
    const html = prepareLegalDocumentContent(
      `<p>${intro}</p><p>Klausul pertama yang unik.</p>`,
      { pageTitle: 'Kebijakan Privasi', intro }
    )

    expect(html).toContain(intro)
    expect(html).toContain('Klausul pertama yang unik')
  })

  it('tetap mempertahankan heading yang tidak sama persis dengan judul', () => {
    const html = prepareLegalDocumentContent(
      '<h2>Kebijakan Privasi Portal</h2><p>Isi kebijakan yang sebenarnya.</p>',
      { pageTitle: 'Kebijakan Privasi', intro: 'Penjelasan singkat.' }
    )

    expect(html).toContain('Kebijakan Privasi Portal')
    expect(html).toContain('Isi kebijakan yang sebenarnya')
  })
})

describe('ALL_LEGAL_PAGES', () => {
  it('memiliki konfigurasi lengkap untuk 7 halaman legal', () => {
    expect(ALL_LEGAL_PAGES).toBeDefined()
    expect(ALL_LEGAL_PAGES.length).toBe(7)

    const expectedSlugs = ['about', 'editorial', 'ethics', 'kebijakan-privasi', 'media-siber', 'terms', 'cookies']
    const expectedKeys = ['aboutUs', 'editorial', 'codeOfEthics', 'privacyPolicy', 'mediaSiber', 'termsOfService', 'cookiePolicy']

    ALL_LEGAL_PAGES.forEach((page: LegalPageConfig) => {
      expect(page.id).toBeDefined()
      expect(page.title).toBeDefined()
      expect(page.intro).toBeDefined()
      expect(page.settingsKey).toBeDefined()
      expect(page.href).toBeInstanceOf(Function)

      expect(expectedSlugs).toContain(page.slug)
      expect(expectedKeys).toContain(page.settingsKey)
    })
  })

  it('menghasilkan URL href yang benar berdasarkan site ID', () => {
    const testSite = 'jabar'

    const aboutPage = ALL_LEGAL_PAGES.find((p: LegalPageConfig) => p.id === 'aboutUs')
    expect(aboutPage!.href(testSite)).toBe('/jabar/p/about')

    const privacyPage = ALL_LEGAL_PAGES.find((p: LegalPageConfig) => p.id === 'privacyPolicy')
    expect(privacyPage!.href(testSite)).toBe('/jabar/kebijakan-privasi')
  })
})
