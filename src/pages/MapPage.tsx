import {
  BookMarked,
  Library,
  MapPinned,
  Menu,
  MessageSquareText,
  Music2,
  ScanLine,
  ShieldCheck,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PalOpenMap from '../components/PalOpenMap';
import { cn } from '../components/ui';
import { publicAsset } from '../lib/assets';

const navItems = [
  { to: '/?tool=guardian', label: 'حارس السردية الفلسطينية', icon: ShieldCheck },
  { to: '/?tool=pattern', label: 'تحليل النمط الصوري', icon: ScanLine },
  { to: '/?tool=proverbs', label: 'الأمثال الشعبية', icon: MessageSquareText },
  { to: '/?tool=stories', label: 'القصص الشعبية الفلسطينية', icon: BookMarked },
  { to: '/?tool=songs', label: 'الأهازيج والأغاني', icon: Music2 },
  { to: '/map', label: 'الخريطة التاريخية', icon: MapPinned, active: true },
  { to: '/?tool=sources', label: 'المراجع والمصادر الفلسطينية', icon: Library }
];

export default function MapPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('menu-open', sidebarOpen);
    return () => document.body.classList.remove('menu-open');
  }, [sidebarOpen]);

  return (
    <div className="turathi-ai-app map-shell">
      <aside className={cn('ai-sidebar', sidebarOpen && 'is-open')}>
        <div className="ai-sidebar__top">
          <Link to="/" className="ai-brand" aria-label="تراثي AI">
            <img src={publicAsset('Logo-Turathi.jpeg')} alt="" />
            <div>
              <strong>تراثي AI</strong>
              <span>فلسطين فقط</span>
            </div>
          </Link>

          <button className="ai-icon-btn ai-sidebar__close" type="button" onClick={() => setSidebarOpen(false)}>
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        <div className="ai-sidebar__section">
          <span className="ai-sidebar__label">الأدوات</span>
          <nav className="ai-tool-list" aria-label="أدوات تراثي">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn('ai-tool-button', item.active && 'is-active')}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={19} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="ai-sidebar__account">
          <span>AI</span>
          <div>
            <strong>حارس تراثي</strong>
            <small>مسميات فلسطينية</small>
          </div>
        </div>
      </aside>

      <main className="map-main" aria-label="الخريطة التاريخية">
        <button className="ai-icon-btn ai-mobile-menu map-mobile-menu" type="button" onClick={() => setSidebarOpen(true)}>
          <Menu size={20} aria-hidden="true" />
        </button>

        <section className="map-page">
          <PalOpenMap className="map-page__frame" />
        </section>
      </main>
    </div>
  );
}
