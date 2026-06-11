import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { useEditorStore } from './editorStore'
import { api } from '../lib/api'
import type { Block } from '@beritakarya/types'

export interface LayoutSuggestion {
    type: 'split_paragraph' | 'insert_image_after' | 'add_heading' | 'reorder'
    targetBlockId: string
    reason: string
    data?: Record<string, any>
}

interface LayoutState {
    suggestions: LayoutSuggestion[]
    selected: Set<number>
    loading: boolean
    error: string | null
    summary: string

    analyze: (blocks: Block[]) => Promise<void>
    toggleSelect: (idx: number) => void
    selectAll: () => void
    clearAll: () => void
    applySelected: () => void
    dismiss: () => void
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
    suggestions: [],
    selected: new Set(),
    loading: false,
    error: null,
    summary: '',

    analyze: async (blocks) => {
        set({ loading: true, error: null, suggestions: [], selected: new Set() })
        try {
            const { data } = await api.post('/ai/layout', { blocks })
            if (!data.success) throw new Error(data.error || 'Analisis gagal')
            set({
                suggestions: data.data.suggestions,
                summary: data.data.summary,
                selected: new Set(data.data.suggestions.map((_: any, i: number) => i)),
                loading: false
            })
        } catch (err: any) {
            set({
                error: err.response?.data?.error || err.message || 'AI tidak tersedia',
                loading: false
            })
        }
    },

    toggleSelect: (idx) => {
        set(s => {
            const next = new Set(s.selected)
            next.has(idx) ? next.delete(idx) : next.add(idx)
            return { selected: next }
        })
    },

    selectAll: () => {
        set(s => ({ selected: new Set(s.suggestions.map((_, i) => i)) }))
    },

    clearAll: () => set({ selected: new Set() }),

    applySelected: () => {
        const { suggestions, selected } = get()
        const editor = useEditorStore.getState()
        const toApply = suggestions.filter((_, i) => selected.has(i))

        let blocks = [...editor.blocks]

        toApply.forEach(s => {
            const idx = blocks.findIndex(b => b.id === s.targetBlockId)
            if (idx === -1) return

            if (s.type === 'split_paragraph') {
                const block = blocks[idx] as any
                const content: string = block.content || ''
                const sentences = content.match(/[^.!?]+[.!?]+/g) || [content]
                const splitAt = s.data?.splitAfterSentence || Math.ceil(sentences.length / 2)
                const part1 = sentences.slice(0, splitAt).join(' ').trim()
                const part2 = sentences.slice(splitAt).join(' ').trim()
                if (part1 && part2) {
                    blocks.splice(idx, 1,
                        { ...block, content: part1 },
                        { id: uuidv4(), type: 'paragraph', content: part2 } as Block
                    )
                }
            }
            // Tambahkan implementasi untuk tipe suggestion lainnya di sini
        })

        void editor.setBlocks(blocks)
        set({ suggestions: [], selected: new Set(), summary: '' })
    },

    dismiss: () => set({ suggestions: [], selected: new Set(), error: null, summary: '' })
}));