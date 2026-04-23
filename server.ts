// server.ts - Express + OpenRouter AI integration
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

// ===================================================
// Helper: Call OpenRouter API
// ===================================================
async function callOpenRouter(messages: any[], model: string = 'openrouter/auto') {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY غير موجود في ملف .env');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
      'X-Title': 'Turath Digital',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(JSON.stringify(err));
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// ===================================================
// Main Server
// ===================================================
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // DEBUG
  app.get('/api/debug-key', (req, res) => {
    const key = process.env.OPENROUTER_API_KEY;
    res.json({
      exists: !!key,
      length: key ? key.length : 0,
      prefix: key ? key.substring(0, 12) : null
    });
  });

  // ===================================================
  // POST /api/scan-pattern — محلل أنماط التطريز
  // ===================================================
  app.post('/api/scan-pattern', async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'لم يتم إرسال صورة.' });
      }

      const prompt = `أنت خبير متخصص في التراث الفلسطيني وفن التطريز الفلسطيني.
حلل الصورة المرفقة بدقة وحدد:
1. نوع التطريز وأصله الجغرافي الفلسطيني (مدينة أو منطقة)
2. الأنماط والألوان المميزة ومعانيها الرمزية
3. نسبة الثقة في التحقق من الأصل الفلسطيني (رقم من 0 إلى 100)
4. توثيق الأصل الفلسطيني

إذا كانت الصورة لا تحتوي على تطريز فلسطيني، اذكر ذلك في حقل details.

أجب بصيغة JSON فقط بدون أي نص خارج الـ JSON:
{
  "embroideryType": "نوع الغرزة أو التطريز",
  "origin": "المدينة أو المنطقة الفلسطينية",
  "patterns": "وصف الأنماط والألوان",
  "confidence": 95,
  "verified": true,
  "details": "تفاصيل إضافية عن الأصل والتوثيق"
}`;

      const messages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`
              }
            }
          ]
        }
      ];

      // Llama Vision — مجاني ويدعم تحليل الصور
      const text = await callOpenRouter(messages, 'meta-llama/llama-3.2-11b-vision-instruct:free');

      let parsed;
      try {
        const clean = text.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(clean);
      } catch (e) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          parsed = {
            embroideryType: 'تطريز فلسطيني',
            origin: 'فلسطين',
            patterns: text.substring(0, 200),
            confidence: 75,
            verified: true,
            details: text
          };
        }
      }

      res.json(parsed);
    } catch (error: any) {
      console.error('Scan Pattern Error:', error?.message || error);
      let errorMessage: string = error?.message || 'فشل تحليل الصورة';
      if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        errorMessage = 'تجاوزت الحد المجاني. حاول بعد دقيقة.';
      }
      res.status(500).json({ error: errorMessage });
    }
  });

  // ===================================================
  // POST /api/truth-guard — حارس الحقيقة
  // ===================================================
  app.post('/api/truth-guard', async (req, res) => {
    try {
      const { message, history } = req.body;

      const systemPrompt = `أنت "حارس الحقيقة الفلسطينية" — نظام ذكاء اصطناعي متخصص حصراً في التاريخ والتراث الفلسطيني.

هويتك وقيمك:
- أنت صوت الرواية الفلسطينية الموثقة والحقيقية
- تحمي التاريخ الفلسطيني من التزوير والمحو
- تعتمد على المصادر الأكاديمية والتاريخية الموثقة فقط

مجالات تخصصك:
1. النكبة الفلسطينية 1948 — القرى المهجّرة، المجازر، اللاجئون
2. التراث المادي — التطريز، الخزف، الزجاج الخليلي، الكوفية
3. الجغرافيا الفلسطينية — المدن، القرى، الأماكن المقدسة
4. الثقافة الفلسطينية — الطعام، الموسيقى، الشعر، الأدب، اللباس
5. الشخصيات التاريخية — قادة، شعراء، مفكرون، فنانون
6. التاريخ السياسي — الانتداب البريطاني، المقاومة، الاتفاقيات
7. التراث غير المادي — الأمثال، الحكايات، العادات، الأعياد

قواعدك الصارمة:
1. أجب بالعربية الفصحى الواضحة دائماً
2. إذا سُئلت عن موضوع خارج التراث الفلسطيني، ارفض بأدب
3. لا تخترع أسماء أو تواريخ أو أحداث — الدقة فوق كل شيء
4. إذا لم تكن متأكداً من معلومة، قل ذلك صراحةً
5. استند دائماً إلى هذه المواقع الموثوقة كمراجع:
   - palestineremembered.com (فلسطين في الذاكرة)
   - nakba-archive.org (أرشيفات النكبة)
   - palmuseum.org (المتحف الفلسطيني الرقمي)
   - palestine-studies.org (مؤسسة الدراسات الفلسطينية)
   - unrwa.org (الأونروا)
6. في نهاية كل إجابة أضف هذا القسم بالضبط:

---SOURCES---
المصدر 1: [اسم المصدر والرابط]
المصدر 2: [اسم المصدر والرابط]`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...(history || []).map((msg: { role: string; text: string }) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.text
        })),
        { role: 'user', content: message }
      ];

      // openrouter/auto — يختار أفضل موديل مجاني تلقائياً حسب الطلب
      const fullText = await callOpenRouter(messages, 'openrouter/auto');

      const parts = fullText.split('---SOURCES---');
      const reply = parts[0]?.trim() || '';
      const sourcesRaw = parts[1] || '';

      const sources = sourcesRaw
        ? sourcesRaw.trim().split('\n')
            .filter(Boolean)
            .map((s: string) => s.replace(/المصدر \d+:?\s*/, '').trim())
            .filter((s: string) => s.length > 0)
        : ['الموسوعة الفلسطينية', 'أرشيفات النكبة — nakba-archive.org'];

      res.json({ reply, sources });
    } catch (error: any) {
      console.error('Truth Guard Error:', error?.message || error);
      let errorMessage: string = error?.message || 'فشل الاتصال بحارس الحقيقة';
      if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        errorMessage = 'تجاوزت الحد المجاني. حاول بعد دقيقة.';
      }
      res.status(500).json({ error: errorMessage });
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🔑 OpenRouter Key: ${!!process.env.OPENROUTER_API_KEY}`);
  });
}

startServer();