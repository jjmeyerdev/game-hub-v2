'use client';

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Base input styles used across all form inputs
 */
export const inputBaseStyles = cn(
  'w-full px-4 py-3 bg-deep/50 border border-steel/30 rounded-xl',
  'text-white placeholder:text-gray-600',
  'focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20',
  'transition-all'
);

interface FormFieldProps {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper for form fields with consistent label styling
 */
export function FormField({ label, icon, children, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  wrapperClassName?: string;
}

/**
 * Styled input with optional label
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, icon, className, wrapperClassName, ...props }, ref) => {
    const input = (
      <input
        ref={ref}
        className={cn(inputBaseStyles, className)}
        {...props}
      />
    );

    if (label) {
      return (
        <FormField label={label} icon={icon} className={wrapperClassName}>
          {input}
        </FormField>
      );
    }

    return input;
  }
);
FormInput.displayName = 'FormInput';

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  icon?: ReactNode;
  wrapperClassName?: string;
}

/**
 * Styled textarea with optional label
 */
export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, icon, className, wrapperClassName, ...props }, ref) => {
    const textarea = (
      <textarea
        ref={ref}
        className={cn(inputBaseStyles, 'resize-none', className)}
        {...props}
      />
    );

    if (label) {
      return (
        <FormField label={label} icon={icon} className={wrapperClassName}>
          {textarea}
        </FormField>
      );
    }

    return textarea;
  }
);
FormTextarea.displayName = 'FormTextarea';
