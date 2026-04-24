import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config({ quiet: true });

type TruthStatus = 'verified' | 'needs_context' | 'possibly_inaccurate';

function extractJsonObject(text: string) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenced) return JSON.parse(fenced[1]);

    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }

    throw new Error('Model did not return JSON');
  }
}

function clampPercent(value: unknown, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function patternLabel(confidence: number) {
  if (confidence >= 80) return 'مطابقة قوية';
  if (confidence >= 55) return 'مطابقة محتملة';
  if (confidence >= 30) return 'مطابقة ضعيفة';
  return 'مؤشرات غير كافية';
}

function normalizeTruthStatus(status: unknown): TruthStatus {
  if (status === 'verified' || status === 'needs_context' || status === 'possibly_inaccurate') {
    return status;
  }
  return 'needs_context';
}

function getEnvValue(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return '';
}

type AiMessage = {
  role: 'system' | 'user';
  content: string;
};

async function generateAIText({
  messages,
  maxTokens = 800,
  temperature = 0.3
}: {
  messages: AiMessage[];
  maxTokens?: number;
  temperature?: number;
}) {
  const geminiKey = getEnvValue('GEMINI_API_KEY', 'GOOGLE_API_KEY', 'GOOGLE_GENAI_API_KEY', 'API_KEY');

  if (geminiKey) {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const systemInstruction = messages.find((message) => message.role === 'system')?.content;
    const contents = messages
      .filter((message) => message.role !== 'system')
      .map((message) => message.content)
      .join('\n\n');
    const config: Record<string, unknown> = {
      temperature,
      maxOutputTokens: maxTokens
    };

    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents,
      config
    });

    return response.text || '';
  }

  const groqKey = getEnvValue('GROQ_API_KEY');

  if (!groqKey) {
    throw new Error('No AI API key configured. Set GEMINI_API_KEY or GROQ_API_KEY.');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${groqKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      max_tokens: maxTokens,
      temperature,
      messages
    })
  });

  if (!response.ok) {
    throw new Error(`Groq Error: ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 images
  app.use(express.json({ limit: '50mb' }));

  // --- API ROUTES ---

  app.get('/api/debug-key', (req, res) => {
    const groqKey = getEnvValue('GROQ_API_KEY');
    const geminiKey = getEnvValue('GEMINI_API_KEY', 'GOOGLE_API_KEY', 'GOOGLE_GENAI_API_KEY', 'API_KEY');
    res.json({
      activeProvider: geminiKey ? 'gemini' : groqKey ? 'groq' : null,
      groq: {
        exists: !!groqKey,
        length: groqKey ? groqKey.length : 0
      },
      gemini: {
        exists: !!geminiKey,
        length: geminiKey ? geminiKey.length : 0
      }
    });
  });

  app.post('/api/scan-pattern', async (req, res) => {
    try {
      const { className, probability, predictions } = req.body;
      
      if (!className) {
        return res.status(400).json({ error: 'No classification provided' });
      }

      const confidence = clampPercent(Number(probability) * 100, 0);
      const rankedPredictions = Array.isArray(predictions)
        ? predictions
            .map((item: any) => ({
              className: String(item.className || ''),
              confidence: clampPercent(Number(item.probability) * 100, 0)
            }))
            .filter((item: any) => item.className)
            .slice(0, 3)
        : [{ className, confidence }];

      const promptText = `You are an expert in Palestinian embroidery and cultural heritage. Analyze the classification signal carefully and respectfully.

The uploaded image was first read by a small visual classifier. Its top candidates are:
${rankedPredictions.map((item: any, index: number) => `${index + 1}. ${item.className}: ${item.confidence}%`).join('\n')}

Important behavior:
- Answer in Arabic.
- Do not overstate certainty.
- Do not use words like fake, wrong, dangerous, misleading, or false unless there is very clear evidence.
- If the image quality or classifier confidence is low, explain that visual evidence is insufficient instead of giving a warning.
- If confidence is low, use this wording naturally: "لا يمكن الجزم من الصورة وحدها، لكن توجد مؤشرات تشبه..."
- Use balanced language and treat the output as an assistant reading, not a final authentication.
- Confidence rules:
  80-100: strong match
  55-79: probable match
  30-54: weak/uncertain match
  below 30: insufficient visual evidence
- Do not raise confidence above the classifier signal (${confidence}%) unless there is a clear reason. You may lower it.

Return JSON only in this exact shape:
{
  "probableRegion": "المنطقة أو الأصل المحتمل، أو اكتب غير محدد إذا كانت الأدلة غير كافية",
  "embroideryType": "${className}",
  "visualEvidence": ["دليل بصري 1", "دليل بصري 2"],
  "confidence": ${confidence},
  "matchLabel": "${patternLabel(confidence)}",
  "culturalNotes": "ملاحظات ثقافية موجزة ومحترمة",
  "recommendation": "توصية عملية للمستخدم"
}
`;

      const text = await generateAIText({
        messages: [{ role: 'user', content: promptText }],
        maxTokens: 1500,
        temperature: 0.2
      });

      let parsed: any;
      try {
        parsed = extractJsonObject(text);
      } catch (e) {
        parsed = {
          probableRegion:
            confidence < 30
              ? 'غير محدد من الصورة وحدها'
              : `لا يمكن الجزم من الصورة وحدها، لكن توجد مؤشرات تشبه ${className}`,
          embroideryType: className,
          visualEvidence:
            confidence < 30
              ? ['الأدلة البصرية الظاهرة لا تكفي لربط النمط بمنطقة محددة بثقة.']
              : [`أقرب قراءة بصرية من النموذج تشير إلى ${className}.`],
          confidence,
          matchLabel: patternLabel(confidence),
          culturalNotes: 'هذه قراءة مساندة من الصورة فقط، ولا تغني عن معرفة مصدر القطعة وسياقها الحرفي.',
          recommendation: 'أعد التصوير بإضاءة جيدة ومن زاوية أمامية، وأضف لقطة قريبة للغرز والزخارف.'
        };
      }

      const normalizedConfidence = clampPercent(parsed.confidence, confidence);
      const visualEvidence = Array.isArray(parsed.visualEvidence)
        ? parsed.visualEvidence.filter(Boolean).slice(0, 5)
        : [parsed.visualEvidence || parsed.patterns].filter(Boolean);
      
      res.json({
        probableRegion: parsed.probableRegion || parsed.origin || 'غير محدد من الصورة وحدها',
        embroideryType: parsed.embroideryType || className,
        visualEvidence:
          visualEvidence.length > 0
            ? visualEvidence
            : ['لا تظهر في الصورة تفاصيل كافية للحكم بثقة عالية على النمط أو المنطقة.'],
        confidence: normalizedConfidence,
        matchLabel: parsed.matchLabel || patternLabel(normalizedConfidence),
        culturalNotes:
          parsed.culturalNotes ||
          parsed.details ||
          'التحليل الرقمي قراءة مساندة للملامح البصرية، ولا يغني عن معرفة مصدر القطعة وسياقها الحرفي.',
        recommendation:
          parsed.recommendation ||
          'استخدم صورة أمامية واضحة بإضاءة جيدة، ويفضل إضافة لقطة قريبة للغرز والزخارف.',
        origin: parsed.probableRegion || parsed.origin || 'غير محدد',
        patterns: visualEvidence.join('، '),
        details: parsed.culturalNotes || parsed.details || '',
        verified: normalizedConfidence >= 80
      });
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
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'No message provided' });
      }

      const systemInstruction = `You are Narrative Guardian AI for Palestinian heritage and history.

Your role is to help users evaluate claims calmly, not to sound paranoid or combative.
Scope: Palestinian cultural heritage, embroidery, proverbs, crafts, historical geography, villages, Nakba history, and related narrative context.

Rules:
- Answer in Arabic.
- Avoid strong claims unless the question contains enough context or the fact is widely established.
- If evidence is incomplete, say what context is missing.
- Do not invent exact dates, names, or sources.
- For out-of-scope questions, gently redirect to Palestinian heritage/history and use status "needs_context".
- Present the result as one of:
  "verified": the claim is broadly supported by established historical/cultural knowledge.
  "needs_context": the claim may be plausible but needs date/place/source/context.
  "possibly_inaccurate": the claim likely mixes facts, overstates something, or conflicts with common historical/cultural knowledge.
- Confidence should be careful: use high confidence only for widely established information.

Return JSON only:
{
  "status": "verified" | "needs_context" | "possibly_inaccurate",
  "confidence": 0-100,
  "reply": "إجابة عربية موجزة ومنضبطة تشرح الحكم والسياق"
}`.trim();

      const messages: AiMessage[] = [];
      messages.push({ role: 'system', content: systemInstruction });
      messages.push({ role: 'user', content: message });

      const fullText = await generateAIText({
        messages,
        maxTokens: 1000,
        temperature: 0.3
      });

      let parsed: any;
      try {
        parsed = extractJsonObject(fullText);
      } catch {
        parsed = {
          status: 'needs_context',
          confidence: 55,
          reply: fullText.trim() || 'أحتاج إلى سياق إضافي قبل تقديم تقييم دقيق.'
        };
      }

      res.json({
        status: normalizeTruthStatus(parsed.status),
        confidence: clampPercent(parsed.confidence, 55),
        reply: parsed.reply || 'أحتاج إلى سياق إضافي قبل تقديم تقييم دقيق.'
      });
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
      const { proverb } = req.body;
      if (!proverb) return res.status(400).json({ error: 'No proverb provided' });

      const result = await generateAIText({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: proverb }
        ],
        maxTokens: 300,
        temperature: 0.3
      });

      res.json({ result });
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
    handleProverbAI(req, res, "صنف هذا المثل الفلسطيني إلى واحدة من هذه الفئات فقط (حكمة، صبر، علاقات، تربية، عمل، أمل، انتماء، تراث، كرم، ضيافة، طرافة، سخرية، مواسم، طباع، حظ، انتظار، طعام، دهشة، زواج). أجب بكلمة واحدة فقط تمثل الفئة وبدون أي نص إضافي.");
  });

  app.post('/api/proverb-chat', async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: 'No prompt provided' });

      const systemPrompt = `أنت مساعد تراثي فلسطيني متخصص في الأمثال الشعبية الفلسطينية.
التعليمات:
1. أجب بالعربية وبلغة دافئة ومختصرة.
2. إذا كان السؤال عن معنى أو موقف أو قيمة مثل الصبر، الجار، العائلة، العمل، فاقترح مثلاً فلسطينياً مناسباً مع شرح قصير.
3. إذا كان السؤال خارج نطاق الأمثال أو التراث، وجّه المستخدم بلطف إلى أن هذه الأداة مخصصة للأمثال الفلسطينية وضع related: false.
4. لا تخترع مثلاً غير معروف إن لم تكن واثقاً؛ اختر صياغة شائعة أو قل إنك تحتاج وصفاً أدق للموقف.

أخرج الإجابة بصيغة JSON حصراً، بدون أي نص قبله أو بعده:
{
  "related": boolean, 
  "proverb": "نص المثل إذا وجد أو اتركه فارغاً",
  "explanation": "شرح المثل أو رسالة الرفض إن كان خارج النطاق"
}`;

      const content = await generateAIText({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        maxTokens: 500,
        temperature: 0.1
      });
      
      let parsed;
      try {
        parsed = extractJsonObject(content);
      } catch(e) {
        parsed = {
          related: false,
          proverb: '',
          explanation: 'أحتاج إلى صياغة أوضح للموقف كي أقترح مثلاً فلسطينياً مناسباً.'
        };
      }

      res.json({
        related: Boolean(parsed.related),
        proverb: parsed.proverb || '',
        explanation: parsed.explanation || 'أحتاج إلى صياغة أوضح للموقف كي أقترح مثلاً فلسطينياً مناسباً.'
      });
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
