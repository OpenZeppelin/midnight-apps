'use client';

import React from 'react';

interface TokenIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

export function TokenIcon({ symbol, size = 24, className = '' }: TokenIconProps) {
  // Validate symbol parameter
  if (!symbol || typeof symbol !== 'string') {
    symbol = 'UNKNOWN';
  }

  // Special handling for tDust token
  if (symbol === 'tDUST') {
    return (
      <img
        src="/tDust-icon.svg"
        alt="tDust"
        className={className}
        style={{
          width: size,
          height: size,
        }}
      />
    );
  }

  // Generate deterministic color based on token symbol
  const generateColor = (symbol: string): string => {
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      const char = symbol.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Generate hue, saturation, and lightness from hash
    const hue = Math.abs(hash) % 360;
    const saturation = 60 + (Math.abs(hash) % 20); // 60-80%
    const lightness = 45 + (Math.abs(hash) % 15); // 45-60%
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // Format token symbol: if starts with 'T', make it lowercase 't', rest uppercase
  const formatSymbol = (symbol: string): string => {
    if (symbol.startsWith('t')) {
      return `t${symbol.slice(1).toUpperCase()}`;
    }
    return symbol.toUpperCase();
  };

  const backgroundColor = generateColor(symbol);
  const formattedSymbol = formatSymbol(symbol);
  const fontSize = Math.max(size * 0.4, 10); // Responsive font size

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-white ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor,
        fontSize: `${fontSize}px`,
        lineHeight: 1,
      }}
    >
      {formattedSymbol}
    </div>
  );
} 