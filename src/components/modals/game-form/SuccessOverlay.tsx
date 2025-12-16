'use client';

import { CheckCircle, Plus } from 'lucide-react';

interface SuccessOverlayProps {
  isEditMode: boolean;
  onAddAnother: () => void;
  onClose: () => void;
}

export function SuccessOverlay({ isEditMode, onAddAnother, onClose }: SuccessOverlayProps) {
  return (
    <div className="absolute inset-0 z-50 bg-void/95 backdrop-blur-md flex items-center justify-center rounded-xl overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(0, 217, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 217, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          animation: 'gridPulse 2s ease-in-out infinite'
        }} />
      </div>

      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />

      <div className="text-center relative z-10">
        {/* Success icon with rings */}
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 scale-150 rounded-full border border-emerald-500/20 animate-[ringExpand_1.5s_ease-out_infinite]" />
          <div className="absolute inset-0 scale-125 rounded-full border border-emerald-500/30 animate-[ringExpand_1.5s_ease-out_0.3s_infinite]" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center animate-[successPop_0.5s_cubic-bezier(0.34,1.56,0.64,1)] shadow-lg shadow-emerald-500/30">
            <CheckCircle className="w-10 h-10 text-void" strokeWidth={2.5} />
          </div>
        </div>

        <h3 className="text-2xl font-bold text-white mb-2 tracking-wide">
          {isEditMode ? 'Game Updated!' : 'Game Added!'}
        </h3>
        <p className="text-gray-400 text-sm mb-8">
          {isEditMode ? 'Changes saved successfully' : 'Successfully added to your library'}
        </p>

        {/* Action buttons - only show Add Another for add mode */}
        {!isEditMode && (
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onAddAnother}
              className="group relative px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-void overflow-hidden transition-all hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Another
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-abyss/80 border border-steel/50 rounded-xl font-semibold text-gray-400 hover:text-white hover:border-steel transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
