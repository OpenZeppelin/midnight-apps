'use client';

import { useEffect } from 'react';

export function ThemeScript() {
  useEffect(() => {
    // This script runs on the client side after hydration
    const initializeTheme = () => {
      const isDarkMode = window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches;
      const storedTheme = localStorage.getItem('theme');

      if (storedTheme === 'dark' || (!storedTheme && isDarkMode)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    initializeTheme();

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if there's no stored preference
      if (!localStorage.getItem('theme')) {
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return null;
}
