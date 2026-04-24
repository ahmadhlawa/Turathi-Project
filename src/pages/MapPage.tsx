import { ExternalLink, Landmark, MapPin } from 'lucide-react';
import { Badge, Card, Section } from '../components/ui';

const cities = [
  {
    name: 'رام الله',
    note: 'مركز جبلي يربط القرى والطرق التاريخية في وسط فلسطين.'
  },
  {
    name: 'نابلس',
    note: 'مدينة الحرف والصابون والأسواق الممتدة بين جرزيم وعيبال.'
  },
  {
    name: 'الخليل',
    note: 'حاضنة الزجاج والخزف والمنسوجات ذات الذاكرة العريقة.'
  },
  {
    name: 'بيت لحم',
    note: 'مدينة خشب الزيتون والحرف المرتبطة بالمواسم والزيارات.'
  }
];

export default function MapPage() {
  return (
    <div className="page-shell">
      <Section
        compact
        eyebrow={
          <>
            <Landmark size={15} aria-hidden="true" />
            طبقات مكانية
          </>
        }
        title="خريطة فلسطين التاريخية"
        subtitle="استكشف القرى والمناطق الفلسطينية عبر خريطة تفاعلية مفتوحة المصدر، مع نقاط قراءة سريعة للمدن المرتبطة بالمجموعة التراثية."
      >
        <div className="map-layout">
          <div className="map-frame">
            <iframe
              src="https://palopenmaps.org/ar/maps/ramallah?basemap=pal20k1940&overlay=pal1940&color=status&toggles=places|year|split#14.00,35.1961,31.9043"
              title="Palestine Open Maps"
              allowFullScreen
              loading="lazy"
            />
          </div>

          <aside className="map-sidebar" aria-label="مدن تراثية مختارة">
            {cities.map((city) => (
              <Card className="city-card" key={city.name}>
                <Badge>
                  <MapPin size={14} aria-hidden="true" />
                  {city.name}
                </Badge>
                <h3>{city.name}</h3>
                <p>{city.note}</p>
              </Card>
            ))}

            <a
              className="ui-button ui-button--outline"
              href="https://palopenmaps.org/ar"
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={17} aria-hidden="true" />
              <span>فتح المصدر الكامل</span>
            </a>
          </aside>
        </div>
      </Section>
    </div>
  );
}
