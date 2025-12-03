'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export function BaseModal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  maxWidth = '3xl',
}: BaseModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full ${maxWidthClasses[maxWidth]} bg-abyss border-2 border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden animate-modal-slide-in`}
      >
        {/* Cyber glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 pointer-events-none" />
        <div className="absolute inset-0 border border-cyan-500/20 rounded-2xl blur-sm pointer-events-none" />

        {/* Header */}
        <div className="relative px-8 py-6 border-b border-steel/50 bg-deep/30 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {icon && (
                <div className="p-3 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl">
                  {icon}
                </div>
              )}
              <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-deep/50 rounded-lg transition-all duration-200 group"
            >
              <X className="w-6 h-6 text-gray-400 group-hover:text-cyan-400 transition-colors" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
