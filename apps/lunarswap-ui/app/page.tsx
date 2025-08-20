'use client';

import { MoonDustBackground } from '@/components/moon-dust-background';
import { TokenCloud } from '@/components/token-cloud';
import { Header } from '@/components/header';
import { SwapCard } from '@/components/swap-card';

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function HomePage() {
  const location = useLocation();

  // Scroll to trade section when navigating from other pages
  useEffect(() => {
    if (location.hash === '#trade') {
      const tradeSection = document.getElementById('trade');
      if (tradeSection) {
        tradeSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-b dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] text-foreground">
      <MoonDustBackground />
      <Header />
      
      {/* Hero Section with TokenCloud background */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-16">
        {/* TokenCloud background only for the hero section */}
        <div className="absolute inset-0">
          <TokenCloud />
        </div>
        
        {/* Hero content */}
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight text-gray-900 dark:text-white">
            Swap anytime, anywhere on{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Midnight Network
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            Experience the future of decentralized trading with zero-knowledge proofs and complete privacy
          </p>
          
          {/* Preview Swap Card */}
          <div className="mt-8 max-w-sm mx-auto">
            <SwapCard previewMode />
          </div>
        </div>
      </section>
    </div>
  );
}
