import React from 'react';
import Hero from '../components/Hero';
import PatternScanner from '../components/PatternScanner';
import TruthGuard from '../components/TruthGuard';

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      <Hero />
      <PatternScanner />
      <TruthGuard />
    </div>
  );
}
