import { MapPinned } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { cn, LoadingSpinner } from './ui';

export const PAL_OPEN_MAP_URL =
  'https://palopenmaps.org/ar/maps/jerusalem?basemap=pal20k1940&overlay=pal1940&color=status&toggles=places|year|split#14.00,35.2322,31.7778';

type MapStatus = 'loading' | 'available' | 'unavailable';

interface PalOpenMapProps {
  className?: string;
  src?: string;
  title?: string;
}

export default function PalOpenMap({
  className,
  src = PAL_OPEN_MAP_URL,
  title = 'خريطة فلسطين التاريخية من PalOpenMaps'
}: PalOpenMapProps) {
  const [status, setStatus] = useState<MapStatus>('loading');

  useEffect(() => {
    setStatus('loading');
    const timeout = window.setTimeout(() => {
      setStatus((currentStatus) => (currentStatus === 'available' ? currentStatus : 'unavailable'));
    }, 20000);

    return () => window.clearTimeout(timeout);
  }, [src]);

  return (
    <div className={cn('pal-map-embed', className)}>
      <iframe
        src={src}
        title={title}
        allowFullScreen
        loading="eager"
        onLoad={() => setStatus('available')}
        onError={() => setStatus('unavailable')}
      />
      {status !== 'available' && (
        <div className="pal-map-embed__overlay">
          {status === 'loading' ? (
            <MapMessage
              icon={<LoadingSpinner />}
              title="جاري تحميل الخريطة"
              description="نتصل بمصدر الخريطة الآن."
              isLoading
            />
          ) : (
            <MapMessage
              icon={<MapPinned size={22} aria-hidden="true" />}
              title="الخريطة غير متوفرة حالياً"
              description="ما زلنا نحاول الاتصال بمصدر الخريطة. إذا استمر التعذر، جرّب تحديث الصفحة بعد قليل."
            />
          )}
        </div>
      )}
    </div>
  );
}

function MapMessage({
  icon,
  title,
  description,
  isLoading = false
}: {
  icon: ReactNode;
  title: string;
  description: string;
  isLoading?: boolean;
}) {
  return (
    <div className="pal-map-embed__status" role={isLoading ? 'status' : 'note'} aria-live="polite">
      <span className="pal-map-embed__icon">{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
