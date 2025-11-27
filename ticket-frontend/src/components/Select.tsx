import React from 'react';
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: {
    value: string;
    label: string;
  }[];
}
export function Select({
  label,
  options,
  className = '',
  ...props
}: SelectProps) {
  return <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-neutral-700">
          {label}
        </label>}
      <select className={`w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent transition-all ${className}`} {...props}>
        {options.map(option => <option key={option.value} value={option.value}>
            {option.label}
          </option>)}
      </select>
    </div>;
}