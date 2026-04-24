import React, { useState } from 'react';
import { proverbsData } from '../data/proverbs';
import ProverbCard from '../components/ProverbCard';
import { motion, AnimatePresence } from 'motion/react';

export default function ProverbsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [displayCount, setDisplayCount] = useState(12); // Show 12 initially
  
  // Custom Chatbot input state
  const [chatInput, setChatInput] = useState('');
  const [chatResult, setChatResult] = useState<{related: boolean, proverb: string, explanation: string} | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Filtering
  const filteredProverbs = proverbsData.filter(p => 
    p.text.includes(searchTerm)
  );

  const handleRandom = () => {
    const min = 0;
    const max = proverbsData.length - 1;
    const random = Math.floor(Math.random() * (max - min + 1)) + min;
    setSearchTerm(proverbsData[random].text);
  };

  const handleAISearch = async () => {
    if(!chatInput.trim()) return;
    setIsChatLoading(true);
    setChatResult(null);
    try {
      const res = await fetch('/api/proverb-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: chatInput })
      });
      const data = await res.json();
      setChatResult(data);
    } catch(err) {
      console.error(err);
      setChatResult({ related: false, proverb: '', explanation: 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.'});
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="turathi-custom-ui" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
      <div className="turathi-container">
        
        <div className="turathi-section-header" style={{ marginTop: '40px', alignItems: 'center', textAlign: 'center' }}>
          <h2>الأمثال الشعبية الفلسطينية 🌿</h2>
          <p>اكتشف الحكمة، القصص، والمعاني العميقة من التراث الفلسطيني بدعم من الذكاء الاصطناعي</p>
        </div>

        {/* Chatbot style prompt below Navbar */}
        <div className="turathi-proverb-chatbot mt-4 relative flex-col items-stretch">
          <div className="flex gap-4 w-full flex-col md:flex-row md:items-center">
            <input 
              type="text" 
              placeholder="اسأل الذكاء الاصطناعي... (مثال: أعطني مثل فلسطيني عن الصبر أو الأم)" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAISearch();
              }}
              className="flex-1"
            />
            <button 
              disabled={isChatLoading} 
              onClick={handleAISearch}
              className={`md:w-auto w-full ${isChatLoading ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isChatLoading ? 'جاري العصف الذهني...' : 'اسأل الذكاء الاصطناعي ✨'}
            </button>
          </div>
          
          <AnimatePresence>
            {chatResult && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className={`mt-4 p-6 rounded-[12px] flex items-start gap-4 shadow-sm w-full ${chatResult.related ? 'bg-olive-500/10 border border-olive-500/30' : 'bg-red-50 border border-red-200'}`}
              >
                 <div className="flex-1 font-cairo">
                   {!chatResult.related ? (
                      <p className="text-red-600 font-bold text-lg">{chatResult.explanation}</p>
                   ) : (
                      <>
                        <h4 className="text-2xl font-amiri font-bold text-olive-500 mb-3">{chatResult.proverb}</h4>
                        <p className="text-text-secondary leading-relaxed text-lg">{chatResult.explanation}</p>
                      </>
                   )}
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search & Actions Bar */}
        <div className="turathi-filters-bar" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="ابحث في الأرشيف (مثال: جرة، ريح...)" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="turathi-input"
          />
          <button 
            onClick={handleRandom}
            className="turathi-action-btn bg-opacity" 
            style={{ minWidth: '150px', background: '#f5f2eb' }}
          >
            🎲 مثل اليوم
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredProverbs.slice(0, displayCount).map(proverb => (
            <ProverbCard key={proverb.id} proverb={proverb} />
          ))}
        </div>
        
        {/* Load More Button */}
        {displayCount < filteredProverbs.length && (
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <button 
              onClick={() => setDisplayCount(prev => prev + 12)}
              className="turathi-primary-btn"
            >
              عرض المزيد
            </button>
          </div>
        )}

        {filteredProverbs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#7f8c8d' }}>
            <h3>لم يتم العثور على أمثال مطابقة لبحثك في الأرشيف الحالي.</h3>
          </div>
        )}

      </div>
    </div>
  );
}
