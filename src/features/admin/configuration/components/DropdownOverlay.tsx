import React, { useEffect } from 'react';
import { Button } from '@/components/UI/Button';

interface DropdownOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  wide?: boolean;
}

export const DropdownOverlay: React.FC<DropdownOverlayProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmLabel = "Confirmar",
  confirmDisabled = false,
  wide = false,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <Button variant="error" onClick={onClose} className="!px-3 !py-1 text-base font-bold">
            X
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer — siempre visible */}
        <div className="p-6 border-t border-gray-100 flex gap-4">
          <Button variant="error" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          {onConfirm && (
            <Button
              variant="accent"
              onClick={onConfirm}
              disabled={confirmDisabled}
              loading={confirmDisabled}
              className="flex-1"
            >
              {confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
