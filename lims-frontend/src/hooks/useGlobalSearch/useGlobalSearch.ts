'use client';

import { useEffect, useCallback } from 'react';
import { useSearchStore } from '@/store/search.store';

/**
 * Hook for global keyboard shortcuts (Cmd+K / Ctrl+K)
 */
export function useGlobalSearchShortcut() {
    const { toggleModal, isOpen, closeModal } = useSearchStore();

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            // Cmd+K (Mac) or Ctrl+K (Windows)
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                toggleModal();
            }

            // Escape to close
            if (e.key === 'Escape' && isOpen) {
                closeModal();
            }
        },
        [toggleModal, isOpen, closeModal]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);
}

/**
 * Get keyboard shortcut display text based on OS
 */
export function getShortcutKey(): string {
    if (typeof window === 'undefined') return '⌘K';

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    return isMac ? '⌘K' : 'Ctrl+K';
}
