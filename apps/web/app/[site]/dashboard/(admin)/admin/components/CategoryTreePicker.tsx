'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

export interface CategoryTreeNode {
  id: string
  name: string
  slug: string
  parentId?: string | null
  subCategories?: CategoryTreeNode[]
}

interface CategoryTreePickerProps {
  tree: CategoryTreeNode[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
}

function collectDescendantIds(node: CategoryTreeNode): string[] {
  const ids = [node.id]
  for (const sub of node.subCategories || []) {
    ids.push(...collectDescendantIds(sub))
  }
  return ids
}

function flattenTree(
  nodes: CategoryTreeNode[],
  parentId: string | null = null
): CategoryTreeNode[] {
  const flat: CategoryTreeNode[] = []
  for (const node of nodes) {
    flat.push({ ...node, parentId: node.parentId ?? parentId })
    if (node.subCategories?.length) {
      flat.push(...flattenTree(node.subCategories, node.id))
    }
  }
  return flat
}

function hasSelectedDescendant(
  node: CategoryTreeNode,
  selected: Set<string>
): boolean {
  for (const sub of node.subCategories || []) {
    if (selected.has(sub.id) || hasSelectedDescendant(sub, selected)) {
      return true
    }
  }
  return false
}

function getAncestorIds(
  categoryId: string,
  byId: Map<string, CategoryTreeNode>
): string[] {
  const ancestors: string[] = []
  let current = byId.get(categoryId)
  while (current?.parentId) {
    ancestors.push(current.parentId)
    current = byId.get(current.parentId)
  }
  return ancestors
}

export function getAllTreeIds(tree: CategoryTreeNode[]): string[] {
  return flattenTree(tree).map((n) => n.id)
}

export function CategoryTreePicker({
  tree,
  selectedIds,
  onChange,
  disabled = false
}: CategoryTreePickerProps) {
  const flatNodes = useMemo(() => flattenTree(tree), [tree])
  const byId = useMemo(
    () => new Map(flatNodes.map((n) => [n.id, n])),
    [flatNodes]
  )

  const selected = useMemo(() => new Set(selectedIds), [selectedIds])

  const applySelection = (next: Set<string>) => {
    onChange(Array.from(next))
  }

  const toggleChecked = (node: CategoryTreeNode, checked: boolean) => {
    const next = new Set(selected)
    const descendantIds = collectDescendantIds(node)

    if (checked) {
      descendantIds.forEach((id) => next.add(id))
      getAncestorIds(node.id, byId).forEach((id) => next.add(id))
    } else {
      descendantIds.forEach((id) => next.delete(id))
      for (const ancestorId of getAncestorIds(node.id, byId)) {
        const ancestor = byId.get(ancestorId)
        if (ancestor && !hasSelectedDescendant(ancestor, next)) {
          next.delete(ancestorId)
        }
      }
    }

    applySelection(next)
  }

  const getCheckState = (node: CategoryTreeNode): 'checked' | 'unchecked' | 'indeterminate' => {
    const descendants = collectDescendantIds(node)
    const selectedCount = descendants.filter((id) => selected.has(id)).length
    if (selectedCount === 0) return 'unchecked'
    if (selectedCount === descendants.length) return 'checked'
    return 'indeterminate'
  }

  return (
    <div className="space-y-1">
      {tree.map((node) => (
        <TreeBranch
          key={node.id}
          node={node}
          depth={0}
          disabled={disabled}
          getCheckState={getCheckState}
          onToggle={toggleChecked}
        />
      ))}
    </div>
  )
}

function TreeBranch({
  node,
  depth,
  disabled,
  getCheckState,
  onToggle
}: {
  node: CategoryTreeNode
  depth: number
  disabled: boolean
  getCheckState: (node: CategoryTreeNode) => 'checked' | 'unchecked' | 'indeterminate'
  onToggle: (node: CategoryTreeNode, checked: boolean) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = (node.subCategories?.length ?? 0) > 0
  const checkState = getCheckState(node)

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/60"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label={expanded ? 'Tutup' : 'Buka'}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-5" />
        )}

        <label className="flex items-center gap-2 flex-1 cursor-pointer min-w-0">
          <input
            type="checkbox"
            disabled={disabled}
            checked={checkState === 'checked'}
            ref={(el) => {
              if (el) el.indeterminate = checkState === 'indeterminate'
            }}
            onChange={(e) => onToggle(node, e.target.checked)}
            className="rounded border-gray-300 text-brand-red focus:ring-brand-red/30"
          />
          <span className="text-sm text-gray-800 dark:text-gray-200 truncate">
            {node.name}
          </span>
          <span className="text-xs text-gray-400 font-mono truncate">{node.slug}</span>
        </label>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.subCategories!.map((sub) => (
            <TreeBranch
              key={sub.id}
              node={sub}
              depth={depth + 1}
              disabled={disabled}
              getCheckState={getCheckState}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}
