import { motion } from 'motion/react';

export default function Hero() {
  const headline = "السيادة المعرفية الرقمية لحماية التراث الفلسطيني".split(" ");

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 px-6">
      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-6">
        
        {/* Main Content Card using Glass */}
        <div className="glass p-8 md:p-12 rounded-[16px] flex flex-col gap-6 md:w-1/2 justify-center">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight text-text-primary flex flex-wrap gap-2 font-amiri">
            {headline.map((word, i) => (
              <motion.span
                key={i}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
                className={i % 2 === 1 ? "text-olive-500" : ""}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: headline.length * 0.1 + 0.2, duration: 0.5 }}
            className="text-text-secondary text-sm md:text-base leading-relaxed"
          >
            منصة ذكاء اصطناعي لرقمنة التراث الفلسطيني والتحقق من أصالته وحمايته من التزوير الثقافي.
          </motion.p>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: headline.length * 0.1 + 0.4, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 mt-4 font-cairo"
          >
            <a href="#scanner" className="px-8 py-3 bg-olive-500 text-white rounded-[8px] font-bold shadow-lg text-center transition-all hover:scale-105 hover:bg-olive-400 active:scale-95 olive-glow">
              بدء الفحص الذكي
            </a>
            <a href="#truth-guard" className="px-8 py-3 border border-tatreez-500 text-tatreez-500 rounded-[8px] text-center font-bold hover:bg-tatreez-500/10 transition-all hover:scale-105 active:scale-95">
              تصفح الأرشيف
            </a>
          </motion.div>
        </div>

        {/* Stats Section */}
        <div className="glass p-8 rounded-[16px] md:w-1/2 flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-bg-surface rounded-xl border border-olive-500/25">
              <div className="text-sm text-text-muted mb-2">الأنماط الموثقة</div>
              <div className="text-3xl font-bold font-mono text-text-primary">١٢,٤٥٠</div>
            </div>
            <div className="p-6 bg-bg-surface rounded-xl border border-olive-500/25">
              <div className="text-sm text-text-muted mb-2">نسبة الدقة</div>
              <div className="text-3xl font-bold font-mono text-olive-500">٩٩.٨٪</div>
            </div>
            <div className="p-6 bg-bg-surface rounded-xl border border-olive-500/25 col-span-2">
              <div className="text-sm text-text-muted mb-2">الطلبات التي تمت معالجتها عبر الذكاء الاصطناعي</div>
              <div className="text-4xl font-black font-mono text-gold-accent">+٤٥,٠٠٠</div>
            </div>
          </div>
        </div>

      </div>

      {/* Scroll indicator */}
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 w-6 h-10 border-2 border-olive-500/40 rounded-full flex justify-center p-1"
      >
        <div className="w-1.5 h-1.5 bg-olive-300 rounded-full" />
      </motion.div>
    </section>
  );
}
