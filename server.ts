import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';

// AI Studio environment provides GEMINI_API_KEY

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 images
  app.use(express.json({ limit: '50mb' }));

  // --- API ROUTES ---

  app.get('/api/debug-key', (req, res) => {
    const key = process.env.GROQ_API_KEY;
    res.json({
      exists: !!key,
      length: key ? key.length : 0,
      prefix: key ? key.substring(0, 8) : null
    });
  });

  app.post('/api/scan-pattern', async (req, res) => {
    try {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GROQ_API_KEY is not configured.' });
      }

      const { className, probability } = req.body;
      
      if (!className) {
        return res.status(400).json({ error: 'No classification provided' });
      }

      const promptText = `أنت خبير أكاديمي محترف في التراث الفلسطيني وفن التطريز.
قام نموذج ذكاء اصطناعي (Teachable Machine) مخصص بتحليل صورة لثوب، وقد صنفه على أنه "${className}" بنسبة يقين تعادل ${Math.round(probability * 100)}%.

اليك القواعد التالية حول الفروقات بين الأثواب:
يكمن الفرق الجوهري بين التطريز الفلسطيني والأردني في الأنماط والرموز؛ فالتطريز الفلسطيني (كـثوب بئر السبع أو رام الله) يتميز بألوان زاهية ونقوش مستوحاة من البيئة (أشجار، طيور، أزهار) بخيوط الحرير والقصب، بينما يميل التطريز الأردني (مثل المدرقة الأردنية) إلى الزخارف الهندسية المعقدة، واللون الأحمر النبيذي أو الألوان الداكنة، بتصاميم تعكس التراث البدوي والحضري.

فيما يلي الفرق بين التطريز الفلسطيني في أبرز المدن والمناطق الفلسطينية:
1. القدس ورام الله: الأناقة، خيوط حرير بألوان زاهية، يسود اللون الأحمر النبيذي (العنابي) مع أخضر وأزرق وأصفر. زخارف تعكس البيئة النجمة، الزيتون.
2. بيت لحم: "ثوب الملك"، مخمل، تطريز كثيف بخيوط الحرير والذهب.
3. الخليل والجنوب (بئر السبع): جرأة وقوة، أحمر برتقالي ممزوج بأزرق غامق، زخارف هندسية قوية.
4. غزة والساحل: أقمشة خفيفة، لون أزرق شائع وأحمر داكن وأرجواني، دمج زخارف بحرية.
5. الشمال (يافا، طولكرم، نابلس): ألوان مفتوحة، خيوط حرير فاتحة، الثوب المردن بشيفون وألوان فاتحة وقفطان مخمل.

بناءً على تصنيف الموديل (${className})، قم بكتابة تفاصيل علمية دقيقة تصف هذا الثوب وصبه في مخرجات JSON التالية:

{
  "embroideryType": "${className}",
  "origin": string, // اكتب المنطقة بناءً على فهمك للتصنيف
  "patterns": string, // الأنماط والرموز التقريبية بناء على التصنيف، مثل النجمة لرام الله او الزجزاج للجنوب
  "confidence": ${Math.round(probability * 100)},
  "verified": ${probability > 0.6},
  "details": string // اشرح علمياً التطابق مع القواعد المذكورة ولماذا صنف هكذا
}

أجب بصيغة JSON فقط بدون أي نص خارج الـ JSON.`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1500,
          temperature: 0.2,
          messages: [
            {
              role: "user",
              content: promptText
            }
          ]
        })
      });

      if (!response.ok) {
        const errResult = await response.text();
        throw new Error(`Groq Error: ${errResult}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '{}';
      
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        // Fallback robust parsing if model wraps in markdown
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[1] : text);
      }
      
      res.json(parsed);
    } catch (error: any) {
      console.error('Scan Pattern Error:', error?.message || error);
      let errorMessage = error?.message || 'Failed to scan pattern';
      
      if (typeof errorMessage === 'string' && errorMessage.includes('Quota exceeded')) {
        errorMessage = 'لقد تجاوزت الحد المسموح للاستخدام المجاني (Quota Exceeded).';
      }
      
      res.status(500).json({ error: errorMessage });
    }
  });

  app.post('/api/truth-guard', async (req, res) => {
    try {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GROQ_API_KEY is not configured.' });
      }

      const { message, history } = req.body;

      const systemInstruction = `أنت حارس الحقيقة الفلسطينية. متخصص حصراً في التاريخ والتراث الفلسطيني.

تغطي: النكبة 1948، القرى المهجّرة، التطريز، الثقافة، الشخصيات التاريخية، الجغرافيا الفلسطينية.

قواعد:
- أجب بالعربية فقط
- لا تخترع معلومات
- ارفض أي سؤال خارج التراث الفلسطيني

مراجعك: palestineremembered.com، nakba-archive.org، palmuseum.org، info.wafa.ps، zochrot.org`.trim();

      const messages = [];
      messages.push({ role: 'system', content: systemInstruction });
      messages.push({ role: 'user', content: message });

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1000,
          temperature: 0.3,
          messages: messages
        })
      });

      if (!response.ok) {
        const errResult = await response.text();
        throw new Error(`Groq Error: ${errResult}`);
      }

      const data = await response.json();
      const fullText = data.choices?.[0]?.message?.content || '';
      
      res.json({ reply: fullText.trim() });
    } catch (error: any) {
      console.error('Truth Guard Error:', error?.message || error);
      let errorMessage = error?.message || 'Failed to communicate with Truth Guard';
      
      if (typeof errorMessage === 'string' && errorMessage.includes('Quota exceeded')) {
        errorMessage = 'لقد تجاوزت الحد المسموح للاستخدام المجاني (Quota Exceeded).';
      }
      
      res.status(500).json({ error: errorMessage });
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Produciton serve logic
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
