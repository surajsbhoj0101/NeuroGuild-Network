import React from 'react'

function ConfirmationBox({ isOpen, message, onConfirm, onCancel, confirmLabel = 'Confirm', cancelLabel = 'Cancel', loading = false }) {
    if (!isOpen) return null;

    return (
        // overlay
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-[#0b0f1a] border border-[#14a19f]/20 rounded-lg p-6 w-full max-w-md shadow-lg">
                <div className="mb-4 text-gray-200">{message}</div>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded bg-gray-700 text-gray-200 hover:opacity-90"
                        disabled={loading}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded bg-[#14a19f] text-white font-semibold hover:opacity-95 flex items-center gap-2"
                        disabled={loading}
                    >
                        {loading ? 'Working...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmationBox