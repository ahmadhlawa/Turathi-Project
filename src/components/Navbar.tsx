import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { publicAsset } from '../lib/assets';
import { cn } from './ui';

const navLinks = [
  { to: '/', label: 'الرئيسية' },
  { to: '/explore', label: 'المجموعة التراثية' },
  { to: '/proverbs', label: 'الأمثال الفلسطينية' },
  { to: '/map', label: 'الخريطة التاريخية' }
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
    return () => document.body.classList.remove('menu-open');
  }, [menuOpen]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn('site-nav-link', isActive && 'is-active');

  const homeAnchors = (
    <>
      {isHome && (
        <a href="#scanner" className="site-nav-link" onClick={() => setMenuOpen(false)}>
          محلل الأنماط
        </a>
      )}
      {isHome && (
        <a href="#truth-guard" className="site-nav-link" onClick={() => setMenuOpen(false)}>
          حارس السردية
        </a>
      )}
    </>
  );

  return (
    <motion.nav
      initial={{ y: -14, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="site-navbar"
      aria-label="التنقل الرئيسي"
    >
      <div className="site-navbar__inner">
        <Link to="/" className="site-brand" aria-label="تراثي الرقمي">
          <img src={publicAsset('Logo-Turathi.jpeg')} alt="شعار تراثي" />
          <span className="site-brand__text">
            <span className="site-brand__name">تراثي الرقمي</span>
            <span className="site-brand__tag">ذاكرة فلسطينية مدعومة بالذكاء الاصطناعي</span>
          </span>
        </Link>

        <div className="site-navbar__links">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass} end={link.to === '/'}>
              {link.label}
            </NavLink>
          ))}
          {homeAnchors}
        </div>

        <div className="site-navbar__actions">
          <button className="ui-button ui-button--outline ui-button--sm hidden sm:inline-flex" type="button">
            تسجيل الدخول
          </button>
          <button
            className="ui-button ui-button--secondary ui-button--icon site-menu-toggle"
            type="button"
            aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="site-mobile-menu"
          >
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClass} end={link.to === '/'}>
                {link.label}
              </NavLink>
            ))}
            {homeAnchors}
            <button className="ui-button ui-button--outline ui-button--sm sm:hidden" type="button">
              تسجيل الدخول
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
