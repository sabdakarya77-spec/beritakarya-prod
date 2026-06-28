import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { normalizeArticleBlocks } from '@beritakarya/utils'
import { api } from '../lib/api'
import type { Block, ArticleStatus } from '@beritakarya/types'
import { createDefaultBlock } from '../components/editor/core/editorCommands'

export interface EditorState {
  articleId: string | null
  siteId: string | null
  title: string
  excerpt: string
  blocks: Block[]
  status: ArticleStatus
  saving: boolean
  saveError: string | null
  lastSaved: Date | null
  isDirty: boolean
  isLoading: boolean
  undoStack: Block[][]
  
  // Metadata & Editorial
  metaTitle: string
  metaDescription: string
  categoryIds: string[]
  tags: string[]
  featuredImage: string
  isBreaking: boolean
  isExclusive: boolean
  isFeatured: boolean
  
  // Content Type
  contentType: 'article' | 'photo_journalism' | 'video_exclusive'
  
  // UI State
  isSidebarOpen: boolean
  isFocusMode: boolean
  editorMode: 'gridblok' | 'wordpress'
  activeTab: 'content' | 'settings' | 'seo' | 'history' | 'assist'
  activeBlockId: string | null
  
  // Actions
  setTitle: (title: string) => void
  setExcerpt: (excerpt: string) => void
  setBlocks: (blocks: Block[]) => void
  addBlock: (type: Block['type'], afterId?: string) => void
  updateBlock: (id: string, data: Partial<Block>) => void
  replaceBlock: (id: string, type: Block['type']) => void
  removeBlock: (id: string) => void
  moveBlock: (id: string, direction: 'up' | 'down') => void
  reorderBlocks: (fromIdx: number, toIdx: number) => void
  undo: () => void
  setSiteId: (siteId: string) => void
  splitBlock: (id: string, contentBefore: string, contentAfter: string) => string | null
  mergeWithPrevious: (id: string) => { targetBlockId: string; cursorOffset: number } | null
  getBlockIndex: (id: string) => number
  getAdjacentBlockId: (id: string, direction: 'up' | 'down') => string | null
  
  // Data Sync
  loadArticle: (id: string, siteId: string) => Promise<void>
  saveArticle: () => Promise<void>
  setContentType: (type: EditorState['contentType']) => void
  updateArticleData: (data: Partial<EditorState>) => void
  
  toggleSidebar: (isOpen?: boolean) => void
  toggleFocusMode: (isFocus?: boolean) => void
  setEditorMode: (mode: 'gridblok' | 'wordpress') => void
  setActiveTab: (tab: EditorState['activeTab']) => void
  setActiveBlockId: (blockId: string | null) => void
  publishArticle: () => Promise<void>
  submitForReview: () => Promise<void>
  reset: (siteId?: string) => void
  
  // Derived State (Getters)
  getMissingRequirements: () => string[]
  getCompletionScore: () => number
}

function createInitialParagraphBlock() {
  return createDefaultBlock('paragraph') as Extract<Block, { type: 'paragraph' }>
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

function hasMeaningfulContent(state: Pick<EditorState, 'title' | 'blocks' | 'categoryIds' | 'tags' | 'featuredImage' | 'isBreaking' | 'isExclusive' | 'isFeatured'>) {
  const firstBlock = state.blocks[0] as { content?: string } | undefined
  const firstBlockContent = typeof firstBlock?.content === 'string' ? firstBlock.content.trim() : ''
  const hasEditorialData = Boolean((state.categoryIds && state.categoryIds.length > 0) || (state.tags && state.tags.length > 0) || state.featuredImage || state.isBreaking || state.isExclusive || state.isFeatured)
  return Boolean(state.title.trim() || firstBlockContent || state.blocks.length > 1 || hasEditorialData)
}

export const useEditorStore = create<EditorState>((set, get) => ({
  articleId: null,
  siteId: null,
  title: '',
  excerpt: '',
  blocks: [createInitialParagraphBlock()],
  status: 'draft',
  saving: false,
  saveError: null,
  lastSaved: null,
  isDirty: false,
  isLoading: false,
  undoStack: [],
  
  metaTitle: '',
  metaDescription: '',
  categoryIds: [],
  tags: [],
  featuredImage: '',
  isBreaking: false,
  isExclusive: false,
  isFeatured: false,
  
  contentType: 'article',
  
  isSidebarOpen: false,
  isFocusMode: false,
  editorMode: 'gridblok',
  activeTab: 'content',
  activeBlockId: null,

  setTitle: (title) => {
    set({ title, isDirty: true })
    scheduleAutoSave(get)
  },
  setExcerpt: (excerpt) => {
    set({ excerpt, isDirty: true })
    scheduleAutoSave(get)
  },
  setSiteId: (siteId) => set({ siteId }),
  
  setContentType: (contentType) => {
    // Auto-set category and flags based on content type
    let updates: Partial<EditorState> = { contentType }

    if (contentType === 'photo_journalism') {
      updates.categoryIds = ['foto-jurnalistik']
      updates.isExclusive = true
    } else if (contentType === 'video_exclusive') {
      updates.categoryIds = ['video']
      updates.isExclusive = true
    }

    set({ ...updates, isDirty: true })
    scheduleAutoSave(get)
  },

  setBlocks: (blocks) => {
    set((s) => ({ undoStack: [...s.undoStack.slice(-20), s.blocks], blocks, isDirty: true }))
    scheduleAutoSave(get)
  },

  addBlock: (type, afterId) => {
    const newBlock = createDefaultBlock(type)
    set((s) => {
      const idx = afterId ? s.blocks.findIndex(b => b.id === afterId) : s.blocks.length - 1
      const next = [...s.blocks]
      next.splice(idx + 1, 0, newBlock)
      return {
        undoStack: [...s.undoStack.slice(-20), s.blocks],
        blocks: next,
        isDirty: true,
        activeBlockId: newBlock.id
      }
    })
    scheduleAutoSave(get)
  },

  updateBlock: (id, data) => {
    set((s) => ({
      blocks: s.blocks.map(b => b.id === id ? { ...b, ...data } as Block : b),
      isDirty: true
    }))
    scheduleAutoSave(get)
  },

  replaceBlock: (id, type) => {
    set((s) => ({
      undoStack: [...s.undoStack.slice(-20), s.blocks],
      blocks: s.blocks.map(b =>
        b.id === id ? createDefaultBlock(type, id) : b
      ),
      isDirty: true,
      activeBlockId: id
    }))
    scheduleAutoSave(get)
  },

  removeBlock: (id) => {
    set((s) => {
      const nextBlocks = s.blocks.filter(b => b.id !== id)
      const fallbackBlock = createInitialParagraphBlock()
      const resolvedBlocks = nextBlocks.length ? nextBlocks : [fallbackBlock]
      return {
        undoStack: [...s.undoStack.slice(-20), s.blocks],
        blocks: resolvedBlocks,
        isDirty: true,
        activeBlockId: s.activeBlockId === id ? resolvedBlocks[0]?.id ?? null : s.activeBlockId
      }
    })
    scheduleAutoSave(get)
  },

  moveBlock: (id, direction) => {
    set((s) => {
      const idx = s.blocks.findIndex(b => b.id === id)
      if (idx === -1) return s
      const next = [...s.blocks]
      const target = direction === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= next.length) return s
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return { undoStack: [...s.undoStack.slice(-20), s.blocks], blocks: next, isDirty: true }
    })
    scheduleAutoSave(get)
  },

  reorderBlocks: (fromIdx, toIdx) => {
    set((s) => {
      const next = [...s.blocks]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      return { undoStack: [...s.undoStack.slice(-20), s.blocks], blocks: next, isDirty: true }
    })
    scheduleAutoSave(get)
  },

  undo: () => {
    set((s) => {
      if (!s.undoStack.length) return s
      const prev = s.undoStack[s.undoStack.length - 1]
      return { blocks: prev, undoStack: s.undoStack.slice(0, -1), isDirty: true }
    })
    scheduleAutoSave(get)
  },

  splitBlock: (id, contentBefore, contentAfter) => {
    const newId = uuidv4()
    set((s) => {
      const idx = s.blocks.findIndex(b => b.id === id)
      if (idx === -1) return s
      const currentBlock = s.blocks[idx]
      const updatedBlock = { ...currentBlock, content: contentBefore } as Block
      
      const textAlign = ('textAlign' in currentBlock) ? currentBlock.textAlign : undefined
      const newBlock: Block = { 
        id: newId, 
        type: 'paragraph', 
        content: contentAfter,
        ...(textAlign ? { textAlign } : {})
      }
      
      const next = [...s.blocks]
      next[idx] = updatedBlock
      next.splice(idx + 1, 0, newBlock)
      
      return {
        undoStack: [...s.undoStack.slice(-20), s.blocks],
        blocks: next,
        isDirty: true,
        activeBlockId: newId
      }
    })
    scheduleAutoSave(get)
    return newId
  },

  mergeWithPrevious: (id) => {
    let result: { targetBlockId: string; cursorOffset: number } | null = null
    set((s) => {
      const idx = s.blocks.findIndex(b => b.id === id)
      if (idx <= 0) return s
      
      const prevBlock = s.blocks[idx - 1]
      const currentBlock = s.blocks[idx]
      
      const isPrevText = prevBlock.type === 'paragraph' || prevBlock.type === 'heading' || prevBlock.type === 'quote'
      const isCurrText = currentBlock.type === 'paragraph' || currentBlock.type === 'heading' || currentBlock.type === 'quote'
      
      if (isPrevText && isCurrText) {
        const prevContent = ('content' in prevBlock ? prevBlock.content : '') || ''
        const currContent = ('content' in currentBlock ? currentBlock.content : '') || ''
        const mergedContent = prevContent + currContent
        
        const stripHtml = (html: string) => {
          if (typeof window !== 'undefined') {
            const doc = new DOMParser().parseFromString(html, 'text/html')
            return doc.body.textContent || ''
          }
          return html.replace(/<[^>]*>/g, '')
        }
        
        const cursorOffset = stripHtml(prevContent).length
        const updatedPrevBlock = { ...prevBlock, content: mergedContent } as Block
        const next = s.blocks.filter(b => b.id !== id)
        const prevIdx = next.findIndex(b => b.id === prevBlock.id)
        next[prevIdx] = updatedPrevBlock
        
        result = {
          targetBlockId: prevBlock.id,
          cursorOffset
        }
        
        return {
          undoStack: [...s.undoStack.slice(-20), s.blocks],
          blocks: next,
          isDirty: true,
          activeBlockId: prevBlock.id
        }
      }
      return s
    })
    scheduleAutoSave(get)
    return result
  },

  getBlockIndex: (id) => {
    return get().blocks.findIndex(b => b.id === id)
  },

  getAdjacentBlockId: (id, direction) => {
    const blocks = get().blocks
    const idx = blocks.findIndex(b => b.id === id)
    if (idx === -1) return null
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= blocks.length) return null
    return blocks[targetIdx].id
  },

  loadArticle: async (id, siteId) => {
    set({ isLoading: true, saveError: null, siteId })
    try {
      const { data } = await api.get(`/articles/${id}`, {
        params: siteId ? { site: siteId } : undefined
      })
      const article = data.data
      // [FIX] Guard against null/undefined blocks from DB
      const rawBlocks = article.blocks
      const blocks: Block[] = Array.isArray(rawBlocks) && rawBlocks.length > 0
        ? rawBlocks
        : [createInitialParagraphBlock()]
      // Use category slugs for frontend compatibility (frontend uses slug, not UUID)
      const categoryIds = article.categories?.map(
        (c: { category?: { slug: string } }) => c.category?.slug
      ).filter(Boolean) || []

      set({
        articleId: article.id,
        title: article.title || '',
        excerpt: article.excerpt || '',
        blocks,
        contentType: article.contentType || 'article',
        status: article.status,
        metaTitle: article.metaTitle || '',
        metaDescription: article.metaDescription || '',
        categoryIds,
        tags: article.tags || [],
        featuredImage: article.featuredImage || '',
        isBreaking: article.isBreaking || false,
        isExclusive: article.isExclusive || false,
        isFeatured: article.isFeatured || false,
        isDirty: false,
        isLoading: false,
        undoStack: [],
        activeBlockId: blocks[0]?.id ?? null
      })
    } catch (err: unknown) {
      console.error('Failed to load article:', err)
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
      const message = axiosErr?.response?.data?.message || axiosErr?.message || 'Gagal memuat artikel'
      set({ isLoading: false, saveError: message })
    }
  },

  saveArticle: async () => {
    const s = get()
    // Don't save if it's a new article with no data at all
    const firstBlock = s.blocks[0]
    const hasEditorialData = Boolean((s.categoryIds && s.categoryIds.length > 0) || (s.tags && s.tags.length > 0) || s.featuredImage || s.isBreaking || s.isExclusive || s.isFeatured)
    const hasFirstBlockContent = firstBlock && 'content' in firstBlock && typeof firstBlock.content === 'string' && firstBlock.content.trim()
    if (!s.articleId && !s.title.trim() && !hasEditorialData && s.blocks.length <= 1 && !hasFirstBlockContent) return

    set({ saving: true, saveError: null })
    try {
      const payload = {
        title: (s.title || 'Tanpa Judul').trim(),
        excerpt: s.excerpt?.trim() || undefined,
        blocks: normalizeArticleBlocks(s.blocks) as unknown as Block[],
        contentType: s.contentType,
        metaTitle: s.metaTitle?.slice(0, 60) || undefined,
        metaDescription: s.metaDescription?.slice(0, 160) || undefined,
        categoryIds: s.categoryIds,
        tags: s.tags,
        featuredImage: s.featuredImage || undefined,
        isBreaking: s.isBreaking,
        isExclusive: s.isExclusive,
        isFeatured: s.isFeatured
      }
      const params = s.siteId ? { params: { site: s.siteId } } : undefined

      if (s.articleId) {
        await api.put(`/articles/${s.articleId}`, payload, params)
        set({ saving: false, lastSaved: new Date(), isDirty: false })
      } else {
        // Create new article
        const { data } = await api.post('/articles', payload, params)
        const newArticle = data.data
        set({
          articleId: newArticle.id,
          saving: false,
          lastSaved: new Date(),
          isDirty: false
        })

        // Update URL to reflect new ID without full reload
        const newUrl = window.location.pathname.replace('/new', `/${newArticle.id}`)
        window.history.replaceState(null, '', newUrl)
      }
      // Reset error counter on success — auto-save kembali ke interval normal 15s
      consecutiveSaveErrors = 0
    } catch (err: unknown) {
      console.error('Failed to save article:', err)
      consecutiveSaveErrors++
      const axiosErr = err as { response?: { data?: { error?: { message?: string; details?: { field?: string; message?: string }[] }; message?: string } }; message?: string }
      const apiError = axiosErr?.response?.data?.error
      const details = apiError?.details
      const detailText = details?.length
        ? details.map((d) => d.message || d.field).filter(Boolean).join('; ')
        : ''
      const message =
        detailText ||
        apiError?.message ||
        axiosErr?.response?.data?.message ||
        axiosErr?.message ||
        'Gagal menyimpan artikel'
      set({ saving: false, saveError: message, lastSaved: null, isDirty: true })
    }
  },

  updateArticleData: (data) => {
    set({ ...data, isDirty: true })
    scheduleAutoSave(get)
  },

  setEditorMode: (editorMode) => set({ editorMode }),
  toggleSidebar: (isOpen) => set((s) => ({ isSidebarOpen: isOpen ?? !s.isSidebarOpen })),
  toggleFocusMode: (isFocus) => set((s) => ({ 
    isFocusMode: isFocus ?? !s.isFocusMode,
    isSidebarOpen: isFocus ? false : s.isSidebarOpen 
  })),
  setActiveTab: (activeTab) => set({ activeTab }),
  setActiveBlockId: (activeBlockId) => set({ activeBlockId }),

  publishArticle: async () => {
    const { articleId, siteId } = get()
    if (!articleId) return
    await get().saveArticle()
    await api.post(`/articles/${articleId}/publish`, undefined, siteId ? { params: { site: siteId } } : undefined)
    set({ status: 'published' })
  },

  submitForReview: async () => {
    const { articleId, siteId } = get()
    if (!articleId) {
      await get().saveArticle()
    }
    const freshId = get().articleId
    if (!freshId) return

    // Ensure all current data (including category) is saved before updating status
    await get().saveArticle()

    await api.put(`/articles/${freshId}`, { status: 'submitted' }, siteId ? { params: { site: siteId } } : undefined)
    set({ status: 'submitted' })
  },

  reset: (siteId?: string) => set({
    ...(function () {
      const initialBlock = createInitialParagraphBlock()
      return {
        blocks: [initialBlock],
        activeBlockId: initialBlock.id
      }
    })(),
    articleId: null, siteId: siteId ?? null, title: '', status: 'draft',
    excerpt: '',
    saving: false, saveError: null, lastSaved: null, isDirty: false, isLoading: false, undoStack: [],
    metaTitle: '', metaDescription: '', categoryIds: [], tags: [],
    featuredImage: '', isBreaking: false, isExclusive: false, isFeatured: false,
    isSidebarOpen: false, activeTab: 'content', contentType: 'article'
  }),

  getMissingRequirements: () => {
    const s = get()
    const missing: string[] = []

    if (!s.title?.trim()) missing.push('Judul artikel belum diisi')
    if (!s.excerpt?.trim()) missing.push('Deck / Excerpt belum diisi')
    if (!s.categoryIds?.length) missing.push('Kategori belum dipilih')
    if (!s.featuredImage) missing.push('Gambar utama belum diunggah')

    // Helper: hitung kata dari paragraph/heading blocks
    const countWords = () => {
      const textBlocks = s.blocks.filter(b => b.type === 'paragraph' || b.type === 'heading')
      return textBlocks.reduce((acc, b) => {
        const content = ('content' in b ? b.content : '') || ''
        return acc + content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length
      }, 0)
    }

    if (s.contentType === 'photo_journalism') {
      // Foto Jurnalistik: wajib minimal 1 foto di galeri
      const gallery = s.blocks.find(b => b.type === 'gallery')
      const imageCount = (gallery && 'images' in gallery ? gallery.images?.length || 0 : 0)
      if (imageCount < 1) missing.push(`Galeri foto wajib minimal 1 foto (saat ini: ${imageCount})`)
      // Foto Jurnalistik: wajib minimal 15 kata narasi
      const wc = countWords()
      if (wc < 15) missing.push(`Narasi foto wajib minimal 15 kata (saat ini: ${wc})`)
    } else if (s.contentType === 'video_exclusive') {
      // Video Eksklusif: wajib minimal 1 video embed
      const embedCount = s.blocks.filter(b => b.type === 'embed').length
      if (embedCount < 1) missing.push('Video Eksklusif wajib memiliki minimal 1 video')
      // Video Eksklusif: wajib minimal 15 kata narasi
      const wc = countWords()
      if (wc < 15) missing.push(`Narasi video wajib minimal 15 kata (saat ini: ${wc})`)
    } else {
      // Artikel biasa: wajib minimal 1 paragraf
      const paragraphCount = s.blocks.filter(b => b.type === 'paragraph' && ('content' in b ? b.content : '')?.trim()).length
      if (paragraphCount < 1) missing.push('Konten artikel masih kosong')
    }

    return missing
  },

  getCompletionScore: () => {
    const s = get()
    let score = 0

    if (s.title?.trim()) score += 20
    if (s.excerpt?.trim()) score += 20
    if (s.categoryIds?.length) score += 20
    if (s.featuredImage) score += 20

    // Helper: hitung kata dari paragraph/heading blocks
    const countWords = () => {
      const textBlocks = s.blocks.filter(b => b.type === 'paragraph' || b.type === 'heading')
      return textBlocks.reduce((acc, b) => {
        const content = ('content' in b ? b.content : '') || ''
        return acc + content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length
      }, 0)
    }

    if (s.contentType === 'photo_journalism') {
      // Foto Jurnalistik: cek galeri dan narasi
      const gallery = s.blocks.find(b => b.type === 'gallery')
      const imageCount = (gallery && 'images' in gallery ? gallery.images?.length || 0 : 0)
      if (imageCount >= 3 && countWords() >= 15) score += 20
    } else if (s.contentType === 'video_exclusive') {
      // Video Eksklusif: cek embed dan narasi
      const embedCount = s.blocks.filter(b => b.type === 'embed').length
      if (embedCount >= 1 && countWords() >= 15) score += 20
    } else {
      // Artikel biasa: cek paragraf
      if (s.blocks.some(b => b.type === 'paragraph' && ('content' in b ? b.content : '')?.trim())) score += 20
    }

    return score
  }
}))

let lastAutoSaveTime = Date.now()
let consecutiveSaveErrors = 0
const MAX_BACKOFF = 120000 // 2 menit maksimal backoff

function scheduleAutoSave(get: () => EditorState) {
  if (saveTimer) clearTimeout(saveTimer)

  const now = Date.now()
  const timeSinceLastSave = now - lastAutoSaveTime

  // Jika pengguna mengetik terus-menerus selama lebih dari 60 detik tanpa jeda diam 15 detik,
  // paksa auto-save sekarang juga untuk melindungi data pengguna dari potensi kehilangan data.
  if (timeSinceLastSave >= 60000) {
    const state = get()
    if (state.isDirty && !state.saving && hasMeaningfulContent(state)) {
      lastAutoSaveTime = now
      state.saveArticle()
      return
    }
  }

  // Backoff jika auto-save terus gagal: 15s → 30s → 60s → 120s
  // Reset ke 15s setelah save berhasil atau user mengubah data signifikan
  const backoffDelay = consecutiveSaveErrors > 0
    ? Math.min(15000 * Math.pow(2, consecutiveSaveErrors - 1), MAX_BACKOFF)
    : 15000

  // Jika tidak, jalankan auto-save normal dengan debouncing
  saveTimer = setTimeout(() => {
    const state = get()
    if (!state.isDirty || state.saving || !hasMeaningfulContent(state)) return
    lastAutoSaveTime = Date.now()
    state.saveArticle()
  }, backoffDelay)
}
