import { AnimatePresence, motion } from 'motion/react';
import { Lightbulb, MessageCircle, Search, Shuffle, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ProverbCard from '../components/ProverbCard';
import { Button, EmptyState, LoadingSpinner, Section } from '../components/ui';
import { proverbsData, ProverbItem } from '../data/proverbs';

const categoryById: Record<number, string> = {
  1: 'عمل',
  2: 'علاقات',
  3: 'انتماء',
  4: 'علاقات',
  5: 'حكمة',
  6: 'حكمة',
  7: 'علاقات',
  8: 'عمل',
  9: 'علاقات',
  10: 'حكمة',
  11: 'حكمة',
  12: 'تعلم',
  13: 'صبر',
  14: 'تعاطف',
  15: 'حكمة',
  16: 'حكمة',
  17: 'عمل',
  18: 'صحة',
  19: 'حكمة',
  20: 'عمل',
  21: 'اجتماع',
  22: 'تراث',
  23: 'حكمة',
  24: 'ضيافة',
  25: 'كرم',
  26: 'عائلة',
  27: 'عائلة',
  28: 'حكمة',
  29: 'طرافة',
  30: 'طرافة',
  31: 'صبر',
  32: 'عمل',
  33: 'علاقات',
  34: 'حكمة',
  35: 'حكمة',
  36: 'حكمة',
  37: 'انتماء',
  38: 'علاقات',
  39: 'صبر',
  40: 'طرافة',
  41: 'طرافة',
  42: 'صبر'
};

function proverbCategory(proverb: ProverbItem) {
  return proverb.category || categoryById[proverb.id] || 'حكمة';
}

export default function ProverbsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [displayCount, setDisplayCount] = useState(12);
  const [chatInput, setChatInput] = useState('');
  const [chatResult, setChatResult] = useState<{ related: boolean; proverb: string; explanation: string } | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const categories = useMemo(
    () => ['الكل', ...new Set(proverbsData.map((proverb) => proverbCategory(proverb)))],
    []
  );

  const filteredProverbs = proverbsData.filter((proverb) => {
    const matchesSearch = !searchTerm.trim() || proverb.text.includes(searchTerm.trim());
    const matchesCategory = selectedCategory === 'الكل' || proverbCategory(proverb) === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    setDisplayCount(12);
  }, [searchTerm, selectedCategory]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('الكل');
  };

  const handleRandom = () => {
    const random = Math.floor(Math.random() * proverbsData.length);
    setSearchTerm(proverbsData[random].text);
    setSelectedCategory('الكل');
  };

  const handleAISearch = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    setIsChatLoading(true);
    setChatResult(null);

    try {
      const res = await fetch('/api/proverb-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: chatInput })
      });

      if (!res.ok) throw new Error('تعذر الوصول إلى خدمة الأمثال الآن.');
      const data = await res.json();
      setChatResult(data);
    } catch (err) {
      setChatResult({
        related: false,
        proverb: '',
        explanation: err instanceof Error ? err.message : 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.'
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <Section
        compact
        align="center"
        eyebrow={
          <>
            <Lightbulb size={15} aria-hidden="true" />
            حكمة شعبية
          </>
        }
        title="الأمثال الشعبية الفلسطينية"
        subtitle="ابحث في أرشيف الأمثال، أو اطلب من المساعد اقتراح مثل مناسب لموقف أو معنى محدد."
      >
        <div className="chat-panel ui-card mb-6">
          <div className="chat-form">
            <label>
              <span className="sr-only">اسأل مساعد الأمثال</span>
              <input
                type="text"
                placeholder="مثال: أعطني مثلاً فلسطينياً عن الصبر أو الجار"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAISearch();
                }}
                className="form-field"
              />
            </label>
            <Button
              disabled={isChatLoading || !chatInput.trim()}
              onClick={handleAISearch}
              icon={isChatLoading ? <LoadingSpinner /> : <MessageCircle size={18} aria-hidden="true" />}
            >
              {isChatLoading ? 'جاري البحث' : 'اسأل المساعد'}
            </Button>
          </div>

          <AnimatePresence>
            {chatResult && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={chatResult.related ? 'ai-response' : 'ai-response ai-response--notice'}
              >
                {chatResult.related ? (
                  <>
                    <h3 className="m-0 mb-2 text-xl font-black text-olive-500">{chatResult.proverb}</h3>
                    <p className="m-0 text-text-secondary leading-8">{chatResult.explanation}</p>
                  </>
                ) : (
                  <p className="m-0 text-text-secondary font-bold leading-8">{chatResult.explanation}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="turathi-filters-bar">
          <label className="relative">
            <span className="sr-only">ابحث في أرشيف الأمثال</span>
            <input
              type="text"
              placeholder="ابحث في الأرشيف: جرة، ريح، دار..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="turathi-input"
            />
            <Search
              size={18}
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
          </label>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="turathi-select"
            aria-label="تصفية الأمثال حسب الفئة"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <Button variant="secondary" icon={<Shuffle size={17} aria-hidden="true" />} onClick={handleRandom}>
            مثل عشوائي
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 text-sm font-bold text-text-muted">
          <span>عدد الأمثال: {filteredProverbs.length}</span>
          {(searchTerm || selectedCategory !== 'الكل') && (
            <Button variant="subtle" size="sm" icon={<X size={16} aria-hidden="true" />} onClick={resetFilters}>
              مسح التصفية
            </Button>
          )}
        </div>

        {filteredProverbs.length > 0 ? (
          <>
            <div className="turathi-grid mb-8">
              {filteredProverbs.slice(0, displayCount).map((proverb) => (
                <ProverbCard key={proverb.id} proverb={proverb} categoryLabel={proverbCategory(proverb)} />
              ))}
            </div>

            {displayCount < filteredProverbs.length && (
              <div className="section-action">
                <Button onClick={() => setDisplayCount((prev) => prev + 12)}>عرض المزيد</Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="لا توجد أمثال مطابقة"
            description="جرّب كلمة بحث أخرى أو عد إلى كل الفئات."
            action={
              <Button variant="primary" onClick={resetFilters}>
                عرض كل الأمثال
              </Button>
            }
          />
        )}
      </Section>
    </div>
  );
}
