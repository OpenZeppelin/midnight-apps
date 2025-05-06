'use client';

import { useEffect, useRef } from 'react';

interface PriceRangeChartProps {
  minPrice: number;
  maxPrice: number;
  currentPrice: number;
}

export function PriceRangeChart({
  minPrice,
  maxPrice,
  currentPrice,
}: PriceRangeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const padding = 20;

    // Calculate positions
    const minX = padding;
    const maxX = width - padding;
    const rangeWidth = maxX - minX;

    // Price range is from 0 to 2 times the current price
    const priceScale = 2 * currentPrice;

    // Calculate positions for min, max and current price
    const minPriceX = minX + (minPrice / priceScale) * rangeWidth;
    const maxPriceX = minX + (maxPrice / priceScale) * rangeWidth;
    const currentPriceX = minX + (currentPrice / priceScale) * rangeWidth;

    // Draw background
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#f3f4f6'); // Light gray
    gradient.addColorStop(1, '#f3f4f6'); // Light gray

    ctx.fillStyle = gradient;
    ctx.fillRect(minX, padding, rangeWidth, height - padding * 2);

    // Draw selected range
    const rangeGradient = ctx.createLinearGradient(minPriceX, 0, maxPriceX, 0);
    rangeGradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)'); // Light blue
    rangeGradient.addColorStop(1, 'rgba(99, 102, 241, 0.2)'); // Light indigo

    ctx.fillStyle = rangeGradient;
    ctx.fillRect(
      minPriceX,
      padding,
      maxPriceX - minPriceX,
      height - padding * 2,
    );

    // Draw border for selected range
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      minPriceX,
      padding,
      maxPriceX - minPriceX,
      height - padding * 2,
    );

    // Draw current price line
    ctx.beginPath();
    ctx.moveTo(currentPriceX, padding);
    ctx.lineTo(currentPriceX, height - padding);
    ctx.strokeStyle = '#ef4444'; // Red
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw labels
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';

    // Min price label
    ctx.fillStyle = '#6b7280'; // Gray
    ctx.fillText(`$${minPrice}`, minPriceX, height - 5);

    // Max price label
    ctx.fillText(`$${maxPrice}`, maxPriceX, height - 5);

    // Current price label
    ctx.fillStyle = '#ef4444'; // Red
    ctx.fillText(`Current: $${currentPrice}`, currentPriceX, padding - 5);

    // Draw title
    ctx.fillStyle = '#111827'; // Dark gray
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Price Range', width / 2, 15);
  }, [minPrice, maxPrice, currentPrice]);

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
}
