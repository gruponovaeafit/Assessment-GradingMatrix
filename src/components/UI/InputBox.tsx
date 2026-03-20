"use client";
import React, { useState } from "react";

type InputBoxProps = {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
};

const EyeOpenIcon = () => (
  <svg viewBox="0 0 27.3 17.93" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
    <path
      fill="#A855F7"
      d="M13.65,4.93c3.87,0,7,2.91,7,6.5s-3.13,6.5-7,6.5-7-2.91-7-6.5,3.13-6.5,7-6.5ZM13.65,7.93c-2.42,0-4,1.77-4,3.5s1.58,3.5,4,3.5,4-1.77,4-3.5-1.58-3.5-4-3.5Z"
    />
    <path
      fill="#A855F7"
      d="M13.65,0c6.66,0,12.24,2.99,13.65,7h-3.36c-.43-.61-1.08-1.24-2.01-1.84-1.98-1.27-4.9-2.16-8.28-2.16s-6.3.89-8.28,2.16c-.93.6-1.58,1.23-2.01,1.84H0C1.41,2.99,6.99,0,13.65,0Z"
    />
  </svg>
);

const EyeClosedIcon = () => (
  <svg viewBox="0 0 27.3 7" xmlns="http://www.w3.org/2000/svg" width="24" height="10">
    <path
      fill="#A855F7"
      d="M13.65,7c6.66,0,12.24-2.99,13.65-7h-3.36c-.43.61-1.08,1.24-2.01,1.84-1.98,1.27-4.9,2.16-8.28,2.16s-6.3-.89-8.28-2.16c-.93-.6-1.58-1.23-2.01-1.84H0c1.41,4.01,6.99,7,13.65,7Z"
    />
  </svg>
);

export const InputBox = ({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  disabled = false,
}: InputBoxProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="w-full flex flex-col gap-1">
      <label className="text-base font-semibold text-gray-700">
        {label}
      </label>

      <div className="relative w-full">
        <input
          type={isPassword && showPassword ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="
            w-full px-4 py-3 pr-12 rounded-lg
            bg-white border border-gray-300
            text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-purple-400
            disabled:opacity-50
          "
        />

        {isPassword && (
          <button
          type="button"
          onClick={() => setShowPassword(prev => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 bg-transparent border-none outline-none p-0"
          >
            {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
          </button>
        )}
      </div>
    </div>
  );
};