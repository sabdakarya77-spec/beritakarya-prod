import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useEditorStore } from './editorStore'

vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: { data: {
      id: 'a-1', title: 'Test', blocks: [], status: 'draft',
      metaTitle: '', metaDescription: ''
    }}}),
    put: vi.fn().mockResolvedValue({ data: { success: true } }),
    post: vi.fn().mockResolvedValue({ data: { success: true } })
  }
}))

describe('editorStore', () => {
  beforeEach(() => {
    useEditorStore.getState().reset()
  })

  it('addBlock menambah blok setelah index tertentu', () => {
    const { addBlock, blocks } = useEditorStore.getState()
    const firstId = blocks[0]?.id

    addBlock('heading', firstId)

    const updated = useEditorStore.getState().blocks
    expect(updated).toHaveLength(2)
    expect(updated[1].type).toBe('heading')
  })

  it('removeBlock menghapus blok dari list', () => {
    const store = useEditorStore.getState()
    store.addBlock('paragraph')
    const id = useEditorStore.getState().blocks[1].id

    useEditorStore.getState().removeBlock(id)

    const updated = useEditorStore.getState().blocks
    expect(updated.find(b => b.id === id)).toBeUndefined()
  })

  it('updateBlock memperbarui content blok', () => {
    const store = useEditorStore.getState()
    const id = store.blocks[0].id

    store.updateBlock(id, { content: 'Konten baru' })

    const updated = useEditorStore.getState().blocks.find(b => b.id === id)
    expect(updated && 'content' in updated ? updated.content : undefined).toBe('Konten baru')
  })

  it('moveBlock naik memindah blok ke posisi sebelumnya', () => {
    const store = useEditorStore.getState()
    store.addBlock('heading')

    const blocks = useEditorStore.getState().blocks
    const secondId = blocks[1].id

    useEditorStore.getState().moveBlock(secondId, 'up')

    const updated = useEditorStore.getState().blocks
    expect(updated[0].id).toBe(secondId)
  })

  it('undo mengembalikan state blok sebelumnya', () => {
    const store = useEditorStore.getState()
    const originalBlocks = [...store.blocks]

    store.addBlock('paragraph')
    expect(useEditorStore.getState().blocks).toHaveLength(2)

    useEditorStore.getState().undo()
    expect(useEditorStore.getState().blocks).toHaveLength(originalBlocks.length)
  })

  it('setTitle menandai isDirty = true', () => {
    useEditorStore.getState().setTitle('Judul Baru')
    expect(useEditorStore.getState().isDirty).toBe(true)
    expect(useEditorStore.getState().title).toBe('Judul Baru')
  })
})
