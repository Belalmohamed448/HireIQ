import type { ChangeEvent } from "react";

interface InputProps {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;

  error?: string;
  helperText?: string;
  autoFocus?: boolean;
}

export default function Input({
  id,
  label,
  type,
  placeholder,
  value,
  onChange,
  error = "",
  helperText = "",
  autoFocus = false,
}: InputProps) {
  return (
    <div className="mt-5">
      <label
        htmlFor={id}
        className="block mb-2 font-medium text-gray-700"
      >
        {label}
      </label>

      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        autoFocus={autoFocus}
        onChange={onChange}
        className={`w-full rounded-lg p-3 border transition-all duration-200
        focus:outline-none focus:ring-2
        ${
          error
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:ring-blue-500"
        }`}
      />

      {error ? (
        <p className="mt-2 text-sm text-red-600 font-medium">
          {error}
        </p>
      ) : helperText ? (
        <p className="mt-2 text-xs text-gray-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}