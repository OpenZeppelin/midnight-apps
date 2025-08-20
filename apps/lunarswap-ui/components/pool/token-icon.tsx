import React from 'react';
import { getTokenDetails } from '../../lib/token-utils';

interface TokenIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

export function TokenIcon({
  symbol,
  size = 20,
  className = '',
}: TokenIconProps) {
  const tokenDetails = getTokenDetails(symbol);

  if (!tokenDetails) {
    // Fallback to colored circle if token not found
    return (
      <div
        className={`rounded-full bg-gray-500 flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-white text-xs font-bold">{symbol.charAt(0)}</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <TokenIcon symbol={tokenDetails.symbol} size={size} />
    </div>
  );
}
