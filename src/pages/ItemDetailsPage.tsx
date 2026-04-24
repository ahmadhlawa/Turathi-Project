import { ArrowRight, Brain, MapPin, Tag } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge, EmptyState, Section } from '../components/ui';
import { heritageData, HeritageItem } from '../data/heritage';

export default function ItemDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const item = heritageData.find((i: HeritageItem) => i.id === id);

  if (!item) {
    return (
      <div className="page-shell">
        <Section fullHeight>
          <EmptyState
            title="العنصر غير موجود"
            description="قد يكون الرابط غير صحيح أو تم نقل العنصر من المجموعة."
            action={
              <button className="ui-button ui-button--primary" type="button" onClick={() => navigate('/explore')}>
                العودة للمجموعة
              </button>
            }
          />
        </Section>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <Section compact>
        <Link to="/explore" className="turathi-back-btn">
          <ArrowRight size={18} aria-hidden="true" />
          العودة إلى المجموعة التراثية
        </Link>

        <article className="details-grid ui-card">
          <div className="details-image">
            <img src={item.imageUrl} alt={item.name} />
          </div>

          <div className="details-content">
            <div className="details-tags">
              <Badge>
                <MapPin size={14} aria-hidden="true" />
                {item.city}
              </Badge>
              <Badge variant="red">
                <Tag size={14} aria-hidden="true" />
                {item.category}
              </Badge>
            </div>

            <h1 className="details-title">{item.name}</h1>
            <p className="details-text">{item.longDescription}</p>

            {item.aiInsight && (
              <div className="turathi-ai-insight">
                <div className="turathi-ai-insight-header">
                  <Brain size={20} aria-hidden="true" />
                  <span>ملاحظة معرفية مساندة</span>
                </div>
                <p>{item.aiInsight}</p>
              </div>
            )}
          </div>
        </article>
      </Section>
    </div>
  );
}
