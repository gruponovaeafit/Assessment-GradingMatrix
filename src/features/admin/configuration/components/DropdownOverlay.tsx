import React, { useEffect } from 'react';
import { Button } from '@/components/UI/Button';
import { notify } from '@/components/UI/Notification';

interface DropdownOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  wide?: boolean;
  cancelNotifyTitle?: string;
  cancelNotifySubtitle?: string;
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
  cancelNotifyTitle = "Accion cancelada",
  cancelNotifySubtitle = "No se realizaron cambios",
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCancel = () => {
    notify({
      title: cancelNotifyTitle,
      titleColor: 'var(--error)',
      subtitle: cancelNotifySubtitle,
      subtitleColor: 'var(--color-muted)',
      borderColor: 'var(--error)',
      duration: 3000,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <Button variant="error" onClick={handleCancel} className="!px-3 !py-1 text-base font-bold">
            X
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer — siempre visible */}
        <div className="p-6 border-t border-gray-100 flex gap-4">
          <Button variant="error" onClick={handleCancel} className="flex-1">
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