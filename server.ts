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
قام نموذج ذكاء اصطناعي مخصص بتصنيف صورة هذا الثوب على أنه "${className}" بنسبة يقين تعادل ${Math.round(probability * 100)}%.

المطلوب منك ليس شرح سبب التصنيف أو القواعد، بل تقديم **وصف ثقافي وتاريخي عام وجميل** لهذا الثوب المحدد بناءً على تصنيفه (${className}). اكتب في الـ details فقرة متماسكة ومثرية تشرح للمستخدم مميزات هذا الثوب، تاريخه، وماذا يمثل في الثقافة الفلسطينية بشكل عام.

بناءً على هذا التصنيف، قم بتعبئة مخرجات JSON التالية:

{
  "embroideryType": "${className}",
  "origin": string, // اكتب المنطقة أو المدينة التي ينتمي إليها هذا الثوب
  "patterns": string, // الأنماط والرموز الجمالية التي يشتهر بها هذا النوع عادة
  "confidence": ${Math.round(probability * 100)},
  "verified": ${probability > 0.6},
  "details": string // الفقرة الثقافية والتاريخية المثرية التي تصف جماليات وتاريخ هذا الثوب
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

  // --- PROVERBS API ---
  const handleProverbAI = async (req: express.Request, res: express.Response, systemPrompt: string) => {
    try {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY is not configured.' });
      
      const { proverb } = req.body;
      if (!proverb) return res.status(400).json({ error: 'No proverb provided' });

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 300,
          temperature: 0.3,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: proverb }
          ]
        })
      });

      if (!response.ok) throw new Error(`Groq Error: ${await response.text()}`);
      
      const data = await response.json();
      res.json({ result: data.choices?.[0]?.message?.content?.trim() || '' });
    } catch (error: any) {
      console.error('Proverb AI Error:', error?.message || error);
      res.status(500).json({ error: error?.message || 'Failed to process proverb' });
    }
  };

  app.post('/api/proverb-meaning', (req, res) => {
    handleProverbAI(req, res, "أنت خبير في التراث الفلسطيني. اشرح المثل الفلسطيني التالي بشكل بسيط وواضح في سطرين فقط وبدون مقدمات.");
  });

  app.post('/api/proverb-story', (req, res) => {
    handleProverbAI(req, res, "أنت حكواتي فلسطيني. اكتب قصة قصيرة جداً (3-5 أسطر) من التراث القروي الفلسطيني تعبر عن هذا المثل. ابدأ بالقصة مباشرة دون مقدمات.");
  });

  app.post('/api/proverb-category', (req, res) => {
    handleProverbAI(req, res, "صنف هذا المثل الفلسطيني إلى واحدة من هذه الفئات فقط (حكمة، صبر، علاقات، تربية، عمل، أمل). أجب بكلمة واحدة فقط تمثل الفئة وبدون أي نص إضافي.");
  });

  app.post('/api/proverb-chat', async (req, res) => {
    try {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY is not configured.' });
      
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: 'No prompt provided' });

      const systemPrompt = `أنت مساعد ذكي فلسطيني تراثي. تخصصك الوحيد والأوحد هو "الأمثال الشعبية الفلسطينية".
التعليمات الصارمة: 
1. يُمنع منعاً باتاً الإجابة على أي سؤال أو نقاش لا يتعلق بالأمثال الفلسطينية أو التراث (مثل البرمجة، العلوم، السياسة الحالية، إلخ).
2. إذا كان السؤال خارج نطاق الأمثال، ارفض بأدب وقل أنك مخصص للأمثال الشعبية الفلسطينية فقط وضع related: false.
3. إذا سألك المستخدم (أعطني مثلاً عن الصبر/شخص/موقف)، استخرج مثلاً فلسطينياً حقيقياً مناسباً مع شرح قصير.

أخرج الإجابة بصيغة JSON حصراً، بدون أي نص قبله أو بعده:
{
  "related": boolean, 
  "proverb": "نص المثل إذا وجد أو اتركه فارغاً",
  "explanation": "شرح المثل أو رسالة الرفض إن كان خارج النطاق"
}`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 500,
          temperature: 0.1,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ]
        })
      });

      if (!response.ok) throw new Error(`Groq Error: ${await response.text()}`);
      
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '{}';
      
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch(e) {
        const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        parsed = JSON.parse(match ? match[1] : content);
      }

      res.json(parsed);
    } catch (error: any) {
      console.error('Proverb Chat Error:', error?.message || error);
      res.status(500).json({ error: error?.message || 'Failed to process chat' });
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
