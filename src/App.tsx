/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PatternScanner from './components/PatternScanner';
import TruthGuard from './components/TruthGuard';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col font-cairo bg-bg-base text-text-primary">
      <Navbar />
      
      <main className="flex-1">
        <Hero />
        <PatternScanner />
        <TruthGuard />
      </main>

      <Footer />
    </div>
  );
}
