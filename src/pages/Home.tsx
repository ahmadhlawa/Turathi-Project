import React from 'react';
import Hero from '../components/Hero';
import FeaturedHeritage from '../components/FeaturedHeritage';
import PatternScanner from '../components/PatternScanner';
import TruthGuard from '../components/TruthGuard';

export default function Home() {
  return (
    <div className="flex flex-col flex-1 h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth">
      <div className="snap-start shrink-0">
        <Hero />
      </div>
      <div className="snap-start shrink-0 min-h-[100dvh] flex flex-col justify-center">
        <FeaturedHeritage />
      </div>
      <PatternScanner />
      <TruthGuard />
    </div>
  );
}
