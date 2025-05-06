'use client';

import { useEffect, useRef, useState } from 'react';

export function StarsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDark, setIsDark] = useState(true);

  // Listen for theme changes
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    // Initial check
    checkTheme();

    // Set up a mutation observer to watch for class changes on the html element
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasDimensions();
    window.addEventListener('resize', setCanvasDimensions);

    // Create stars
    const stars: {
      x: number;
      y: number;
      radius: number;
      opacity: number;
      speed: number;
    }[] = [];
    const createStars = () => {
      stars.length = 0;
      const starCount = Math.floor((canvas.width * canvas.height) / 3000);

      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5,
          opacity: Math.random() * 0.8 + 0.2,
          speed: Math.random() * 0.05,
        });
      }
    };

    createStars();
    window.addEventListener('resize', createStars);

    // Animation loop
    let animationFrame: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      for (const star of stars) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(255, 255, 255, ${star.opacity})`
          : `rgba(0, 0, 50, ${star.opacity * 0.3})`;
        ctx.fill();

        // Move star
        star.y += star.speed;

        // Reset if off‐screen
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasDimensions);
      window.removeEventListener('resize', createStars);
      cancelAnimationFrame(animationFrame);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-10 dark:opacity-40"
    />
  );
}
