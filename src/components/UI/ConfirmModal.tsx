'use client';

import React from 'react';
import { useState, useCallback } from 'react';
import { Button, ButtonProps } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (inputValue?: string) => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'info';
  // Input Support
  showInput?: boolean;
  inputPlaceholder?: string;
  inputType?: 'text' | 'password';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
  variant = 'info',
  showInput = false,
  inputPlaceholder = 'Escribe aquí...',
  inputType = 'text',
}) => {
  const [inputValue, setInputValue] = useState('');
  
  // Reset input value when modal closes/opens
  React.useEffect(() => {
    if (!isOpen) setInputValue('');
  }, [isOpen]);

  if (!isOpen) return null;

  const variantStyles: Record<string, {
    icon: string;
    confirmVariant: ButtonProps['variant'];
    border: string;
  }> = {
    danger: {
      icon: '⚠️',
      confirmVariant: 'error',
      border: 'border-[color:var(--color-error)]/50',
    },
    warning: {
      icon: '⚡',
      confirmVariant: 'accent',
      border: 'border-yellow-500/50',
    },
    info: {
      icon: '📋',
      confirmVariant: 'accent',
      border: 'border-[color:var(--color-accent)]/50',
    },
  };
  const styles = variantStyles[variant];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={`relative bg-[color:var(--color-surface)] rounded-xl p-6 w-full max-w-md border ${styles.border} shadow-2xl animate-scaleIn`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{styles.icon}</span>
          <h3 className="text-xl font-bold text-[color:var(--color-text)]">{title}</h3>
        </div>
        <div className="text-[color:var(--color-text)]/70 mb-6 text-sm">{message}</div>
        
        {showInput && (
          <div className="mb-6">
            <input
              type={inputType}
              placeholder={inputPlaceholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[color:var(--color-accent)] outline-none text-gray-900 placeholder-gray-400"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inputValue && !isLoading) onConfirm(inputValue);
              }}
            />
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={styles.confirmVariant}
            onClick={() => onConfirm(showInput ? inputValue : undefined)}
            loading={isLoading}
            disabled={isLoading || (showInput && !inputValue)}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export interface UseConfirmModalOptions {
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  showInput?: boolean;
  inputPlaceholder?: string;
  inputType?: 'text' | 'password';
}

export function useConfirmModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<UseConfirmModalOptions>({
    title: '',
    message: '',
  });
  const [resolveRef, setResolveRef] = useState<((value: string | boolean) => void) | null>(null);

  const confirm = useCallback((opts: UseConfirmModalOptions): Promise<string | boolean> => {
    setOptions(opts);
    setIsOpen(true);

    return new Promise((resolve) => {
      setResolveRef(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback((value?: string) => {
    // If input was shown, return the value as string, otherwise true as boolean
    resolveRef?.(value !== undefined ? value : true);
    setIsOpen(false);
    setResolveRef(null);
  }, [resolveRef]);

  const handleClose = useCallback(() => {
    resolveRef?.(false);
    setIsOpen(false);
    setResolveRef(null);
  }, [resolveRef]);

  const ConfirmModalComponent = () => (
    <ConfirmModal
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      isLoading={isLoading}
      {...options}
    />
  );

  return {
    confirm,
    setIsLoading,
    ConfirmModalComponent,
  };
}
