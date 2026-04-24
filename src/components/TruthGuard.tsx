import { Loader2, Send, ShieldCheck, UserRound } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Section, cn } from './ui';

type TruthStatus = 'verified' | 'needs_context' | 'possibly_inaccurate';

interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
  status?: TruthStatus;
  confidence?: number;
}

const statusMeta: Record<TruthStatus, { label: string; variant: 'strong' | 'muted' | 'red' }> = {
  verified: { label: 'موثق', variant: 'strong' },
  needs_context: { label: 'يحتاج سياق', variant: 'muted' },
  possibly_inaccurate: { label: 'قد يكون غير دقيق', variant: 'red' }
};

function normalizeStatus(status: unknown): TruthStatus | undefined {
  if (status === 'verified' || status === 'needs_context' || status === 'possibly_inaccurate') {
    return status;
  }
  return undefined;
}

export default function TruthGuard() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'bot',
      text:
        'مرحباً، أساعدك على فحص الروايات والمعلومات المرتبطة بالتراث والتاريخ الفلسطيني بلغة هادئة. سأوضح إن كانت المعلومة موثقة، تحتاج سياقاً، أو قد تكون غير دقيقة.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string = input) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
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
        throw new Error(errData.error || 'تعذر الاتصال بخدمة التحقق الآن.');
      }

      const data = await response.json();
      const status = normalizeStatus(data.status);
      const confidence = Number.isFinite(Number(data.confidence))
        ? Math.max(0, Math.min(100, Math.round(Number(data.confidence))))
        : undefined;

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: data.reply || 'أحتاج إلى سياق إضافي قبل تقديم إجابة دقيقة.',
        status,
        confidence
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        status: 'needs_context',
        confidence: 0,
        text: error.message || 'حدث خطأ في الاتصال. يرجى المحاولة لاحقاً.'
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickReplies = [
    'ما السياق التاريخي للكوفية الفلسطينية؟',
    'أعطني نظرة عامة عن الصابون النابلسي',
    'كيف أتحقق من معلومة عن قرية فلسطينية؟'
  ];

  return (
    <Section
      id="truth-guard"
      className="truth-section"
      align="center"
      eyebrow={
        <>
          <ShieldCheck size={15} aria-hidden="true" />
          حارس السردية
        </>
      }
      title="Narrative Guardian AI"
      subtitle="مساعد تحقق هادئ يوازن بين المعلومة والسياق، ويعرض مستوى الثقة دون ادعاءات قاطعة."
    >
      <div className="truth-panel ui-card">
        <div ref={messagesContainerRef} className="truth-messages">
          {messages.map((msg) => {
            const meta = msg.status ? statusMeta[msg.status] : null;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('truth-message', msg.role === 'user' && 'truth-message--user')}
              >
                <div className="truth-avatar" aria-hidden="true">
                  {msg.role === 'bot' ? <ShieldCheck size={19} /> : <UserRound size={19} />}
                </div>

                <div className="truth-bubble">
                  {meta && (
                    <div className="truth-status">
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                      {typeof msg.confidence === 'number' && (
                        <span className="truth-confidence">الثقة: {msg.confidence}%</span>
                      )}
                    </div>
                  )}
                  <p>{msg.text}</p>
                </div>
              </motion.div>
            );
          })}

          {isLoading && (
            <div className="truth-message">
              <div className="truth-avatar" aria-hidden="true">
                <ShieldCheck size={19} />
              </div>
              <div className="truth-bubble flex items-center gap-2">
                <Loader2 className="animate-spin" size={18} aria-hidden="true" />
                <span>أراجع السياق قبل الإجابة...</span>
              </div>
            </div>
          )}
        </div>

        <div className="truth-quick">
          {quickReplies.map((reply) => (
            <Button
              key={reply}
              variant="subtle"
              size="sm"
              disabled={isLoading}
              onClick={() => handleSend(reply)}
            >
              {reply}
            </Button>
          ))}
        </div>

        <div className="truth-input">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب معلومة أو سؤالاً للتحقق..."
              disabled={isLoading}
              className="form-field"
              dir="rtl"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="ui-button ui-button--primary ui-button--icon"
              aria-label="إرسال"
            >
              {isLoading ? <Loader2 className="animate-spin" size={19} /> : <Send size={19} className="rtl:-scale-x-100" />}
            </button>
          </form>
        </div>
      </div>
    </Section>
  );
}
