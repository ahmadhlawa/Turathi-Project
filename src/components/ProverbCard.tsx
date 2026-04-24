import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, MessageSquareText, Tags } from 'lucide-react';
import { useState } from 'react';
import type { ProverbItem } from '../data/proverbs';
import { Badge, Button, LoadingSpinner } from './ui';

interface ProverbCardProps {
  proverb: ProverbItem;
  categoryLabel?: string;
}

type TabType = 'meaning' | 'story' | 'category' | null;

const tabMeta = {
  meaning: { label: 'شرح', icon: BookOpen },
  story: { label: 'قصة', icon: MessageSquareText },
  category: { label: 'تصنيف', icon: Tags }
};

export default function ProverbCard({ proverb, categoryLabel = 'مثل شعبي' }: ProverbCardProps) {
  const [activeTab, setActiveTab] = useState<TabType>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ meaning: string; story: string; category: string }>({
    meaning: '',
    story: '',
    category: ''
  });

  const handleFetch = async (tab: Exclude<TabType, null>) => {
    if (activeTab === tab) {
      setActiveTab(null);
      return;
    }

    setActiveTab(tab);
    if (results[tab]) return;

    setLoading(true);
    try {
      const endpoint = `/api/proverb-${tab}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proverb: proverb.text })
      });

      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setResults((prev) => ({ ...prev, [tab]: data.result }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [tab]: 'تعذر الاتصال بالذكاء الاصطناعي حالياً. يرجى المحاولة لاحقاً.'
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="proverb-card ui-card ui-card--interactive">
      <div className="proverb-card__meta">
        <Badge variant="muted">{categoryLabel}</Badge>
      </div>

      <blockquote>“{proverb.text}”</blockquote>

      <div className="proverb-actions">
        {(Object.keys(tabMeta) as Array<Exclude<TabType, null>>).map((tab) => {
          const meta = tabMeta[tab];
          const Icon = meta.icon;
          const isActive = activeTab === tab;
          const isLoading = loading && isActive;

          return (
            <Button
              key={tab}
              variant={isActive ? 'primary' : 'secondary'}
              size="sm"
              icon={isLoading ? <LoadingSpinner /> : <Icon size={15} aria-hidden="true" />}
              onClick={() => handleFetch(tab)}
              disabled={loading && !isActive}
            >
              {meta.label}
            </Button>
          );
        })}
      </div>

      <AnimatePresence>
        {activeTab && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="proverb-result">
              {loading && !results[activeTab] ? (
                <div className="flex gap-2 items-center text-text-muted">
                  <LoadingSpinner />
                  <span>يجري تحليل المثل...</span>
                </div>
              ) : (
                <>
                  {activeTab === 'category' && <strong className="block mb-1">الفئة:</strong>}
                  {results[activeTab]}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
