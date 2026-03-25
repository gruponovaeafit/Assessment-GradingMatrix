"use client";
import React, { useState } from "react";
import { InputBox } from "./InputBox";

type EmailInputProps = {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  onValidationChange?: (isValid: boolean) => void;
};

export const validateEmail = (email: string): boolean => {
  // Robust Regex: No spaces, must have @, must have domain with at least 2 chars extension
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

export const EmailInput = ({
  label,
  placeholder = "ejemplo@dominio.com",
  value,
  onChange,
  disabled = false,
  error: externalError,
  onValidationChange,
}: EmailInputProps) => {
  const [isTouched, setIsTouched] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Remove all whitespace
    const newValue = e.target.value.replace(/\s/g, "");
    onChange(newValue);
    
    if (onValidationChange) {
      onValidationChange(validateEmail(newValue));
    }
  };

  const handleBlur = () => {
    setIsTouched(true);
  };

  // Determine error to show:
  // 1. External error (passed from parent)
  // 2. Internal validation error (if touched and invalid)
  const isInvalid = value.length > 0 && !validateEmail(value);
  const internalError = isTouched && isInvalid ? "Por favor ingresa un correo válido (ej: texto@texto.com)" : undefined;
  const errorToShow = externalError || internalError;

  return (
    <InputBox
      label={label}
      type="email"
      placeholder={placeholder}
      value={value}
      onChange={handleInputChange}
      disabled={disabled}
      error={errorToShow}
      // @ts-ignore - Adding onBlur to InputBox or handling it here
      onBlur={handleBlur}
    />
  );
};
