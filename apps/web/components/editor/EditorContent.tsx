'use client'

import { EditorSidebar } from './EditorSidebar'
import { cn } from '../../lib/utils'
import { useEditorStore } from '../../store/editorStore'

interface EditorContentProps {
  children: React.ReactNode
  isFocusMode?: boolean
}

/**
 * EditorContent - Main content area wrapper
 * 
 * Handles:
 * - Responsive layout (with/without sidebar)
 * - Focus mode
 * - Editor canvas styling
 */
export function EditorContent({ children, isFocusMode = false }: EditorContentProps) {
  const { isSidebarOpen, toggleSidebar } = useEditorStore()
  
  return (
    <div className="editor-content flex-1 flex overflow-hidden">
      {/* Main Editor Area */}
      <div 
        className={cn(
          'flex-1 overflow-y-auto transition-all duration-300',
          isFocusMode ? 'bg-white dark:bg-slate-900' : 'bg-gray-50 dark:bg-[#0a0f1a]'
        )}
      >
        <div 
          className={cn(
            'min-h-full py-8 transition-all duration-300',
            isSidebarOpen ? 'lg:pr-0' : ''
          )}
        >
          {children}
        </div>
      </div>
      
      {/* Right Sidebar (Collapsible) */}
      {!isFocusMode && (
        <EditorSidebar 
          isOpen={isSidebarOpen} 
          onToggle={() => toggleSidebar()} 
        />
      )}
    </div>
  )
}

export default EditorContent