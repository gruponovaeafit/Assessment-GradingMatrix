'use client';

import React from 'react';

// ============ SPINNER COMPONENT ============
type SpinnerPresetColor = 'white' | 'primary' | 'primary-light';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * - 'white' | 'primary' | 'primary-light': presets (como ya lo tenías)
   * - 'custom': permite pasar cualquier color/variable CSS en customColor
   */
  color?: SpinnerPresetColor | 'custom';
  customColor?: string; // <- NUEVO (ej: "var(--color-accent)")
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'white',
  customColor,
  className = '',
}) => {
  const sizeClasses: Record<NonNullable<SpinnerProps['size']>, string> = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const colorClasses: Record<SpinnerPresetColor, string> = {
    white: 'border-[color:var(--color-bg)]/30 border-t-[color:var(--color-bg)]',
    primary: 'border-[color:var(--color-accent)]/30 border-t-[color:var(--color-accent)]',
    'primary-light':
      'border-[color:var(--color-accent-light)]/30 border-t-[color:var(--color-accent-light)]',
  };

  // Si usan color="custom", se aplica customColor; si no existe, cae a primary
  const customClasses =
    customColor
      ? `border-[color:${customColor}]/30 border-t-[color:${customColor}]`
      : colorClasses.primary;

  return (
    <div
      className={`${sizeClasses[size]} ${
        color === 'custom' ? customClasses : colorClasses[color]
      } border-4 rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Cargando"
    />
  );
};

// ============ LOADING OVERLAY ============
interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Cargando...',
}) => (
  <div className="fixed inset-0 bg-[color:var(--color-bg)]/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
    <Spinner size="xl" color="primary-light" />
    <p className="mt-4 text-[color:var(--color-text)] text-lg font-medium animate-pulse">
      {message}
    </p>
  </div>
);

// ============ SKELETON COMPONENTS ============
interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div
    className={`bg-[color:var(--color-muted)]/20 rounded animate-pulse ${className}`}
    aria-hidden="true"
  />
);

// Skeleton para texto
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 1,
  className = '',
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
      />
    ))}
  </div>
);

// Skeleton para avatar/foto circular
export const SkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({
  size = 'md',
}) => {
  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };
  return <Skeleton className={`${sizes[size]} rounded-full`} />;
};

// Skeleton para card de usuario
export const SkeletonUserCard: React.FC = () => (
  <div
    className="bg-[color:var(--color-surface)]/60 backdrop-blur-sm rounded-xl p-4 flex flex-col items-center space-y-3 border border-[color:var(--color-muted)]/30"
    style={{ width: '100%', maxWidth: '360px', minHeight: '450px' }}
  >
    <SkeletonAvatar size="lg" />
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-4 w-32" />
    <div className="w-full space-y-4 mt-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
    </div>
  </div>
);

// Skeleton para tabla/row
export const SkeletonTableRow: React.FC = () => (
  <div className="flex items-center space-x-4 p-4 border-b border-white/10">
    <SkeletonAvatar size="sm" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <Skeleton className="h-8 w-20 rounded-md" />
  </div>
);

// Skeleton para dashboard card
export const SkeletonDashboardCard: React.FC = () => (
  <div
    className="bg-white rounded-lg p-4 flex flex-col items-center border border-gray-100 shadow"
    style={{ width: '100%', maxWidth: '320px', minHeight: '240px' }}
  >
    <div className="h-5 w-3/4 mb-4 bg-gray-200 rounded" />
    <div className="h-px w-full mb-4 bg-gray-100" />
    <div className="w-full space-y-2">
      <div className="h-4 w-1/4 bg-gray-200 rounded" />
      <div className="h-4 w-1/2 bg-gray-200 rounded" />
      <div className="h-4 w-2/3 bg-gray-200 rounded" />
      <div className="h-4 w-1/3 bg-gray-200 rounded" />
      <div className="h-4 w-1/2 bg-gray-200 rounded" />
    </div>
  </div>
);

// Skeleton para el panel de información base
export const SkeletonBaseInfo: React.FC = () => (
  <div className="w-full max-w-xl mb-6 sm:mb-10 px-4 sm:px-6 py-4 sm:py-6 rounded-2xl bg-[color:var(--color-surface)]/60 backdrop-blur-sm border border-[color:var(--color-muted)]/30">
    <Skeleton className="h-7 w-1/2 mx-auto mb-4" />
    <Skeleton className="h-5 w-2/3 mx-auto mb-4" />
    <SkeletonText lines={3} className="mb-6" />
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
    </div>
  </div>
);

// ============ PAGE LOADING COMPONENT ============
interface PageLoadingProps {
  message?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  message = 'Cargando...',
}) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-[color:var(--color-bg)] bg-cover bg-center">
    <Spinner size="xl" color="white" />
    <p className="mt-4 text-[color:var(--color-text)] text-xl font-medium">
      {message}
    </p>
  </div>
);

// ============ BUTTON WITH LOADING STATE ============
interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading = false,
  loadingText = 'Procesando...',
  children,
  disabled,
  className = '',
  ...props
}) => (
  <button
    disabled={disabled || isLoading}
    className={`relative flex items-center justify-center gap-2 ${className} ${
      isLoading ? 'cursor-wait' : ''
    }`}
    {...props}
  >
    {isLoading && <Spinner size="sm" />}
    <span>{isLoading ? loadingText : children}</span>
  </button>
);
