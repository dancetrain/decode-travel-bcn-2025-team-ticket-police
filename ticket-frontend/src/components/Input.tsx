import React from 'react';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
export function Input({
  label,
  error,
  className = '',
  ...props
}: InputProps) {
  return <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-neutral-700">
          {label}
        </label>}
      <input className={`w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent transition-all ${className}`} {...props} />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>;
}