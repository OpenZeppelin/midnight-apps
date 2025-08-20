import React from 'react';
import { TokenIcon } from '@/components/token-icon';
import { getTokenDetails } from '../../lib/token-utils';

interface SplitTokenIconProps {
  tokenASymbol: string;
  tokenBSymbol: string;
  size?: number;
  className?: string;
}

export function SplitTokenIcon({
  tokenASymbol,
  tokenBSymbol,
  size = 32,
  className = '',
}: SplitTokenIconProps) {
  const tokenADetails = getTokenDetails(tokenASymbol);
  const tokenBDetails = getTokenDetails(tokenBSymbol);

  return (
    <div
      className={`relative rounded-full overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Left half - Token A */}
      <div className="absolute top-0 left-0 w-1/2 h-full overflow-hidden">
        {tokenADetails ? (
          <div
            className="relative"
            style={{ width: size, height: size, marginLeft: 0 }}
          >
            <TokenIcon symbol={tokenADetails.symbol} size={size} />
          </div>
        ) : (
          <div className="w-full h-full bg-gray-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {tokenASymbol.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Right half - Token B */}
      <div className="absolute top-0 right-0 w-1/2 h-full overflow-hidden">
        {tokenBDetails ? (
          <div
            className="relative"
            style={{ width: size, height: size, marginLeft: `-${size / 2}px` }}
          >
            <TokenIcon symbol={tokenBDetails.symbol} size={size} />
          </div>
        ) : (
          <div className="w-full h-full bg-gray-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {tokenBSymbol.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Gap in the middle */}
      <div
        className="absolute top-0 left-1/2 w-px h-full bg-white/20 transform -translate-x-1/2"
        style={{ width: '8px' }}
      />
    </div>
  );
}
