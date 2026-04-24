import { ArrowLeft, Brain, Landmark, ShieldCheck, Sparkles, Sprout } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { heritageData } from '../data/heritage';
import { proverbsData } from '../data/proverbs';
import { publicAsset } from '../lib/assets';

const stats = [
  { value: '5+', label: 'مسارات تراثية' },
  { value: String(proverbsData.length), label: 'مثل شعبي موثق' },
  { value: 'AI', label: 'تحليل هادئ ومساند' }
];

const features = [
  { icon: Sprout, title: 'حماية وإحياء', text: 'تجربة رقمية تصون الذاكرة وتقرّبها للأجيال.' },
  { icon: Landmark, title: 'تراث فلسطيني', text: 'أزياء وحرف ورموز مرتبطة بالمكان والناس.' },
  { icon: ShieldCheck, title: 'سردية مسؤولة', text: 'لغة متوازنة تميّز بين الموثق وما يحتاج سياقاً.' }
];

export default function Hero() {
  const slides = useMemo(
    () =>
      heritageData.map((item) => ({
        src: item.imageUrl,
        alt: item.name
      })),
    []
  );
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return undefined;

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [slides.length]);

  const currentSlide = slides[activeSlide];

  return (
    <section id="hero" className="hero-section turathi-section--screen">
      <div className="turathi-container hero-grid">
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          className="hero-copy"
        >
          <span className="section-eyebrow">
            <Sparkles size={16} aria-hidden="true" />
            AI Week Palestine
          </span>
          <h1>تراثي الرقمي</h1>
          <p>
            منصة فلسطينية ذكية تجمع التراث، الأمثال، الخرائط، وتحليل التطريز في تجربة
            واضحة تساعد على حفظ الذاكرة الثقافية وتقديمها بثقة وهدوء.
          </p>

          <div className="hero-actions">
            <a href="#scanner" className="ui-button ui-button--primary ui-button--lg">
              <Brain size={20} aria-hidden="true" />
              <span>ابدأ الفحص الذكي</span>
            </a>
            <Link to="/explore" className="ui-button ui-button--outline ui-button--lg">
              <ArrowLeft size={20} aria-hidden="true" />
              <span>استكشف المجموعة</span>
            </Link>
          </div>
        </motion.div>

        <motion.aside
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.12, duration: 0.65, ease: 'easeOut' }}
          className="hero-visual"
          aria-label="عرض بصري من التراث الفلسطيني"
        >
          <div className="hero-image-frame">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentSlide.src}
                src={currentSlide.src}
                alt={currentSlide.alt}
                className="hero-slide-image"
                initial={{ opacity: 0, scale: 1.04, x: 24 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.98, x: -24 }}
                transition={{ duration: 0.75, ease: 'easeInOut' }}
              />
            </AnimatePresence>
            <div className="hero-logo-chip">
              <img src={publicAsset('Logo-Turathi.jpeg')} alt="" aria-hidden="true" />
              <span>منصة تراثي</span>
            </div>
            <div className="hero-slide-dots" aria-hidden="true">
              {slides.map((slide, index) => (
                <span
                  className={index === activeSlide ? 'is-active' : ''}
                  key={slide.src}
                />
              ))}
            </div>
          </div>

          <div className="hero-stat-grid">
            {stats.map((stat) => (
              <div className="hero-stat" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </motion.aside>

        <div className="hero-feature-strip">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div className="hero-feature" key={feature.title}>
                <Icon aria-hidden="true" />
                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
