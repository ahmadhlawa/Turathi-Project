import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { heritageData } from '../data/heritage';
import HeritageCard from './HeritageCard';
import { Section } from './ui';

export default function FeaturedHeritage() {
  const featured = heritageData.slice(0, 3);

  return (
    <Section
      title="مجموعة التراث البارزة"
      subtitle="مختارات من الأزياء والحرف والرموز التي تشكّل جزءاً من الذاكرة الفلسطينية اليومية."
    >
      <div className="turathi-grid">
        {featured.map((item) => (
          <HeritageCard item={item} key={item.id} />
        ))}
      </div>

      <div className="section-action">
        <Link to="/explore" className="ui-button ui-button--primary">
          <ArrowLeft size={18} aria-hidden="true" />
          <span>تصفح المجموعة الكاملة</span>
        </Link>
      </div>
    </Section>
  );
}
