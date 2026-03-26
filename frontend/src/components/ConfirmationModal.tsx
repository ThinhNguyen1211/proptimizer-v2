import { Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading = false
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl p-6 max-w-[340px] w-full z-[10000] border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h3 className="text-[15px] font-semibold text-gray-900 mb-1.5">
          {title}
        </h3>

        {/* Message */}
        <p className="text-[13px] text-gray-500 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[13px] font-medium text-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[13px] font-medium flex items-center gap-1.5"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
