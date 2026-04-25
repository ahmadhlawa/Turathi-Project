import {
  ArrowUp,
  BookMarked,
  Bot,
  FileText,
  type LucideIcon,
  Library,
  Loader2,
  Menu,
  MessageSquareText,
  Mic,
  Music2,
  PanelLeft,
  PenLine,
  Plus,
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  X
} from 'lucide-react';
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { publicAsset } from '../lib/assets';
import { cn } from './ui';

declare global {
  interface Window {
    tmImage: any;
  }
}

type ToolId = 'guardian' | 'pattern' | 'proverbs' | 'stories' | 'songs' | 'sources';
type Role = 'assistant' | 'user';

interface ScanResult {
  cityName: string;
  probableRegion: string;
  embroideryType: string;
  visualEvidence: string[];
  confidence: number;
  matchLabel: string;
  culturalNotes: string;
  recommendation: string;
}

interface ChatMessage {
  id: string;
  role: Role;
  text?: string;
  imageSrc?: string;
  result?: ScanResult;
  proverb?: string;
  status?: string;
  confidence?: number;
  isLoading?: boolean;
}

interface PendingImage {
  name: string;
  src: string;
}

interface Prediction {
  className: string;
  probability: number;
}

const tools: Array<{
  id: ToolId;
  label: string;
  caption: string;
  placeholder: string;
  icon: LucideIcon;
  greeting: string;
  quickPrompts: string[];
}> = [
  {
    id: 'guardian',
    label: 'حارس السردية الفلسطينية',
    caption: 'الأداة الأساسية',
    placeholder: 'اسأل حارس السردية الفلسطينية...',
    icon: ShieldCheck,
    greeting:
      'أنا حارس السردية الفلسطينية. أجيب من داخل فلسطين وبالمسميات الفلسطينية، وأعتمد فقط على المراجع الفلسطينية المعتمدة هنا.',
    quickPrompts: ['تحقق من رواية عن قرية فلسطينية', 'ما السياق التراثي للكوفية؟', 'كيف أوثق معلومة فلسطينية؟']
  },
  {
    id: 'pattern',
    label: 'تحليل النمط الصوري',
    caption: 'قراءة تطريز من صورة',
    placeholder: 'اكتب ملاحظة وارفع صورة للنمط...',
    icon: ScanLine,
    greeting: 'ارفع صورة تطريز فلسطيني، وسأقرأ النمط كرسالة داخل المحادثة.',
    quickPrompts: ['حلل هذا التطريز', 'ما المدينة المحتملة؟', 'ما الأدلة البصرية؟']
  },
  {
    id: 'proverbs',
    label: 'الأمثال الشعبية',
    caption: 'شرح واقتراح أمثال',
    placeholder: 'اكتب موقفاً أو مثلاً فلسطينياً...',
    icon: MessageSquareText,
    greeting: 'احكِ لي الموقف أو اكتب المثل، وسأقترح قراءة فلسطينية مناسبة.',
    quickPrompts: ['موقف عن الصبر', 'اشرح مثل الجار قبل الدار', 'مثل عن الغربة']
  },
  {
    id: 'stories',
    label: 'القصص الشعبية الفلسطينية',
    caption: 'حكايات وسرد شفهي',
    placeholder: 'اطلب قصة شعبية فلسطينية...',
    icon: BookMarked,
    greeting: 'اطلب حكاية فلسطينية قصيرة مرتبطة بقرية، موسم، حرفة، أو قيمة شعبية.',
    quickPrompts: ['قصة عن موسم الزيتون', 'حكاية من قرية فلسطينية', 'قصة قصيرة للأطفال']
  },
  {
    id: 'songs',
    label: 'الأهازيج والأغاني',
    caption: 'سياق ومعاني غنائية',
    placeholder: 'اسأل عن أهزوجة أو مناسبة فلسطينية...',
    icon: Music2,
    greeting: 'اسأل عن الأهازيج الفلسطينية ومناسباتها ومعانيها وسياقها الشعبي.',
    quickPrompts: ['أهازيج الحصاد', 'أغاني الأعراس الفلسطينية', 'معنى الدلعونا']
  },
  {
    id: 'sources',
    label: 'المراجع والمصادر الفلسطينية',
    caption: 'أرشيفات ومواد بحث',
    placeholder: 'اسأل عن مصدر فلسطيني مناسب...',
    icon: Library,
    greeting:
      'هذه هي المراجع الفلسطينية المعتمدة فقط داخل حارس السردية. موسوعة التراث الفلسطيني هي المرجع الرئيسي للأمثال والأهازيج والقصص.',
    quickPrompts: ['مصادر عن القرى', 'أرشيف صور فلسطيني', 'مراجع عن التطريز']
  }
];

const toolById = Object.fromEntries(tools.map((tool) => [tool.id, tool])) as Record<ToolId, (typeof tools)[number]>;

const scopedPrompts: Record<ToolId, string> = {
  guardian: 'ضمن حارس السردية الفلسطينية، أجب عن: ',
  pattern: 'ضمن التطريز الفلسطيني وتحليل الأنماط الصورية، أجب عن: ',
  proverbs: '',
  stories: 'ضمن القصص الشعبية الفلسطينية والسرد الشفهي الفلسطيني، أجب عن: ',
  songs: 'ضمن الأهازيج والأغاني الشعبية الفلسطينية، أجب عن: ',
  sources: 'ضمن المراجع والمصادر الفلسطينية والأرشيفات الفلسطينية، أجب عن: '
};

const sourceLibrary = [
  {
    title: 'موسوعة التراث الفلسطيني',
    description: 'المرجع الرئيسي للأمثال والأهازيج والأغاني والقصص الشعبية الفلسطينية.',
    url: 'https://palturath.com/ar'
  },
  {
    title: 'أرشيف المتحف الفلسطيني الرقمي',
    description: 'صور ووثائق وسجلات ومواد صوتية وبصرية من الذاكرة الفلسطينية.',
    url: 'https://palarchive.org/'
  },
  {
    title: 'مؤسسة الدراسات الفلسطينية',
    description: 'دراسات وملفات وموسوعات متخصصة في التاريخ والقضية الفلسطينية.',
    url: 'https://www.palestine-studies.org/'
  },
  {
    title: 'المتحف الفلسطيني',
    description: 'برامج ومعارض ومواد معرفية مرتبطة بالثقافة الفلسطينية.',
    url: 'https://palmuseum.org/'
  },
  {
    title: 'Palestine Poster Project Archives',
    description: 'أرشيف بصري واسع للملصق الفلسطيني وسياقاته الفنية والسياسية.',
    url: 'https://www.palestineposterproject.org/'
  }
];

const allowedReferencesText = sourceLibrary.map((source) => `- ${source.title}: ${source.url}`).join('\n');

const modelGuardrails = `تعليمات ملزمة:
- اجعل المراجع الفلسطينية التالية هي المراجع الأساسية عند تقديم إجابة معرفية أو توجيه بحثي:
${allowedReferencesText}
- في الأمثال والأهازيج والأغاني والقصص الشعبية، اعتبر "موسوعة التراث الفلسطيني - https://palturath.com/ar" المرجع الرئيسي الأول.
- إذا كتب المستخدم اسم قرية أو بلدة أو مخيم فقط، عامله كاسم فلسطيني مرشح. أجب بحذر إذا كان الاسم معروفاً أو محتملاً، واذكر الحاجة إلى المحافظة أو مصدر إضافي عند الشك.
- في القرى والمخيمات اعتمد أرشيف المتحف الفلسطيني الرقمي ومؤسسة الدراسات الفلسطينية والمتحف الفلسطيني كإطار مرجعي.
- إن لم تكفِ هذه المراجع أو لم يتوفر سياق فلسطيني واضح، قل إن المعلومة تحتاج سياقاً أو تحققاً إضافياً بدل رفضها فوراً.
- التزم بالمسميات الفلسطينية فقط، واستخدم "الاحتلال الإسرائيلي" عند الحاجة للسياق الفلسطيني.`;

function createEmptyThreads(): Record<ToolId, ChatMessage[]> {
  return tools.reduce(
    (threads, tool) => ({
      ...threads,
      [tool.id]: []
    }),
    {} as Record<ToolId, ChatMessage[]>
  );
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function labelFromConfidence(confidence: number) {
  if (confidence >= 80) return 'مطابقة قوية';
  if (confidence >= 55) return 'مطابقة محتملة';
  if (confidence >= 30) return 'مطابقة ضعيفة';
  return 'مؤشرات غير كافية';
}

function normalizeScanResult(data: any, fallbackClassName: string, fallbackConfidence: number): ScanResult {
  const confidence = Math.max(
    0,
    Math.min(100, Number.isFinite(Number(data?.confidence)) ? Math.round(Number(data.confidence)) : fallbackConfidence)
  );
  const evidence = Array.isArray(data?.visualEvidence)
    ? data.visualEvidence
    : [data?.visualEvidence || data?.patterns].filter(Boolean);

  return {
    cityName: data?.cityName || data?.city || data?.town || 'غير محدد',
    probableRegion: data?.probableRegion || data?.origin || 'لا يمكن تحديد المنطقة من الصورة وحدها',
    embroideryType: data?.embroideryType || fallbackClassName || 'نمط تطريز غير محدد',
    visualEvidence:
      evidence.length > 0
        ? evidence
        : ['لا تظهر في الصورة تفاصيل كافية للحكم بثقة عالية على النمط أو المنطقة.'],
    confidence,
    matchLabel: data?.matchLabel || labelFromConfidence(confidence),
    culturalNotes:
      data?.culturalNotes ||
      data?.details ||
      'التحليل الرقمي قراءة مساندة للملامح البصرية، ولا يغني عن معرفة مصدر القطعة وسياقها الحرفي.',
    recommendation:
      data?.recommendation ||
      'استخدم صورة أمامية واضحة بإضاءة جيدة، ويفضل إضافة لقطة قريبة للغرز والزخارف.'
  };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result as string);
    reader.onerror = () => reject(new Error('تعذر قراءة الصورة المختارة.'));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('تعذر تجهيز الصورة للتحليل.'));
    image.src = src;
  });
}

export default function TurathiChatApp() {
  const [activeTool, setActiveTool] = useState<ToolId>('guardian');
  const [threads, setThreads] = useState<Record<ToolId, ChatMessage[]>>(() => createEmptyThreads());
  const [input, setInput] = useState('');
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeMessages = threads[activeTool];
  const activeConfig = toolById[activeTool];
  const hasConversation = activeMessages.length > 0;

  const activeIcon = useMemo(() => {
    const Icon = activeConfig.icon;
    return <Icon size={18} aria-hidden="true" />;
  }, [activeConfig]);
  const ActiveEmptyIcon = activeConfig.icon;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeMessages, isLoading]);

  const appendMessage = (tool: ToolId, message: ChatMessage) => {
    setThreads((prev) => ({
      ...prev,
      [tool]: [...prev[tool], message]
    }));
  };

  const replaceMessage = (tool: ToolId, messageId: string, message: ChatMessage) => {
    setThreads((prev) => ({
      ...prev,
      [tool]: prev[tool].map((item) => (item.id === messageId ? message : item))
    }));
  };

  const startNewChat = () => {
    setThreads((prev) => ({
      ...prev,
      [activeTool]: []
    }));
    setInput('');
    setPendingImage(null);
  };

  const selectTool = (toolId: ToolId) => {
    setActiveTool(toolId);
    setInput('');
    setPendingImage(null);
    setSidebarOpen(false);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      appendMessage(activeTool, {
        id: createId(),
        role: 'assistant',
        text: 'الملف غير مدعوم. ارفع صورة بصيغة JPG أو PNG أو WebP.'
      });
      event.target.value = '';
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      appendMessage(activeTool, {
        id: createId(),
        role: 'assistant',
        text: 'حجم الصورة كبير. الرجاء اختيار صورة أقل من 8MB.'
      });
      event.target.value = '';
      return;
    }

    const src = await readFileAsDataUrl(file);
    setPendingImage({ name: file.name, src });
    event.target.value = '';
  };

  const analyzePattern = async (text: string, image: PendingImage) => {
    const tool = activeTool;
    const loadingId = createId();
    appendMessage(tool, {
      id: createId(),
      role: 'user',
      text: text || 'حلل هذا النمط الصوري',
      imageSrc: image.src
    });
    appendMessage(tool, {
      id: loadingId,
      role: 'assistant',
      text: 'أحلل الغرز والزخارف وأقارنها بالمؤشرات الفلسطينية...',
      isLoading: true
    });

    try {
      if (!window.tmImage) {
        throw new Error('لم يتم تحميل مكتبة تحليل الصور. تأكد من اتصال الإنترنت ثم أعد المحاولة.');
      }

      const modelBaseUrl = 'https://teachablemachine.withgoogle.com/models/DV5JcaVPW/';
      const model = await window.tmImage.load(`${modelBaseUrl}model.json`, `${modelBaseUrl}metadata.json`);
      const imageElement = await loadImageElement(image.src);
      const predictions: Prediction[] = await model.predict(imageElement);

      if (!predictions || predictions.length === 0) {
        throw new Error('لم يتمكن النموذج من قراءة الصورة. جرّب صورة أوضح للقطعة.');
      }

      const rankedPredictions = [...predictions].sort((a, b) => b.probability - a.probability);
      const topPrediction = rankedPredictions[0];
      const fallbackConfidence = Math.round(topPrediction.probability * 100);

      const response = await fetch('/api/scan-pattern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className: topPrediction.className,
          probability: topPrediction.probability,
          predictions: rankedPredictions.slice(0, 3)
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'تعذر إكمال التحليل الآن.');
      }

      const data = await response.json();
      const result = normalizeScanResult(data, topPrediction.className, fallbackConfidence);
      replaceMessage(tool, loadingId, {
        id: loadingId,
        role: 'assistant',
        text: 'هذه قراءة مساندة للنمط من الصورة:',
        result
      });
    } catch (error: any) {
      replaceMessage(tool, loadingId, {
        id: loadingId,
        role: 'assistant',
        text: error.message || 'حدث خطأ أثناء تحليل الصورة. حاول مرة أخرى بصورة أوضح.'
      });
    }
  };

  const sendProverbMessage = async (text: string) => {
    const tool = activeTool;
    const loadingId = createId();
    appendMessage(tool, { id: createId(), role: 'user', text });
    appendMessage(tool, {
      id: loadingId,
      role: 'assistant',
      text: 'أراجع سياق المثل الفلسطيني...',
      isLoading: true
    });

    try {
      const response = await fetch('/api/proverb-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'تعذر تحليل المثل الآن.');
      }

      const data = await response.json();
      replaceMessage(tool, loadingId, {
        id: loadingId,
        role: 'assistant',
        proverb: data.proverb || '',
        text: data.explanation || 'أحتاج إلى صياغة أوضح كي أقترح مثلاً فلسطينياً مناسباً.'
      });
    } catch (error: any) {
      replaceMessage(tool, loadingId, {
        id: loadingId,
        role: 'assistant',
        text: error.message || 'حدث خطأ أثناء محادثة الأمثال.'
      });
    }
  };

  const sendScopedMessage = async (text: string) => {
    const tool = activeTool;
    const loadingId = createId();
    const scopedUserQuestion = tool === 'guardian' ? text : `${scopedPrompts[tool]}${text}`;
    appendMessage(tool, { id: createId(), role: 'user', text });
    appendMessage(tool, {
      id: loadingId,
      role: 'assistant',
      text: 'أراجع السياق الفلسطيني قبل الإجابة...',
      isLoading: true
    });

    try {
      const response = await fetch('/api/truth-guard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${modelGuardrails}

نطاق الأداة: ${scopedPrompts[tool]}
سؤال المستخدم: ${scopedUserQuestion}`
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'تعذر الاتصال بالمساعد الآن.');
      }

      const data = await response.json();
      replaceMessage(tool, loadingId, {
        id: loadingId,
        role: 'assistant',
        text: data.reply || 'أحتاج إلى سياق فلسطيني إضافي قبل تقديم إجابة دقيقة.',
        status: data.status,
        confidence: Number.isFinite(Number(data.confidence)) ? Math.round(Number(data.confidence)) : undefined
      });
    } catch (error: any) {
      replaceMessage(tool, loadingId, {
        id: loadingId,
        role: 'assistant',
        text: error.message || 'حدث خطأ في الاتصال. حاول مرة أخرى.'
      });
    }
  };

  const submitMessage = async (event?: FormEvent) => {
    event?.preventDefault();
    const text = input.trim();

    if (isLoading) return;
    if (activeTool === 'pattern' && !pendingImage && !text) return;
    if (activeTool !== 'pattern' && !text) return;

    setIsLoading(true);
    setInput('');

    try {
      if (activeTool === 'pattern') {
        if (!pendingImage) {
          appendMessage(activeTool, { id: createId(), role: 'user', text });
          appendMessage(activeTool, {
            id: createId(),
            role: 'assistant',
            text: 'ارفع صورة للنمط حتى أقدر أحلل التطريز داخل المحادثة.'
          });
          return;
        }
        const image = pendingImage;
        setPendingImage(null);
        await analyzePattern(text, image);
        return;
      }

      if (activeTool === 'proverbs') {
        await sendProverbMessage(text);
        return;
      }

      await sendScopedMessage(text);
    } finally {
      setIsLoading(false);
    }
  };

  const sendQuickPrompt = (prompt: string) => {
    if (activeTool === 'pattern') {
      setInput(prompt);
      fileInputRef.current?.click();
      return;
    }

    setInput(prompt);
    void sendTextDirectly(prompt);
  };

  const sendTextDirectly = async (prompt: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setInput('');
    try {
      if (activeTool === 'proverbs') {
        await sendProverbMessage(prompt);
      } else {
        await sendScopedMessage(prompt);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="turathi-ai-app">
      <aside className={cn('ai-sidebar', sidebarOpen && 'is-open')}>
        <div className="ai-sidebar__top">
          <div className="ai-brand">
            <img src={publicAsset('Logo-Turathi.jpeg')} alt="" />
            <div>
              <strong>تراثي AI</strong>
              <span>فلسطين فقط</span>
            </div>
          </div>

          <button className="ai-icon-btn ai-sidebar__close" type="button" onClick={() => setSidebarOpen(false)}>
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        <button className="ai-sidebar-action" type="button" onClick={startNewChat}>
          <PenLine size={18} aria-hidden="true" />
          <span>محادثة جديدة</span>
        </button>

        <button className="ai-sidebar-action ai-sidebar-action--ghost" type="button">
          <Search size={18} aria-hidden="true" />
          <span>بحث في المحادثات</span>
        </button>

        <div className="ai-sidebar__section">
          <span className="ai-sidebar__label">الأدوات</span>
          <nav className="ai-tool-list" aria-label="أدوات تراثي">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  type="button"
                  className={cn('ai-tool-button', activeTool === tool.id && 'is-active')}
                  onClick={() => selectTool(tool.id)}
                >
                  <Icon size={19} aria-hidden="true" />
                  <span>{tool.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="ai-sidebar__section ai-sidebar__recent">
          <span className="ai-sidebar__label">المحادثات</span>
          {tools.map((tool) => (
            <button key={tool.id} type="button" onClick={() => selectTool(tool.id)}>
              {threads[tool.id].length > 0 ? tool.label : `ابدأ: ${tool.label}`}
            </button>
          ))}
        </div>

        <div className="ai-sidebar__account">
          <span>AI</span>
          <div>
            <strong>حارس تراثي</strong>
            <small>مسميات فلسطينية</small>
          </div>
        </div>
      </aside>

      <main className="ai-main">
        <header className="ai-chat-header">
          <div className="ai-chat-header__left">
            <button className="ai-icon-btn ai-mobile-menu" type="button" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} aria-hidden="true" />
            </button>
            <div className="ai-model-title">
              <span>تراثي AI</span>
              <small>
                {activeIcon}
                {activeConfig.label}
              </small>
            </div>
          </div>

          <div className="ai-chat-header__actions">
            <button className="ai-icon-btn" type="button" onClick={startNewChat}>
              <Plus size={20} aria-hidden="true" />
            </button>
            <button className="ai-icon-btn" type="button" onClick={() => setSidebarOpen((value) => !value)}>
              <PanelLeft size={20} aria-hidden="true" />
            </button>
          </div>
        </header>

        <section className="ai-chat-body" aria-live="polite">
          {!hasConversation ? (
            <div className="ai-empty-state">
              <div className="ai-empty-state__icon">
                <ActiveEmptyIcon size={34} aria-hidden="true" />
              </div>
              <h1>{activeConfig.label}</h1>
              <p>{activeConfig.greeting}</p>

              {activeTool === 'sources' && <SourcePreview />}

              <div className="ai-prompt-row">
                {activeConfig.quickPrompts.map((prompt) => (
                  <button key={prompt} type="button" onClick={() => sendQuickPrompt(prompt)}>
                    <Sparkles size={15} aria-hidden="true" />
                    <span>{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="ai-message-list">
              {activeMessages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </section>

        <footer className="ai-composer-wrap">
          {pendingImage && (
            <div className="ai-attachment">
              <img src={pendingImage.src} alt="" />
              <span>{pendingImage.name}</span>
              <button type="button" onClick={() => setPendingImage(null)}>
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          )}

          <form className="ai-composer" onSubmit={submitMessage}>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            {activeTool === 'pattern' ? (
              <button
                className="ai-composer__control"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Upload size={20} aria-hidden="true" />
              </button>
            ) : (
              <button className="ai-composer__control" type="button" disabled>
                <Plus size={20} aria-hidden="true" />
              </button>
            )}

            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={activeConfig.placeholder}
              rows={1}
              disabled={isLoading}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void submitMessage();
                }
              }}
            />

            <button className="ai-composer__control" type="button" disabled>
              <Mic size={20} aria-hidden="true" />
            </button>

            <button
              className="ai-composer__send"
              type="submit"
              disabled={isLoading || (activeTool === 'pattern' ? !pendingImage && !input.trim() : !input.trim())}
            >
              {isLoading ? <Loader2 className="animate-spin" size={19} /> : <ArrowUp size={19} aria-hidden="true" />}
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  return (
    <article className={cn('ai-message', message.role === 'user' && 'ai-message--user')}>
      <div className="ai-message__avatar">
        {message.role === 'user' ? <span>أ</span> : <Bot size={18} aria-hidden="true" />}
      </div>

      <div className="ai-message__content">
        {message.imageSrc && <img className="ai-message__image" src={message.imageSrc} alt="" />}
        {message.isLoading ? (
          <div className="ai-thinking">
            <Loader2 className="animate-spin" size={17} aria-hidden="true" />
            <span>{message.text}</span>
          </div>
        ) : (
          <>
            {message.proverb && <strong className="ai-proverb">{message.proverb}</strong>}
            {message.text && <p>{message.text}</p>}
            {typeof message.confidence === 'number' && (
              <span className="ai-confidence">الثقة: {message.confidence}%</span>
            )}
            {message.result && <PatternResult result={message.result} />}
          </>
        )}
      </div>
    </article>
  );
}

function PatternResult({ result }: { result: ScanResult }) {
  return (
    <div className="ai-pattern-result">
      <div className="ai-pattern-result__head">
        <span>{result.matchLabel}</span>
        <strong>{result.confidence}%</strong>
      </div>

      <div className="ai-pattern-result__grid">
        <InfoBlock label="المدينة الفلسطينية المحتملة" value={result.cityName} />
        <InfoBlock label="الأصل أو المنطقة المحتملة" value={result.probableRegion} />
        <InfoBlock label="نوع النمط المقترح" value={result.embroideryType} />
        <InfoBlock label="ملاحظات ثقافية" value={result.culturalNotes} />
        <div className="ai-info-block ai-info-block--wide">
          <span>الأدلة البصرية</span>
          <ul>
            {result.visualEvidence.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
        <InfoBlock label="التوصية" value={result.recommendation} wide />
      </div>
    </div>
  );
}

function InfoBlock({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={cn('ai-info-block', wide && 'ai-info-block--wide')}>
      <span>{label}</span>
      <p>{value}</p>
    </div>
  );
}

function SourcePreview() {
  return (
    <div className="ai-source-grid">
      {sourceLibrary.map((source) => (
        <a key={source.title} href={source.url} target="_blank" rel="noreferrer">
          <FileText size={18} aria-hidden="true" />
          <strong>{source.title}</strong>
          <span>{source.description}</span>
        </a>
      ))}
    </div>
  );
}
