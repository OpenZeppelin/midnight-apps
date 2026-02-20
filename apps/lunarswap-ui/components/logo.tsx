'use client';

import { ExternalLink, Github } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function Logo({ size = 36, className = '' }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseEnter = () => {
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    // Add a small delay to allow moving to the dropdown
    setTimeout(() => {
      setIsDropdownOpen(false);
    }, 100);
  };

  const links = [
    {
      label: 'GitHub',
      href: 'https://github.com/OpenZeppelin/midnight-dapps',
      icon: <Github className="h-4 w-4" />,
    },
  ];

  return (
    // biome-ignore lint/a11y/useSemanticElements: fieldset is for forms; div with role=group is correct for dropdown
    <div
      role="group"
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={dropdownRef}
    >
      <div className="flex items-center gap-2 cursor-pointer group">
        <div className="relative">
          <img
            src="/logo.svg"
            alt="Lunarswap Logo"
            width={size}
            height={size}
            className={className}
          />
        </div>
        <span className="font-bold text-xl bg-gradient-to-r from-gray-800 to-blue-600 dark:from-gray-300 dark:to-blue-400 bg-clip-text text-transparent tracking-tight">
          Lunarswap
        </span>
        <div className="w-2 h-2 border-l-2 border-b-2 border-gray-600 dark:border-gray-400 transform -rotate-45 group-hover:border-blue-500 dark:group-hover:border-blue-400 transition-colors" />
      </div>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <>
          {/* Invisible bridge to prevent dropdown from closing */}
          <div className="absolute top-full left-0 w-full h-2 bg-transparent" />
          <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {link.icon}
                <span>{link.label}</span>
                <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
