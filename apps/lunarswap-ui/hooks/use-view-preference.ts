import { useEffect, useState } from 'react';

export type ViewPreference = 'horizontal' | 'vertical';

/**
 * Hook to manage and access the user's view preference setting across the application.
 *
 * Provides automatic loading from localStorage and real-time updates when the preference changes.
 * The view preference can be changed in the Global Preferences settings panel.
 *
 * - 'horizontal': Side-by-side layouts, grid views, multi-column arrangements
 * - 'vertical': Stacked layouts, list views, single-column arrangements
 */
export function useViewPreference() {
  const [viewPreference, setViewPreference] =
    useState<ViewPreference>('horizontal');

  // Load view preference from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lunarswap-view-preference');
      if (stored === 'horizontal' || stored === 'vertical') {
        setViewPreference(stored);
      }
    } catch (error) {
      console.warn('Failed to load view preference:', error);
    }
  }, []);

  // Listen for view preference changes from settings
  useEffect(() => {
    const handleViewPreferenceChange = (event: CustomEvent) => {
      setViewPreference(event.detail.preference);
    };

    window.addEventListener(
      'view-preference-changed',
      handleViewPreferenceChange as EventListener,
    );

    return () => {
      window.removeEventListener(
        'view-preference-changed',
        handleViewPreferenceChange as EventListener,
      );
    };
  }, []);

  return viewPreference;
}
