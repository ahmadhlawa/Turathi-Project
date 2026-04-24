import { Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 w-full h-16 glass z-50 flex items-center justify-between px-8"
    >
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center justify-center">
          <img 
            src="/Logo-Turathi.jpeg" 
            alt="شعار تراثي" 
            className="h-12 w-auto max-w-[140px] object-contain rounded-md" 
          />
        </Link>
      </div>

      <div className="hidden md:flex gap-8 text-sm font-bold text-text-secondary">
        <Link to="/" className="hover:text-olive-500 transition-colors">الرئيسية</Link>
        <Link to="/explore" className="hover:text-olive-500 transition-colors">المجموعة التراثية</Link>
        <Link to="/proverbs" className="hover:text-olive-500 transition-colors">الأمثال الفلسطينية</Link>
        {isHome && <a href="#scanner" className="hover:text-olive-500 transition-colors">فحص الأنماط (AI)</a>}
        {isHome && <a href="#truth-guard" className="hover:text-olive-500 transition-colors">حارس الحقيقة (AI)</a>}
        <Link to="/map" className="hover:text-olive-500 transition-colors text-tatreez-400">الخريطة التاريخية</Link>
      </div>

      <div>
        <button className="px-6 py-2 border border-tatreez-500 text-tatreez-500 rounded-[8px] text-sm font-bold hover:bg-tatreez-500/10 transition-all font-cairo">
          تسجيل الدخول
        </button>
      </div>
    </motion.nav>
  );
}
