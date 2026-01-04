'use client';

import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type MessageType = 'success' | 'error' | 'warning' | 'info';

interface StatusMessageProps {
  type: MessageType;
  message: string;
  className?: string;
}

const config: Record<MessageType, { icon: typeof CheckCircle; colors: string }> = {
  success: {
    icon: CheckCircle,
    colors: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  },
  error: {
    icon: XCircle,
    colors: 'bg-red-500/10 border-red-500/30 text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    colors: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  },
  info: {
    icon: Info,
    colors: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
  },
};

/**
 * Consistent status message component for success/error/warning/info states
 */
export function StatusMessage({ type, message, className }: StatusMessageProps) {
  const { icon: Icon, colors } = config[type];

  return (
    <div
      className={cn(
        'p-4 border rounded-xl flex items-center gap-3 animate-fade-in',
        colors,
        className
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

/**
 * Convenience components for each message type
 */
export function SuccessMessage({ message, className }: { message: string; className?: string }) {
  return <StatusMessage type="success" message={message} className={className} />;
}

export function ErrorMessage({ message, className }: { message: string; className?: string }) {
  return <StatusMessage type="error" message={message} className={className} />;
}

export function WarningMessage({ message, className }: { message: string; className?: string }) {
  return <StatusMessage type="warning" message={message} className={className} />;
}

export function InfoMessage({ message, className }: { message: string; className?: string }) {
  return <StatusMessage type="info" message={message} className={className} />;
}
