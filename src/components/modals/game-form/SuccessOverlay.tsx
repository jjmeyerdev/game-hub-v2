'use client';

import { Check, Plus } from 'lucide-react';

interface SuccessOverlayProps {
  isEditMode: boolean;
  onAddAnother: () => void;
  onClose: () => void;
}

export function SuccessOverlay({ isEditMode, onAddAnother, onClose }: SuccessOverlayProps) {
  return (
    <div className="absolute inset-0 z-50 bg-[#0a0a0b]/98 backdrop-blur-sm flex items-center justify-center rounded-xl overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />

      <div className="text-center relative z-10" style={{ animation: 'successFadeIn 0.4s ease-out' }}>
        {/* Success icon */}
        <div className="relative inline-block mb-6">
          {/* Outer ring */}
          <div className="absolute inset-0 scale-[1.8] rounded-full border border-emerald-500/20" style={{ animation: 'ringPulse 2s ease-out infinite' }} />
          {/* Inner circle */}
          <div
            className="relative w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
            style={{ animation: 'successPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            <Check className="w-8 h-8 text-[#030304]" strokeWidth={3} />
          </div>
        </div>

        <h3 className="text-xl font-semibold text-white mb-2">
          {isEditMode ? 'Changes Saved' : 'Game Added'}
        </h3>
        <p className="text-sm text-white/40 mb-8">
          {isEditMode ? 'Your changes have been saved' : 'Added to your library'}
        </p>

        {/* Action buttons */}
        {!isEditMode && (
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onAddAnother}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#030304] font-semibold rounded-xl hover:bg-cyan-400 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Another
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl font-medium text-white/60 hover:text-white hover:border-white/[0.15] transition-all"
            >
              Done
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes successFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes successPop {
          0% { transform: scale(0); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes ringPulse {
          0%, 100% { opacity: 0.3; transform: scale(1.8); }
          50% { opacity: 0.1; transform: scale(2); }
        }
      `}</style>
    </div>
  );
}
