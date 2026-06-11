'use client'

/**
 * Stub AIConsentModal component
 */
interface AIConsentModalProps {
  isOpen?: boolean
  onClose?: () => void
  onAccept?: () => void
}

export function AIConsentModal({ 
  isOpen = false, 
  onClose = () => {}, 
  onAccept = () => {} 
}: AIConsentModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md">
        <h2 className="text-xl font-bold mb-4">AI Assistant Consent</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Apakah Anda ingin mengaktifkan AI Assistant untuk membantu menulis artikel?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-slate-700 rounded-lg"
          >
            Tidak
          </button>
          <button
            onClick={onAccept}
            className="px-4 py-2 bg-brand-red text-white rounded-lg"
          >
            Ya, Aktifkan
          </button>
        </div>
      </div>
    </div>
  )
}

export default AIConsentModal