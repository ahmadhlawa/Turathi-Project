import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, Brain, ShieldCheck, Landmark, Sprout } from 'lucide-react';

export default function Hero() {
  return (
    <section id="hero" className="relative min-h-[100dvh] w-full flex flex-col justify-center overflow-hidden bg-[#F4F1E8] snap-start shrink-0">
      
      {/* Background Graphic (Left Side Image Fade) */}
      <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none flex">
        {/* Use a placeholder heritage image that fades beautifully into the cream background */}
        <div className="w-full md:w-2/3 h-full relative">
           <img 
              src="https://images.unsplash.com/photo-1549704207-6c841fed6685?q=80&w=1600&auto=format&fit=crop" 
              alt="Jerusalem Skyline" 
              className="w-full h-full object-cover"
           />
           {/* Gradient mask to blend the image into the '#F4F1E8' background on the right */}
           <div className="absolute inset-0 bg-gradient-to-l from-[#F4F1E8] via-[#F4F1E8]/70 to-transparent"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-[#F4F1E8] via-transparent to-transparent"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 pt-24 pb-32">
        
        {/* Right Side (Text Content) - Since direction is RTL, col-1 is visually right */}
        <div className="flex flex-col justify-center items-start">
          
          <motion.h1 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-[3.5rem] lg:text-[5rem] font-bold leading-[1.1] text-[#3c4a2a] mb-6 font-amiri tracking-tight"
            style={{ textShadow: '0 4px 20px rgba(244,241,232,0.8)' }}
          >
            حفظ التراث<br />لأجيال قادمة
          </motion.h1>

          <motion.div 
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '100%' }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="w-2.5 h-2.5 bg-[#a39161] rounded-full"></div>
            <div className="w-16 h-0.5 bg-[#3c4a2a]"></div>
          </motion.div>

          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg md:text-xl text-[#4a5839] leading-relaxed max-w-lg mb-8 font-bold"
          >
            منصة ذكية لحماية التراث الفلسطيني وإبرازه للأجيال القادمة باستخدام أحدث تقنيات الذكاء الاصطناعي.
          </motion.p>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <a 
              href="#scanner" 
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-[#52623a] text-white px-8 py-3.5 rounded-[12px] font-bold text-lg hover:bg-[#3c4a2a] transition-all hover:-translate-y-1 shadow-lg shadow-[#52623a]/30"
            >
              <Sparkles className="w-5 h-5" />
              <span>بدء الفحص الذكي</span>
            </a>
            
            <a 
              href="/explore" 
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-transparent text-[#3c4a2a] border-2 border-[#3c4a2a] px-8 py-3.5 rounded-[12px] font-bold text-lg hover:bg-[#3c4a2a]/5 transition-all hover:-translate-y-1"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>استكشف التراث</span>
            </a>
          </motion.div>

        </div>

        {/* Left Side (Image Holder) - Empty space for the background to show through, now contains the logo */}
        <div className="hidden md:flex justify-center items-center">
          <motion.img 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.85 }}
            transition={{ delay: 0.4, duration: 1.2, ease: "easeOut" }}
            src="/Logo-Turathi.jpeg" 
            alt="شعار تراثي" 
            className="w-64 h-64 lg:w-[400px] lg:h-[400px] object-contain mix-blend-multiply pointer-events-none"
          />
        </div>

      </div>

      {/* Floating Features Bar */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="absolute bottom-8 left-6 right-6 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-[95%] max-w-[1200px] z-20"
      >
        <div className="bg-[#FAF8F3]/95 backdrop-blur-md border border-[#e8dcc4] rounded-[20px] shadow-2xl shadow-black/10 p-6 flex flex-col md:flex-row justify-between items-center gap-6 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-[#e8dcc4]">
          
          <div className="flex items-center gap-5 w-full md:w-1/4 pt-4 md:pt-0">
            <div className="w-16 h-16 rounded-full bg-[#EAE3CB] flex items-center justify-center text-[#52623a] shrink-0">
              <Sprout className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-[#3c4a2a] text-xl mb-1">حماية وإحياء</h4>
              <p className="text-[#657352] text-sm font-semibold">للتراث الفلسطيني</p>
            </div>
          </div>

          <div className="flex items-center gap-5 w-full md:w-1/4 pt-6 md:pt-0 pr-0 md:pr-8">
            <div className="w-16 h-16 rounded-full bg-[#EAE3CB] flex items-center justify-center text-[#52623a] shrink-0">
              <Landmark className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-[#3c4a2a] text-xl mb-1">تراث فلسطيني</h4>
              <p className="text-[#657352] text-sm font-semibold">هوية وتاريخ وحضارة</p>
            </div>
          </div>

          <div className="flex items-center gap-5 w-full md:w-1/4 pt-6 md:pt-0 pr-0 md:pr-8">
            <div className="w-16 h-16 rounded-full bg-[#EAE3CB] flex items-center justify-center text-[#52623a] shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-[#3c4a2a] text-xl mb-1">محتوى موثوق</h4>
              <p className="text-[#657352] text-sm font-semibold">من مصادر موثوقة</p>
            </div>
          </div>

          <div className="flex items-center gap-5 w-full md:w-1/4 pt-6 md:pt-0 pr-0 md:pr-8">
            <div className="w-16 h-16 rounded-full bg-[#EAE3CB] flex items-center justify-center text-[#52623a] shrink-0">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-[#3c4a2a] text-xl mb-1">تقنيات متقدمة</h4>
              <p className="text-[#657352] text-sm font-semibold">ذكاء اصطناعي متطور</p>
            </div>
          </div>

        </div>
      </motion.div>

    </section>
  );
}
