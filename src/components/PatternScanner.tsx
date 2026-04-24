import { AlertCircle, CheckCircle2, ImagePlus, ScanLine, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import type { ChangeEvent } from 'react';
import { useRef, useState } from 'react';
import { Badge, Button, LoadingSpinner, cn } from './ui';

declare global {
  interface Window {
    tmImage: any;
  }
}

type ScanStatus = 'idle' | 'selected' | 'scanning' | 'complete' | 'error';

interface Prediction {
  className: string;
  probability: number;
}

interface ScanResult {
  probableRegion: string;
  embroideryType: string;
  visualEvidence: string[];
  confidence: number;
  matchLabel: 'مطابقة قوية' | 'مطابقة محتملة' | 'مطابقة ضعيفة' | 'مؤشرات غير كافية';
  culturalNotes: string;
  recommendation: string;
}

const maxFileSize = 8 * 1024 * 1024;

function labelFromConfidence(confidence: number): ScanResult['matchLabel'] {
  if (confidence >= 80) return 'مطابقة قوية';
  if (confidence >= 55) return 'مطابقة محتملة';
  if (confidence >= 30) return 'مطابقة ضعيفة';
  return 'مؤشرات غير كافية';
}

function badgeVariant(label: ScanResult['matchLabel']) {
  if (label === 'مطابقة قوية') return 'strong';
  if (label === 'مطابقة محتملة') return 'default';
  return 'muted';
}

function normalizeResult(data: any, fallbackClassName: string, fallbackConfidence: number): ScanResult {
  const confidence = Math.max(
    0,
    Math.min(100, Number.isFinite(Number(data?.confidence)) ? Math.round(Number(data.confidence)) : fallbackConfidence)
  );
  const evidence = Array.isArray(data?.visualEvidence)
    ? data.visualEvidence
    : [data?.visualEvidence || data?.patterns].filter(Boolean);

  return {
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

export default function PatternScanner() {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatus('error');
      setImageSrc(null);
      setResult(null);
      setFileName('');
      setErrorMsg('الملف غير مدعوم. الرجاء رفع صورة بصيغة JPG أو PNG أو WebP.');
      e.target.value = '';
      return;
    }

    if (file.size > maxFileSize) {
      setStatus('error');
      setImageSrc(null);
      setResult(null);
      setFileName('');
      setErrorMsg('حجم الصورة كبير. الرجاء اختيار صورة أقل من 8MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string);
      setFileName(file.name);
      setStatus('selected');
      setResult(null);
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const startScan = async () => {
    if (!imageSrc || !imageRef.current || status === 'scanning') return;
    setStatus('scanning');
    setErrorMsg('');

    try {
      const URL = 'https://teachablemachine.withgoogle.com/models/DV5JcaVPW/';
      const modelURL = URL + 'model.json';
      const metadataURL = URL + 'metadata.json';

      if (!window.tmImage) {
        throw new Error('لم يتم تحميل مكتبة تحليل الصور. تأكد من اتصال الإنترنت ثم أعد المحاولة.');
      }

      const model = await window.tmImage.load(modelURL, metadataURL);
      const predictions: Prediction[] = await model.predict(imageRef.current);

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
        throw new Error(errData.error || 'تعذر إكمال التحليل الآن. تأكد من إعداد مفتاح API.');
      }

      const data = await response.json();
      setResult(normalizeResult(data, topPrediction.className, fallbackConfidence));
      setStatus('complete');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'حدث خطأ أثناء فحص الصورة. حاول مرة أخرى.');
    }
  };

  const canScan = Boolean(imageSrc) && status !== 'scanning';

  return (
    <section id="scanner" className="turathi-section scanner-section">
      <div className="turathi-container">
        <header className="turathi-section-header">
          <span className="section-eyebrow">
            <ScanLine size={15} aria-hidden="true" />
            تحليل بصري متوازن
          </span>
          <h2>محلل الأنماط التراثية</h2>
          <p>
            ارفع صورة لتطريز أو نمط تراثي، وسيقدم النظام قراءة هادئة تشمل الأصل المحتمل،
            الأدلة البصرية، مستوى الثقة، وملاحظة ثقافية دون مبالغة في التحذير.
          </p>
        </header>

        <div className="scanner-grid ui-card">
          <div className="scanner-copy">
            <div>
              <h3>تحليل التطريز باحترام للسياق</h3>
              <p>
                النتيجة ليست حكماً نهائياً على القطعة، بل قراءة مساندة من الصورة. عند ضعف
                الثقة سيعرض النظام مؤشرات غير كافية بدلاً من رسائل مخيفة أو اتهامية.
              </p>
            </div>

            <div className="scanner-actions">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              <Button
                variant="secondary"
                icon={<Upload size={18} aria-hidden="true" />}
                onClick={() => fileInputRef.current?.click()}
              >
                اختر صورة
              </Button>

              <Button
                onClick={startScan}
                disabled={!canScan}
                icon={status === 'scanning' ? <LoadingSpinner /> : <ScanLine size={18} aria-hidden="true" />}
              >
                {status === 'scanning' ? 'جاري التحليل' : 'بدء التحليل'}
              </Button>
            </div>

            {fileName && <Badge variant="muted">الصورة المختارة: {fileName}</Badge>}

            {status === 'error' && (
              <div className="ai-response ai-response--notice flex items-start gap-2">
                <AlertCircle size={20} aria-hidden="true" className="mt-1 text-tatreez-500" />
                <p className="m-0">{errorMsg}</p>
              </div>
            )}

            {status === 'complete' && result && (
              <div className="scanner-result ui-card">
                <div className="scanner-result__head">
                  <Badge variant={badgeVariant(result.matchLabel)}>{result.matchLabel}</Badge>
                  <span className="font-black text-olive-500">{result.confidence}% ثقة</span>
                </div>

                <div className="scanner-result__grid">
                  <div className="scanner-result__item">
                    <strong>الأصل أو المنطقة المحتملة</strong>
                    <p>{result.probableRegion}</p>
                  </div>

                  <div className="scanner-result__item">
                    <strong>نوع النمط المقترح</strong>
                    <p>{result.embroideryType}</p>
                  </div>

                  <div className="scanner-result__item">
                    <strong>الأدلة البصرية</strong>
                    <ul>
                      {result.visualEvidence.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="scanner-result__item">
                    <strong>ملاحظات ثقافية</strong>
                    <p>{result.culturalNotes}</p>
                  </div>

                  <div className="scanner-result__item">
                    <strong>التوصية</strong>
                    <p>{result.recommendation}</p>
                  </div>

                  <div className="confidence-meter" aria-label={`مستوى الثقة ${result.confidence}%`}>
                    <div className="confidence-meter__track">
                      <motion.div
                        className="confidence-meter__bar"
                        initial={{ width: 0 }}
                        animate={{ width: `${result.confidence}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="font-mono font-bold text-sm">{result.confidence}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={cn('scanner-preview', status === 'scanning' && 'is-loading')}>
            <div className="absolute inset-0 tatreez-pattern opacity-60" aria-hidden="true" />

            {!imageSrc && (
              <div className="scanner-placeholder">
                <ImagePlus size={54} strokeWidth={1.5} aria-hidden="true" />
                <span className="font-black">ارفع صورة واضحة للنمط</span>
                <small>يفضل أن تظهر الغرز والزخارف من الأمام</small>
              </div>
            )}

            {imageSrc && <img ref={imageRef} src={imageSrc} alt="معاينة الصورة المختارة للتحليل" />}

            {status === 'scanning' && (
              <>
                <motion.div
                  className="laser-line"
                  initial={{ top: '12%' }}
                  animate={{ top: '88%' }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'linear', repeatType: 'reverse' }}
                />
                <div className="scanner-overlay">
                  <CheckCircle2 size={20} aria-hidden="true" />
                  <span className="mr-2">نقرأ التفاصيل البصرية بهدوء...</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
