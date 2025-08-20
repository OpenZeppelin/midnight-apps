'use client';

import { popularTokens } from '@/lib/token-config';
import { TokenIcon } from '@/components/token-icon';
import { useState, useMemo } from 'react';

interface Blob {
  className: string;
  size: number;
  top: number;
  left: number;
  symbol: string;
}

export function TokenCloud() {
  const [hoveredBlob, setHoveredBlob] = useState<number | null>(null);

  // Generate static positions for blobs
  const blobs: Blob[] = useMemo(() => {
    const symbols = popularTokens.map(token => token.symbol);
    const colors = [
      'bg-blue-400/20', 'bg-green-400/20', 'bg-yellow-400/20', 'bg-purple-400/20',
      'bg-red-400/20', 'bg-indigo-400/20', 'bg-pink-400/20', 'bg-cyan-400/20',
      'bg-orange-400/20', 'bg-teal-400/20', 'bg-lime-400/20', 'bg-rose-400/20'
    ];
    
    const generatedBlobs: Blob[] = [];
    
    // Generate 12-15 static blobs
    for (let i = 0; i < 15; i++) {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      generatedBlobs.push({
        className: color,
        size: Math.random() * 60 + 60, // 60-120px (bigger tokens)
        top: Math.random() * 80, // 0-80% (scattered across the page)
        left: Math.random() * 80 + 10, // 10-90% (spread horizontally)
        symbol,
      });
    }
    
    return generatedBlobs;
  }, []);

  // Get token details for display
  const getTokenDetails = (symbol: string) => {
    return popularTokens.find(token => token.symbol === symbol);
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      {blobs.map((b, idx) => {
        const tokenDetails = getTokenDetails(b.symbol);
        const isHovered = hoveredBlob === idx;
        
        return (
          <div
            key={`blob-${b.symbol}-${b.size}-${b.top}-${b.left}`}
            className="absolute"
            style={{
              top: `${b.top}%`,
              left: `${b.left}%`,
              zIndex: Math.floor(Math.random() * 10), // Random z-index for depth
            }}
          >
            {/* Static blob */}
            <div
              className={`absolute rounded-full ${b.className} transition-all duration-1000`}
              style={{
                width: b.size,
                height: b.size,
                filter: isHovered ? 'blur(0px)' : 'blur(4px)',
              }}
            >
              {/* Token icon overlay for visual reference */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className="relative cursor-pointer"
                  onMouseEnter={() => setHoveredBlob(idx)}
                  onMouseLeave={() => setHoveredBlob(null)}
                >
                  <TokenIcon 
                    symbol={b.symbol} 
                    size={Math.floor(b.size * 0.75)} 
                    className={`transition-opacity duration-1000 ${isHovered ? 'opacity-100' : 'opacity-50'}`}
                  />
                </div>
              </div>

              {/* Hover tooltip */}
              <div className={`absolute -bottom-12 left-1/2 transform -translate-x-1/2 transition-opacity duration-1000 pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                <div className="bg-black/80 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap backdrop-blur-sm">
                  <div className="font-bold">{tokenDetails?.name || b.symbol}</div>
                  <div className="text-xs text-gray-300">{b.symbol}</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
