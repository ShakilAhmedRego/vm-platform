'use client'

export default function UnlockBar({
  selectedCount,
  newCount,
  onUnlock,
  onClear,
  loading,
}: {
  selectedCount: number
  newCount: number
  onUnlock: () => void
  onClear: () => void
  loading?: boolean
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="text-sm text-gray-900 dark:text-gray-100">
          <span className="font-semibold">{selectedCount}</span> selected ·{' '}
          <span className="font-semibold">{newCount}</span> new · Cost:{' '}
          <span className="font-semibold">{newCount}</span> credits
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClear} className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 text-sm">Clear</button>
          <button
            onClick={onUnlock}
            disabled={loading}
            className="px-3 py-2 rounded-md bg-gray-900 text-white text-sm font-medium disabled:opacity-60"
          >
            {loading ? 'Unlocking…' : 'Unlock'}
          </button>
        </div>
      </div>
    </div>
  )
}
