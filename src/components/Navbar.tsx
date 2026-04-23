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
        <Link to="/" className="w-10 h-10 bg-olive-500 rounded-lg flex items-center justify-center olive-glow">
          <Shield className="w-6 h-6 text-white" />
        </Link>
        <Link to="/" className="text-xl font-bold tracking-tight font-amiri text-text-primary">
          تراثي الرقمي <span className="text-xs font-cairo font-light opacity-50 mr-2 text-text-secondary">TURATH DIGITAL</span>
        </Link>
      </div>

      <div className="hidden md:flex gap-8 text-sm font-bold text-text-secondary">
        <Link to="/" className="hover:text-olive-500 transition-colors">الرئيسية</Link>
        {isHome && <a href="#scanner" className="hover:text-olive-500 transition-colors">فحص الأنماط</a>}
        {isHome && <a href="#truth-guard" className="hover:text-olive-500 transition-colors">حارس الحقيقة</a>}
        <Link to="/map" className="hover:text-olive-500 transition-colors text-tatreez-400">خريطة فلسطين التاريخية</Link>
      </div>

      <div>
        <button className="px-6 py-2 border border-tatreez-500 text-tatreez-500 rounded-[8px] text-sm font-bold hover:bg-tatreez-500/10 transition-all font-cairo">
          تسجيل الدخول
        </button>
      </div>
    </motion.nav>
  );
}
