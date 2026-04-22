import { Shield } from 'lucide-react';
import { motion } from 'motion/react';

export default function Navbar() {
  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 w-full h-16 glass z-50 flex items-center justify-between px-8"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-olive-500 rounded-lg flex items-center justify-center olive-glow">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight font-amiri text-text-primary">
          تراثي الرقمي <span className="text-xs font-cairo font-light opacity-50 mr-2 text-text-secondary">TURATH DIGITAL</span>
        </span>
      </div>

      <div className="hidden md:flex gap-8 text-sm font-bold text-text-secondary">
        <a href="#hero" className="hover:text-olive-500 transition-colors">الرئيسية</a>
        <a href="#scanner" className="hover:text-olive-500 transition-colors">فحص الأنماط</a>
        <a href="#truth-guard" className="hover:text-olive-500 transition-colors">حارس الحقيقة</a>
      </div>

      <div>
        <button className="px-6 py-2 border border-tatreez-500 text-tatreez-500 rounded-[8px] text-sm font-bold hover:bg-tatreez-500/10 transition-all font-cairo">
          تسجيل الدخول
        </button>
      </div>
    </motion.nav>
  );
}
