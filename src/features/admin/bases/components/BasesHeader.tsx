import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/UI/Button';

interface BasesHeaderProps {
  onAdmin: () => void;
  onLogout: () => void;
}

export const BasesHeader: React.FC<BasesHeaderProps> = ({ onAdmin, onLogout }) => {
  return (
    <div className="w-full max-w-[1200px] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 px-1 sm:px-2">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[color:var(--color-accent)]">
        Gestión de Bases
      </h1>
      <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
        <Button variant="accent" onClick={onAdmin}>
          <Image src="/HomeIcon.svg" alt="" width={18} height={18} className="mr-2" />
          Menú principal
        </Button>
        <Button variant="error" onClick={onLogout}>
          <Image src="/LogoutIcon.svg" alt="" width={18} height={18} className="mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
};