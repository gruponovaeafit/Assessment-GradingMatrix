'use client';

import React from 'react';
import { useState, useCallback } from 'react';
import { Button, ButtonProps } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'info';
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
}) => {
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
        <p className="text-[color:var(--color-muted)] mb-6">{message}</p>
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
            onClick={onConfirm}
            loading={isLoading}
            disabled={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

interface UseConfirmModalOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function useConfirmModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<UseConfirmModalOptions>({
    title: '',
    message: '',
  });
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: UseConfirmModalOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);

    return new Promise((resolve) => {
      setResolveRef(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef?.(true);
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
