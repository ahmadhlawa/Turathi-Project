import { ArrowLeft, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { HeritageItem } from '../data/heritage';
import { Badge } from './ui';

interface HeritageCardProps {
  item: HeritageItem;
}

export default function HeritageCard({ item }: HeritageCardProps) {
  return (
    <Link to={`/explore/${item.id}`} className="heritage-card ui-card ui-card--interactive">
      <div className="heritage-card__image">
        <img src={item.imageUrl} alt={item.name} loading="lazy" />
        <Badge className="heritage-card__city">
          <MapPin size={14} aria-hidden="true" />
          {item.city}
        </Badge>
      </div>

      <div className="heritage-card__body">
        <span className="heritage-card__category">{item.category}</span>
        <h3 className="heritage-card__title">{item.name}</h3>
        <p className="heritage-card__desc">{item.description}</p>
        <span className="turathi-link-text">
          اكتشف التفاصيل
          <ArrowLeft size={16} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
