import { useState, useRef, useEffect } from 'react';
import { Send, Shield, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
  sources?: string[];
}

export default function TruthGuard() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'bot',
      text: 'مرحباً، أنا حارس الحقيقة. أجيب فقط استناداً إلى الأرشيفات التاريخية الموثقة. لا أخترع معلومات ولا أسمح بتشويه التاريخ الفلسطيني.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      // Use scrollTop instead of scrollIntoView to prevent the whole browser window from jumping down
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string = input) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/truth-guard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Network error');
      }

      const data = await response.json();
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: data.reply
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: error.message || 'عذراً، حدث خطأ في الاتصال بالأرشيف. يرجى المحاولة لاحقاً.'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickReplies = [
    "أعطني نظرة عامة عن دير ياسين",
    "ما هي قرى الجليل المهجرة؟",
    "تاريخ الكوفية الفلسطينية"
  ];

  return (
    <section id="truth-guard" className="py-24 px-6 bg-bg-deep border-y border-bg-overlay relative">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col items-center mb-10 text-center">
          <Shield className="w-12 h-12 text-olive-500 mb-4" />
          <h2 className="text-4xl font-bold mb-4 font-amiri text-text-primary">حارس الحقيقة الموثق</h2>
          <p className="text-text-secondary font-cairo cursor-default">نظام حواري محمي لضمان دقة الرواية التاريخية الفلسطينية</p>
        </div>

        <div className="bg-bg-surface border border-olive-500/25 rounded-[16px] overflow-hidden shadow-2xl flex flex-col font-cairo">
          
          {/* Messages Area */}
          <div ref={messagesContainerRef} className="h-[500px] overflow-y-auto p-6 space-y-6 flex flex-col">
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${msg.role === 'bot' ? 'bg-olive-500/20 border border-olive-500/30' : 'bg-bg-raised'}`}>
                  {msg.role === 'bot' ? <Shield className="w-5 h-5 text-olive-500" /> : <div className="w-5 h-5 bg-text-muted rounded-full" />}
                </div>

                {/* Message Box */}
                <div className={`max-w-[80%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-4 rounded-[16px] ${msg.role === 'user' ? 'bg-olive-500 border border-olive-400 text-white rounded-tr-none' : 'bg-bg-raised border border-bg-overlay text-text-secondary rounded-tl-none'}`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 shrink-0 rounded-full bg-olive-500/20 border border-olive-500/30 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-olive-500" />
                </div>
                <div className="bg-bg-raised border border-bg-overlay p-4 rounded-[16px] rounded-tl-none flex items-center gap-2">
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-2 h-2 rounded-full bg-olive-500" />
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-2 h-2 rounded-full bg-olive-500" />
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-2 h-2 rounded-full bg-olive-500" />
                </div>
              </div>
            )}
          </div>

          {/* Quick Replies */}
          <div className="px-6 pb-2 flex flex-wrap gap-2">
            {quickReplies.map((reply, i) => (
              <button 
                key={i}
                onClick={() => handleSend(reply)}
                disabled={isLoading}
                className="text-sm bg-bg-raised hover:bg-olive-500/20 border border-bg-overlay text-text-muted hover:text-olive-500 px-4 py-2 rounded-[8px] transition-colors disabled:opacity-50 font-bold"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-bg-deep border-t border-bg-overlay flex gap-2">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="relative flex items-center flex-grow gap-2"
            >
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اسأل حارس الحقيقة..."
                disabled={isLoading}
                className="flex-grow bg-bg-base border border-bg-overlay focus:border-olive-500 focus:outline-none rounded-[8px] px-4 py-3 text-sm text-text-primary placeholder-text-muted transition-colors disabled:opacity-50"
                dir="rtl"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-12 h-12 flex items-center justify-center bg-olive-500 hover:bg-olive-400 disabled:bg-bg-raised disabled:text-text-muted text-white rounded-[8px] transition-colors group flex-shrink-0"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 rtl:-scale-x-100 group-hover:-translate-x-1 transition-transform" />}
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}
