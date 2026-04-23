import { useState, useRef } from 'react';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

declare global {
  interface Window {
    tmImage: any;
  }
}

type ScanStatus = 'idle' | 'selected' | 'scanning' | 'complete' | 'error';

interface ScanResult {
  embroideryType: string;
  origin: string;
  patterns: string;
  confidence: number;
  verified: boolean;
  details: string;
}

export default function PatternScanner() {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatus('error');
      setErrorMsg('الرجاء رفع صورة صالحة');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string);
      setStatus('selected');
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const startScan = async () => {
    if (!imageSrc || !imageRef.current) return;
    setStatus('scanning');
    
    try {
      // 1. Load Teachable Machine Model
      const URL = "https://teachablemachine.withgoogle.com/models/DV5JcaVPW/";
      const modelURL = URL + "model.json";
      const metadataURL = URL + "metadata.json";

      if (!window.tmImage) {
        throw new Error("لم يتم تحميل مكتبة تحليل الصور، تأكد من الاتصال بالانترنت.");
      }

      const model = await window.tmImage.load(modelURL, metadataURL);
      
      // 2. Predict
      const predictions = await model.predict(imageRef.current);
      if (!predictions || predictions.length === 0) {
          throw new Error("فشل الموديل في تحليل الصورة");
      }

      // Get top prediction
      const topPrediction = predictions.reduce((prev: any, current: any) => 
        (prev.probability > current.probability) ? prev : current
      );

      // 3. Send top prediction to Groq to generate explanatory details
      const response = await fetch('/api/scan-pattern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          className: topPrediction.className,
          probability: topPrediction.probability 
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'فشل الفحص: تأكد من مفتاح الـ API');
      }

      const data = await response.json();
      setResult(data);
      setStatus('complete');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'حدث خطأ أثناء فحص الصورة. حاول مرة أخرى.');
    }
  };

  return (
    <section id="scanner" className="py-24 px-6 relative z-10 w-full max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-12">
        <div className="w-1.5 h-10 bg-olive-500 rounded-full" />
        <h2 className="text-4xl font-bold font-amiri text-text-primary">محلل الأنماط التراثية</h2>
      </div>

      <div className="bg-bg-surface border border-olive-500/25 rounded-[16px] p-8 grid grid-cols-1 lg:grid-cols-2 gap-12 shadow-2xl relative overflow-hidden">
        
        {/* Right Column (Controls) */}
        <div className="flex flex-col justify-center space-y-8 relative z-20">
          <div>
            <h3 className="text-2xl font-bold mb-4 font-amiri text-olive-500">التحقق الذكي من التطريز</h3>
            <p className="text-text-secondary leading-relaxed text-lg">
              ارفع صورة لقطعة تطريز، وسيقوم نظام التحقق الذكي بتحليلها ومطابقتها 
              لتحديد الأصل الجغرافي، نوع الغرزة، والمعاني الرمزية للأنماط لحمايتها من التزوير الثقافي.
            </p>
          </div>

          <div className="space-y-4 font-cairo">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 border border-dashed border-olive-500/40 hover:bg-olive-500/10 rounded-[8px] flex items-center justify-center gap-3 text-text-secondary hover:text-text-primary transition-all bg-bg-base"
            >
              <Upload className="w-5 h-5 text-olive-500" />
              <span className="font-bold">اختر صورة من جهازك</span>
            </button>

            <button
              onClick={startScan}
              disabled={status === 'scanning' || status === 'idle'}
              className={`w-full py-4 rounded-[8px] font-bold text-lg transition-all flex items-center justify-center gap-2
                ${(status === 'idle') ? 'bg-bg-raised text-text-muted cursor-not-allowed border border-bg-overlay' : ''}
                ${status === 'selected' || status === 'error' || status === 'complete' ? 'bg-olive-500 text-white olive-glow hover:bg-olive-400' : ''}
                ${status === 'scanning' ? 'bg-olive-400 text-white cursor-wait relative overflow-hidden' : ''}
              `}
            >
              {status === 'scanning' ? (
                <>
                  <span className="relative z-10">جاري التحليل المعرفي...</span>
                  <motion.div 
                    initial={{ left: '-100%' }}
                    animate={{ left: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-text-primary/20 to-transparent"
                  />
                </>
              ) : (
                'بدء الفحص الذكي'
              )}
            </button>

            {status === 'error' && (
              <div className="flex items-center gap-2 text-tatreez-300 mt-2">
                <AlertCircle className="w-5 h-5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Left Column (Visualizer) */}
        <div className="relative aspect-square md:aspect-auto md:h-[600px] rounded-[16px] overflow-hidden glass border-none flex items-center justify-center">
          
          <div className="absolute inset-0 tatreez-pattern opacity-40 mix-blend-overlay pointer-events-none" />

          {!imageSrc && (
            <div className="w-[80%] max-w-[400px] aspect-square border-2 border-dashed border-olive-500/40 rounded-[16px] flex flex-col items-center justify-center relative z-10 bg-bg-base/50 backdrop-blur-md">
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-olive-500"></div>
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-olive-500"></div>
              <Upload className="w-16 h-16 mb-4 text-olive-500 !stroke-1" />
              <p className="text-xl text-text-secondary font-cairo">ارفع صورة للفحص</p>
            </div>
          )}

          {imageSrc && (
            <img 
              ref={imageRef}
              src={imageSrc} 
              alt="Scan preview" 
              crossOrigin="anonymous"
              className={`w-full h-full object-cover relative z-10 rounded-[16px] transition-all duration-700 ${status === 'scanning' ? 'opacity-60 scale-105 blur-[2px]' : 'opacity-100 scale-100 blur-0'}`}
            />
          )}

          {/* Scanning Overlay Animations */}
          {status === 'scanning' && (
            <>
              <div className="laser-line z-20" />
              {/* Corner brackets */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-tatreez-400 z-20 animate-pulse" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-tatreez-400 z-20 animate-pulse" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-tatreez-400 z-20 animate-pulse" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-tatreez-400 z-20 animate-pulse" />
            </>
          )}

          {/* Results Overlay */}
          {status === 'complete' && result && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute bottom-4 left-4 right-4 glass rounded-[16px] p-6 z-30 olive-glow border-none"
            >
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-olive-500/20">
                <div className="flex items-center gap-2 text-olive-500">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="font-bold text-lg font-cairo text-text-primary">تم التحقق بنجاح</span>
                </div>
                {result.verified && (
                  <span className="bg-olive-500/15 text-olive-500 border border-olive-500 px-3 py-1 rounded-[8px] text-sm font-bold font-cairo">
                    أصل فلسطيني موثق ✓
                  </span>
                )}
              </div>
              
              <div className="space-y-3 text-sm md:text-base font-cairo">
                <div className="flex border-b border-bg-overlay pb-2">
                  <span className="text-text-muted w-1/3">المنطقة الجغرافية:</span>
                  <span className="text-text-primary font-bold">{result.origin}</span>
                </div>
                <div className="flex border-b border-bg-overlay pb-2">
                  <span className="text-text-muted w-1/3">نوع التطريز/الغرزة:</span>
                  <span className="text-text-primary">{result.embroideryType}</span>
                </div>
                <div className="flex border-b border-bg-overlay pb-2">
                  <span className="text-text-muted w-1/3">الأنماط والدلالات:</span>
                  <span className="text-text-primary">{result.patterns}</span>
                </div>
                <div className="pt-2">
                  <p className="text-text-secondary italic mb-3">"{result.details}"</p>
                  <div className="flex items-center gap-4">
                    <span className="text-text-muted text-sm border-olive-500/20">مستوى الثقة:</span>
                    <div className="flex-1 h-2 bg-bg-raised rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${result.confidence}%` }}
                        transition={{ duration: 1 }}
                        className="h-full bg-olive-500"
                      />
                    </div>
                    <span className="text-olive-500 font-bold font-mono text-sm">%{result.confidence}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </div>

      </div>
    </section>
  );
}
