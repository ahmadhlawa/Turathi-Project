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
    const key = process.env.GEMINI_API_KEY1 || process.env.GEMINI_API_KEY;
    res.json({
      exists: !!key,
      length: key ? key.length : 0,
      prefix: key ? key.substring(0, 5) : null
    });
  });

  app.post('/api/scan-pattern', async (req, res) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY1 || process.env.GEMINI_API_KEY });
      const { imageBase64, mimeType } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ error: 'No image provided' });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          'أنت خبير في التراث الفلسطيني وفن التطريز. حلل الصورة المرفقة وحدد:\n1. نوع التطريز وأصله الجغرافي الفلسطيني (مدينة أو منطقة)\n2. الأنماط والألوان المميزة\n3. نسبة الثقة في التحقق (رقم من 0 إلى 100)\n4. توثيق الأصل الفلسطيني\nأجب بصيغة JSON فقط بدون أي نص خارج الـ JSON:\n{\n  "embroideryType": string,\n  "origin": string,\n  "patterns": string,\n  "confidence": number,\n  "verified": boolean,\n  "details": string\n}',
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType || 'image/jpeg',
            }
          }
        ],
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text();
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
      
      if (typeof errorMessage === 'string') {
        if (errorMessage.includes('API_KEY_INVALID')) {
          errorMessage = 'خطأ في مفتاح API: يرجى التحقق من المفتاح في الإعدادات.';
        } else if (errorMessage.includes('Quota exceeded') || error?.status === 429) {
          errorMessage = 'لقد تجاوزت الحد المسموح للاستخدام المجاني (Quota Exceeded). يرجى المحاولة لاحقاً، أو استخدام مفتاح API مدفوع.';
        }
      }
      
      res.status(500).json({ error: errorMessage });
    }
  });

  app.post('/api/truth-guard', async (req, res) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY1 || process.env.GEMINI_API_KEY });
      const { message, history } = req.body;

      const systemInstruction = `
      أنت حارس الحقيقة الفلسطينية.
      
      عند الإجابة:
      1. ابحث دائماً في المصادر الموثوقة
      2. اعتمد على: palestineremembered.com, nakba-archive.org, palmuseum.org
      3. اذكر المصدر الحقيقي اللي أخذت منه المعلومة
      4. لا تخترع معلومات
      5. أجب بالعربية دائماً
      
      في نهاية كل إجابة أضف بالضبط:
      ---SOURCES---
      المصدر 1: [اسم الموقع أو المرجع]
      المصدر 2: [اسم الموقع أو المرجع]
      `.trim();

      const formattedHistory = (history || []).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      formattedHistory.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: formattedHistory,
        config: {
          systemInstruction: systemInstruction,
          tools: [{ googleSearch: {} }],
        }
      });

      const fullText = response.text() || '';
      
      // Parse content and sources
      const [reply, sourcesRaw] = fullText.split('---SOURCES---');
      
      const sources = sourcesRaw
        ? sourcesRaw.trim().split('\n')
            .filter(Boolean)
            .map(s => s.replace(/المصدر \d+:?/, "").trim())
        : ["palestineremembered.com"];

      res.json({ reply: reply?.trim() || '', sources });
    } catch (error: any) {
      console.error('Truth Guard Error:', error?.message || error);
      let errorMessage = error?.message || 'Failed to communicate with Truth Guard';
      
      if (typeof errorMessage === 'string') {
        if (errorMessage.includes('API_KEY_INVALID')) {
          errorMessage = 'خطأ في مفتاح API: يرجى التحقق من المفتاح في الإعدادات.';
        } else if (errorMessage.includes('Quota exceeded') || error?.status === 429) {
          errorMessage = 'لقد تجاوزت الحد المسموح للاستخدام المجاني (Quota Exceeded). يرجى المحاولة لاحقاً، أو استخدام مفتاح API مدفوع.';
        }
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
