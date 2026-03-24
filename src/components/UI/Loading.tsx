'use client';

import React from 'react';

type SpinnerPresetColor = 'white' | 'primary' | 'primary-light';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: SpinnerPresetColor | 'custom';
  customColor?: string;
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

interface SkeletonProps {
  className?: string;
  index?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', index = 0 }) => (
  <div
    className={`animate-shimmer rounded ${className}`}
    style={{ animationDelay: `-${index * 150}ms` }}
    aria-hidden="true"
  />
);

export const SkeletonText: React.FC<{ lines?: number; className?: string; index?: number }> = ({
  lines = 1,
  className = '',
  index = 0,
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        index={index + i}
        className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
      />
    ))}
  </div>
);

export const SkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg'; index?: number }> = ({
  size = 'md',
  index = 0,
}) => {
  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };
  return <Skeleton index={index} className={`${sizes[size]} rounded-full`} />;
};

export const SkeletonUserCard: React.FC<{ index?: number }> = ({ index = 0 }) => (
  <div
    className="bg-[color:var(--color-surface)]/60 backdrop-blur-sm rounded-xl p-4 flex flex-col items-center space-y-3 border border-[color:var(--color-muted)]/30"
    style={{ width: '100%', maxWidth: '360px', minHeight: '450px' }}
  >
    <SkeletonAvatar size="lg" index={index} />
    <Skeleton index={index + 1} className="h-4 w-20" />
    <Skeleton index={index + 2} className="h-4 w-32" />
    <div className="w-full space-y-4 mt-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton index={index + 2 + i} className="h-3 w-full" />
          <Skeleton index={index + 3 + i} className="h-10 w-full rounded-md" />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonTableRow: React.FC<{ index?: number }> = ({ index = 0 }) => (
  <div className="flex items-center space-x-4 p-4 border-b border-gray-100">
    <SkeletonAvatar size="sm" index={index} />
    <div className="flex-1 space-y-2">
      <Skeleton index={index + 1} className="h-4 w-1/3" />
      <Skeleton index={index + 2} className="h-3 w-1/2" />
    </div>
    <Skeleton index={index + 3} className="h-8 w-20 rounded-md" />
  </div>
);

export const SkeletonDashboardCard: React.FC<{ index?: number }> = ({ index = 0 }) => (
  <div
    className="bg-white rounded-lg p-4 flex flex-col items-center border border-gray-100 shadow"
    style={{ width: '100%', maxWidth: '320px', minHeight: '240px' }}
  >
    <Skeleton index={index} className="h-5 w-3/4 mb-4" />
    <div className="h-px w-full mb-4 bg-gray-100" />
    <div className="w-full space-y-2">
      <Skeleton index={index + 1} className="h-4 w-1/4" />
      <Skeleton index={index + 2} className="h-4 w-1/2" />
      <Skeleton index={index + 3} className="h-4 w-2/3" />
      <Skeleton index={index + 4} className="h-4 w-1/3" />
      <Skeleton index={index + 5} className="h-4 w-1/2" />
    </div>
  </div>
);

export const SkeletonBaseInfo: React.FC<{ index?: number }> = ({ index = 0 }) => (
  <div className="w-full max-w-xl mb-6 sm:mb-10 px-4 sm:px-6 py-4 sm:py-6 rounded-2xl bg-[color:var(--color-surface)]/60 backdrop-blur-sm border border-[color:var(--color-muted)]/30">
    <Skeleton index={index} className="h-7 w-1/2 mx-auto mb-4" />
    <Skeleton index={index + 1} className="h-5 w-2/3 mx-auto mb-4" />
    <SkeletonText lines={3} className="mb-6" index={index + 2} />
    <div className="space-y-3">
      <Skeleton index={index + 5} className="h-4 w-full" />
      <Skeleton index={index + 6} className="h-4 w-full" />
      <Skeleton index={index + 7} className="h-4 w-full" />
    </div>
  </div>
);

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

/**
 * BrandedLoading - A more creative and visually appealing loading screen
 * for critical auth checks and initial data fetching.
 */
export const BrandedLoading: React.FC<{ message?: string }> = ({ 
  message = "Asegurando tu sesión..." 
}) => (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white overflow-hidden">
    {/* Fondo decorativo con gradientes suaves */}
    <div className="absolute top-[-10%] -left-[10%] w-[40%] h-[40%] bg-purple-100 rounded-full blur-[120px] opacity-60 animate-pulse" />
    <div className="absolute bottom-[-10%] -right-[10%] w-[40%] h-[40%] bg-purple-50 rounded-full blur-[120px] opacity-60 animate-pulse" style={{ animationDelay: '1s' }} />

    <div className="relative flex flex-col items-center">
      {/* Animación central creativa */}
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 border-4 border-purple-100 rounded-full" />
        <div className="absolute inset-0 border-4 border-t-purple-600 rounded-full animate-spin" />
        <div className="absolute inset-4 border-4 border-t-purple-400 rounded-full animate-spin-slow opacity-60" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-ping" />
        </div>
      </div>

      {/* Texto con mejor contraste y tipografía */}
      <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
        {message}
      </h2>
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>

    {/* Estilo CSS in-line para la animación lenta si no existe en tailwind */}
    <style jsx global>{`
      @keyframes spin-slow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .animate-spin-slow {
        animation: spin-slow linear infinite;
      }
    `}</style>
  </div>
);

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
