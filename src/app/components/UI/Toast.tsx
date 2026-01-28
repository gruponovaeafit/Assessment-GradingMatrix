'use client';

import { Toaster, toast } from 'react-hot-toast';

// Re-exportar toast para uso en componentes
export { toast };

// Componente Toaster configurado
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          maxWidth: '400px',
          border: '1px solid var(--color-muted)',
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: 'var(--color-success)',
            secondary: 'var(--color-surface)',
          },
          style: {
            background: 'var(--color-success-bg, #064e3b)',
            border: '1px solid var(--color-success, #22C55E)',
            color: 'var(--color-success-text, #fff)',
          },
        },
        error: {
          duration: 5000,
          iconTheme: {
            primary: 'var(--color-error)',
            secondary: 'var(--color-surface)',
          },
          style: {
            background: 'var(--color-error-bg, #450a0a)',
            border: '1px solid var(--color-error, #EF4444)',
            color: 'var(--color-error-text, #fff)',
          },
        },
        loading: {
          iconTheme: {
            primary: 'var(--color-accent)',
            secondary: 'var(--color-surface)',
          },
          style: {
            background: 'var(--color-accent-bg, #2E1065)',
            border: '1px solid var(--color-accent, #7C3AED)',
            color: 'var(--color-accent-text, #fff)',
          },
        },
      }}
    />
  );
}

// Helpers para toasts comunes
export const showToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  loading: (message: string) => toast.loading(message),
  
  // Toast con promesa (para async operations)
  promise: <T,>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string }
  ) => toast.promise(promise, messages),
  
  // Dismiss específico
  dismiss: (id?: string) => toast.dismiss(id),
};
