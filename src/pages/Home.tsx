import Hero from '../components/Hero';
import FeaturedHeritage from '../components/FeaturedHeritage';
import PatternScanner from '../components/PatternScanner';
import TruthGuard from '../components/TruthGuard';

export default function Home() {
  return (
    <div className="page-shell">
      <Hero />
      <FeaturedHeritage />
      <PatternScanner />
      <TruthGuard />
    </div>
  );
}
