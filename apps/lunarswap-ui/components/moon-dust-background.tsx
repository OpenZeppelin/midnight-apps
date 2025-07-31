'use client';

import React, { useEffect, useRef, useState } from 'react';

export function MoonDustBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDark, setIsDark] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  // Listen for theme changes
  useEffect(() => {
    const checkTheme = () => {
      const darkMode = document.documentElement.classList.contains('dark');
      setIsDark(darkMode);
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

  // Listen for animation settings changes
  useEffect(() => {
    // Load initial setting from localStorage
    const loadAnimationSetting = () => {
      try {
        const stored = localStorage.getItem('lunarswap-animations-enabled');
        if (stored !== null) {
          setAnimationsEnabled(JSON.parse(stored));
        }
      } catch (error) {
        console.warn('Failed to load animation settings:', error);
      }
    };

    loadAnimationSetting();

    // Listen for animation toggle events
    const handleAnimationToggle = (event: CustomEvent) => {
      setAnimationsEnabled(event.detail.enabled);
    };

    window.addEventListener(
      'animations-toggled',
      handleAnimationToggle as EventListener,
    );

    return () => {
      window.removeEventListener(
        'animations-toggled',
        handleAnimationToggle as EventListener,
      );
    };
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

    // Create floating dust particles
    const particles: {
      x: number;
      y: number;
      radius: number;
      opacity: number;
      speed: number;
      direction: number;
    }[] = [];

    const createParticles = () => {
      particles.length = 0;

      // Moon dust particles for light mode
      const dustCount = Math.floor((canvas.width * canvas.height) / 4000);

      for (let i = 0; i < dustCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5 + 0.5, // Visible particles
          opacity: Math.random() * 0.3 + 0.2, // More visible
          speed: Math.random() * 0.05 + 0.01, // Gentle movement
          direction: Math.random() * Math.PI * 2,
        });
      }
    };

    createParticles();
    window.addEventListener('resize', createParticles);

    // Animation loop
    let animationFrame: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Only animate if animations are enabled
      if (animationsEnabled) {
        // Animate particles
        for (const dust of particles) {
          ctx.beginPath();
          ctx.arc(dust.x, dust.y, dust.radius, 0, Math.PI * 2);

          // Light particles with subtle blue/gray tint
          ctx.fillStyle = `rgba(100, 116, 139, ${dust.opacity})`;
          ctx.fill();

          // Floating movement
          dust.x += Math.cos(dust.direction) * dust.speed;
          dust.y += Math.sin(dust.direction) * dust.speed;

          // Change direction for organic movement
          dust.direction += (Math.random() - 0.5) * 0.02;

          // Wrap around screen edges
          if (dust.x > canvas.width) dust.x = 0;
          if (dust.x < 0) dust.x = canvas.width;
          if (dust.y > canvas.height) dust.y = 0;
          if (dust.y < 0) dust.y = canvas.height;

          // Fade in and out
          dust.opacity += (Math.random() - 0.5) * 0.002;
          dust.opacity = Math.max(0.1, Math.min(0.5, dust.opacity));
        }
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasDimensions);
      window.removeEventListener('resize', createParticles);
      cancelAnimationFrame(animationFrame);
    };
  }, [animationsEnabled]);

  // Only render in light mode
  if (isDark) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-50"
    />
  );
}
