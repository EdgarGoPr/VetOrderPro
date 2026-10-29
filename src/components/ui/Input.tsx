import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full bg-white border rounded-lg px-3.5 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1f4e38]/30 transition-all ${
          error ? 'border-rose-400 focus:border-rose-500' : 'border-stone-300 focus:border-[#1f4e38]'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-stone-500 mt-1">{helperText}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options,
  children,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full bg-white border rounded-lg px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#1f4e38]/30 transition-all ${
          error ? 'border-rose-400 focus:border-rose-500' : 'border-stone-300 focus:border-[#1f4e38]'
        } ${className}`}
        {...props}
      >
        {options
          ? options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error && <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-stone-500 mt-1">{helperText}</p>}
    </div>
  );
};
