import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProverbItem } from '../data/proverbs';

interface ProverbCardProps {
  proverb: ProverbItem;
}

type TabType = 'meaning' | 'story' | 'category' | null;

export default function ProverbCard({ proverb }: ProverbCardProps) {
  const [activeTab, setActiveTab] = useState<TabType>(null);
  const [loading, setLoading] = useState(false);
  
  // Store fetched results to avoid refetching
  const [results, setResults] = useState<{ meaning: string, story: string, category: string }>({
    meaning: '',
    story: '',
    category: ''
  });

  const handleFetch = async (tab: TabType) => {
    if (!tab) return;
    
    // Toggle off
    if (activeTab === tab) {
      setActiveTab(null);
      return;
    }

    setActiveTab(tab);
    
    // If we already have the result, don't fetch again
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
      
      setResults(prev => ({ ...prev, [tab]: data.result }));
    } catch (err) {
      setResults(prev => ({ ...prev, [tab]: 'تعذر الاتصال بالذكاء الاصطناعي حالياً. يرجى المحاولة لاحقاً.' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="turathi-proverb-card">
      <h3 className="turathi-proverb-text text-olive-500">"{proverb.text}"</h3>
      
      <div className="turathi-proverb-actions mt-auto">
        <button 
          className={`turathi-action-btn ${activeTab === 'meaning' ? 'active' : ''}`}
          onClick={() => handleFetch('meaning')}
          disabled={loading && activeTab !== 'meaning'}
        >
          {loading && activeTab === 'meaning' ? <span className="turathi-spinner" /> : 'شرح'}
        </button>
        <button 
          className={`turathi-action-btn ${activeTab === 'story' ? 'active' : ''}`}
          onClick={() => handleFetch('story')}
          disabled={loading && activeTab !== 'story'}
        >
          {loading && activeTab === 'story' ? <span className="turathi-spinner" /> : 'قصة'}
        </button>
        <button 
          className={`turathi-action-btn ${activeTab === 'category' ? 'active' : ''}`}
          onClick={() => handleFetch('category')}
          disabled={loading && activeTab !== 'category'}
        >
          {loading && activeTab === 'category' ? <span className="turathi-spinner" /> : 'تصنيف'}
        </button>
      </div>

      <AnimatePresence>
        {activeTab && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="turathi-ai-result">
              {loading && !results[activeTab] ? (
                <div className="flex gap-2 items-center text-text-muted">
                  <span className="turathi-spinner border-t-olive-500" />
                  <span>الذكاء الاصطناعي يحلل...</span>
                </div>
              ) : (
                 <>
                   {activeTab === 'category' && <strong className="text-olive-500 block mb-1">الفئة:</strong>}
                   {results[activeTab]}
                 </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
