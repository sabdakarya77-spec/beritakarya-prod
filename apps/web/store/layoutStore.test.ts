import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useLayoutStore } from './layoutStore'
import { useEditorStore } from './editorStore'

// Mock api
vi.mock('../lib/api', () => ({
  api: {
    post: vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: {
          suggestions: [
            {
              type: 'split_paragraph',
              targetBlockId: 'block-1',
              reason: 'Paragraf terlalu panjang',
              data: { splitAfterSentence: 1 }
            }
          ],
          summary: 'Ditemukan 1 saran'
        }
      }
    })
  }
}))

// Mock editorStore
vi.mock('./editorStore', () => ({
  useEditorStore: {
    getState: vi.fn().mockReturnValue({
      blocks: [
        { id: 'block-1', type: 'paragraph', content: 'Kalimat pertama. Kalimat kedua.' }
      ],
      setBlocks: vi.fn()
    }),
    setState: vi.fn()
  }
}))

describe('layoutStore', () => {
  beforeEach(() => {
    useLayoutStore.setState({
      suggestions: [],
      selected: new Set(),
      loading: false,
      error: null,
      summary: ''
    })
  })

  it('analyze mengisi suggestions dari API', async () => {
    await useLayoutStore.getState().analyze([
      { id: 'block-1', type: 'paragraph', content: 'Test.' }
    ])
    const { suggestions, summary } = useLayoutStore.getState()
    expect(suggestions).toHaveLength(1)
    expect(suggestions[0].type).toBe('split_paragraph')
    expect(summary).toBe('Ditemukan 1 saran')
  })

  it('dismiss membersihkan semua state', () => {
    useLayoutStore.setState({
      suggestions: [{ type: 'split_paragraph', targetBlockId: 'x', reason: 'test' }],
      selected: new Set([0]),
      summary: 'ada saran'
    })
    useLayoutStore.getState().dismiss()
    const { suggestions, selected, summary } = useLayoutStore.getState()
    expect(suggestions).toHaveLength(0)
    expect(selected.size).toBe(0)
    expect(summary).toBe('')
  })

  it('toggleSelect menambah dan menghapus index dari selected', () => {
    useLayoutStore.setState({
      suggestions: [
        { type: 'split_paragraph', targetBlockId: 'a', reason: 'r1' },
        { type: 'add_heading',     targetBlockId: 'b', reason: 'r2' }
      ],
      selected: new Set()
    })
    useLayoutStore.getState().toggleSelect(0)
    expect(useLayoutStore.getState().selected.has(0)).toBe(true)
    useLayoutStore.getState().toggleSelect(0)
    expect(useLayoutStore.getState().selected.has(0)).toBe(false)
  })
})
