import { ReactNode } from 'react';

export const getInitials = (name: ReactNode) => {
    if (typeof name !== 'string') return 'NA';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const initials = parts.slice(0, 2).map((part) => part[0]).join('');
    return initials ? initials.toUpperCase() : 'NA';
};
