import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config({ quiet: true });

type TruthStatus = 'verified' | 'needs_context' | 'possibly_inaccurate';

const outOfPalestineScopeReply = 'أنا فلسطيني، ولا أتكلم إلا لفلسطين.';

const allowedPalestinianReferences = [
  'موسوعة التراث الفلسطيني - https://palturath.com/ar',
  'أرشيف المتحف الفلسطيني الرقمي - https://palarchive.org/',
  'مؤسسة الدراسات الفلسطينية - https://www.palestine-studies.org/',
  'المتحف الفلسطيني - https://palmuseum.org/',
  'Palestine Poster Project Archives - https://www.palestineposterproject.org/'
];

const knownPalestinianPlaces = [
  {
    names: ['الدهيشة', 'مخيم الدهيشة'],
    reply:
      'الدهيشة مخيم لاجئين فلسطيني في محافظة بيت لحم، يقع جنوب مدينة بيت لحم. ارتبط المخيم بذاكرة اللجوء الفلسطيني بعد النكبة وبالقرى الفلسطينية التي هُجّر أهلها.'
  },
  {
    names: ['بلاطة', 'مخيم بلاطة'],
    reply:
      'مخيم بلاطة مخيم لاجئين فلسطيني قرب مدينة نابلس، ويعد من المخيمات الفلسطينية المعروفة في الضفة الغربية ومرتبطاً بذاكرة اللجوء بعد النكبة.'
  },
  {
    names: ['عايدة', 'مخيم عايدة'],
    reply: 'مخيم عايدة مخيم لاجئين فلسطيني شمال بيت لحم، ويقع في محيط بيت لحم وبيت جالا.'
  },
  {
    names: ['العزة', 'مخيم العزة', 'بيت جبرين', 'مخيم بيت جبرين'],
    reply: 'مخيم العزة، ويعرف أيضاً بمخيم بيت جبرين، مخيم لاجئين فلسطيني في منطقة بيت لحم.'
  },
  {
    names: ['الأمعري', 'الامعري', 'مخيم الأمعري', 'مخيم الامعري'],
    reply: 'مخيم الأمعري مخيم لاجئين فلسطيني في محيط رام الله والبيرة.'
  },
  {
    names: ['الجلزون', 'مخيم الجلزون'],
    reply: 'مخيم الجلزون مخيم لاجئين فلسطيني شمال رام الله.'
  },
  {
    names: ['قلنديا', 'مخيم قلنديا'],
    reply: 'مخيم قلنديا مخيم لاجئين فلسطيني في منطقة القدس ورام الله.'
  },
  {
    names: ['شعفاط', 'مخيم شعفاط'],
    reply: 'مخيم شعفاط مخيم لاجئين فلسطيني في القدس.'
  },
  {
    names: ['عقبة جبر', 'مخيم عقبة جبر'],
    reply: 'مخيم عقبة جبر مخيم لاجئين فلسطيني قرب أريحا.'
  },
  {
    names: ['عين السلطان', 'مخيم عين السلطان'],
    reply: 'مخيم عين السلطان مخيم لاجئين فلسطيني في منطقة أريحا.'
  },
  {
    names: ['الفارعة', 'مخيم الفارعة'],
    reply: 'مخيم الفارعة مخيم لاجئين فلسطيني في شمال الضفة الغربية، في محيط طوباس.'
  },
  {
    names: ['عسكر', 'مخيم عسكر'],
    reply: 'مخيم عسكر مخيم لاجئين فلسطيني في منطقة نابلس.'
  },
  {
    names: ['عين بيت الماء', 'مخيم عين بيت الماء'],
    reply: 'مخيم عين بيت الماء مخيم لاجئين فلسطيني في منطقة نابلس.'
  },
  {
    names: ['جنين', 'مخيم جنين'],
    reply: 'مخيم جنين مخيم لاجئين فلسطيني في مدينة جنين.'
  },
  {
    names: ['طولكرم', 'مخيم طولكرم'],
    reply: 'مخيم طولكرم مخيم لاجئين فلسطيني في مدينة طولكرم.'
  },
  {
    names: ['نور شمس', 'مخيم نور شمس'],
    reply: 'مخيم نور شمس مخيم لاجئين فلسطيني قرب طولكرم.'
  },
  {
    names: ['جباليا', 'مخيم جباليا'],
    reply: 'مخيم جباليا مخيم لاجئين فلسطيني في شمال غزة.'
  },
  {
    names: ['الشاطئ', 'مخيم الشاطئ'],
    reply: 'مخيم الشاطئ مخيم لاجئين فلسطيني في غزة.'
  },
  {
    names: ['النصيرات', 'مخيم النصيرات'],
    reply: 'مخيم النصيرات مخيم لاجئين فلسطيني في وسط غزة.'
  },
  {
    names: ['البريج', 'مخيم البريج'],
    reply: 'مخيم البريج مخيم لاجئين فلسطيني في وسط غزة.'
  },
  {
    names: ['المغازي', 'مخيم المغازي'],
    reply: 'مخيم المغازي مخيم لاجئين فلسطيني في وسط غزة.'
  },
  {
    names: ['دير البلح', 'مخيم دير البلح'],
    reply: 'مخيم دير البلح مخيم لاجئين فلسطيني في وسط غزة.'
  },
  {
    names: ['خان يونس', 'مخيم خان يونس'],
    reply: 'مخيم خان يونس مخيم لاجئين فلسطيني في جنوب غزة.'
  },
  {
    names: ['رفح', 'مخيم رفح'],
    reply: 'مخيم رفح مخيم لاجئين فلسطيني في جنوب غزة.'
  },
  {
    names: ['دير ياسين'],
    reply: 'دير ياسين قرية فلسطينية مهجرة في قضاء القدس، وتحضر في الذاكرة الفلسطينية بسبب المجزرة التي وقعت فيها عام 1948.'
  },
  {
    names: ['لفتا'],
    reply: 'لفتا قرية فلسطينية مهجرة من قرى القدس، ما زالت بيوتها الحجرية شاهدة على الذاكرة العمرانية الفلسطينية.'
  },
  {
    names: ['عين كارم'],
    reply: 'عين كارم قرية فلسطينية مهجرة في قضاء القدس.'
  },
  {
    names: ['المالحة'],
    reply: 'المالحة قرية فلسطينية مهجرة في قضاء القدس.'
  },
  {
    names: ['القسطل'],
    reply: 'القسطل قرية فلسطينية مهجرة في قضاء القدس، ارتبط اسمها بمعارك عام 1948.'
  },
  {
    names: ['قالونيا', 'قلونيا'],
    reply: 'قالونيا قرية فلسطينية مهجرة في قضاء القدس.'
  },
  {
    names: ['صفورية'],
    reply: 'صفورية قرية فلسطينية مهجرة في قضاء الناصرة.'
  },
  {
    names: ['لوبيا'],
    reply: 'لوبيا قرية فلسطينية مهجرة في قضاء طبريا.'
  },
  {
    names: ['الطنطورة'],
    reply: 'الطنطورة قرية فلسطينية مهجرة على الساحل الفلسطيني قرب حيفا.'
  },
  {
    names: ['البروة'],
    reply: 'البروة قرية فلسطينية مهجرة في قضاء عكا.'
  },
  {
    names: ['إجزم', 'اجزم'],
    reply: 'إجزم قرية فلسطينية مهجرة في قضاء حيفا.'
  },
  {
    names: ['كفر برعم'],
    reply: 'كفر برعم قرية فلسطينية مهجرة في الجليل.'
  },
  {
    names: ['إقرت', 'اقرت'],
    reply: 'إقرت قرية فلسطينية مهجرة في الجليل.'
  },
  {
    names: ['بيت دجن'],
    reply: 'بيت دجن قرية فلسطينية مهجرة في قضاء يافا.'
  },
  {
    names: ['سلمة'],
    reply: 'سلمة قرية فلسطينية مهجرة في قضاء يافا.'
  }
];

const palestineScopeTerms = [
  'فلسطين',
  'فلسطيني',
  'فلسطينية',
  'الفلسطيني',
  'الفلسطينية',
  'القدس',
  'يافا',
  'حيفا',
  'عكا',
  'غزة',
  'رام الله',
  'الخليل',
  'نابلس',
  'بيت لحم',
  'جنين',
  'طولكرم',
  'قلقيلية',
  'أريحا',
  'اريحا',
  'صفد',
  'طبريا',
  'اللد',
  'الرملة',
  'بئر السبع',
  'بيسان',
  'الناصرة',
  'الكوفية',
  'كوفية',
  'تطريز',
  'التطريز',
  'ثوب',
  'الثوب',
  'تراث',
  'التراث',
  'نكبة',
  'النكبة',
  'قرية',
  'قرى',
  'القرية',
  'مخيم',
  'المخيم',
  'مخيمات',
  'المخيمات',
  'مثل',
  'أمثال',
  'امثال',
  'المثل',
  'الأمثال',
  'قصة',
  'قصص',
  'حكاية',
  'حكايات',
  'أغنية',
  'اغنية',
  'أغاني',
  'اغاني',
  'أهزوجة',
  'اهازيج',
  'أهازيج',
  'موسوعة التراث الفلسطيني',
  'palturath',
  'الدلعونا',
  'دلعونا',
  'عتابا',
  'ميجانا',
  'زجل',
  'زيتون',
  'الزيتون',
  'حصاد',
  'العرس',
  'الأعراس',
  'احتلال',
  'الاحتلال',
  'اسرائيل',
  'إسرائيل',
  'palestine',
  'palestinian',
  'jerusalem',
  'gaza',
  'jafa',
  'jaffa',
  'haifa',
  'nablus',
  'hebron',
  'bethlehem',
  'nakba',
  'tatreez',
  'embroidery',
  'keffiyeh',
  'occupation',
  'israel',
  'israeli'
];

const outOfPalestineTerms = [
  'فرنسا',
  'باريس',
  'أمريكا',
  'امريكا',
  'الولايات المتحدة',
  'بريطانيا',
  'لندن',
  'ألمانيا',
  'المانيا',
  'برلين',
  'إيطاليا',
  'ايطاليا',
  'روما',
  'إسبانيا',
  'اسبانيا',
  'مدريد',
  'تركيا',
  'أنقرة',
  'انقرة',
  'روسيا',
  'موسكو',
  'الصين',
  'بكين',
  'الهند',
  'دلهي',
  'اليابان',
  'طوكيو',
  'مصر',
  'القاهرة',
  'الأردن',
  'الاردن',
  'عمان',
  'سوريا',
  'دمشق',
  'لبنان',
  'بيروت',
  'السعودية',
  'الرياض',
  'قطر',
  'الدوحة',
  'الإمارات',
  'الامارات',
  'دبي',
  'الكويت',
  'العراق',
  'بغداد',
  'المغرب',
  'الرباط',
  'تونس',
  'الجزائر'
];

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

function isPalestineScopedMessage(message: string) {
  const normalized = message.toLowerCase();
  return palestineScopeTerms.some((term) => normalized.includes(term.toLowerCase()));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function includesWholePhrase(message: string, phrase: string) {
  const normalized = message.toLowerCase();
  const escaped = escapeRegExp(phrase.toLowerCase());
  return new RegExp(`(^|[\\s؟?!.،,؛:()[\\]{}"'])${escaped}($|[\\s؟?!.،,؛:()[\\]{}"'])`).test(normalized);
}

function isExplicitlyOutOfPalestine(message: string) {
  return outOfPalestineTerms.some((term) => includesWholePhrase(message, term));
}

function looksLikePotentialPalestinianPlaceName(message: string) {
  const cleaned = message
    .replace(/[؟?!.،,؛:()[\]{}"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return false;

  const hasArabic = /[\u0600-\u06FF]/.test(cleaned);
  if (!hasArabic) return false;

  const hasPlaceHint = /(قرية|القرية|مخيم|المخيم|مخيمات|بلدة|مدينة|خربة|خربه)/.test(cleaned);
  const words = cleaned.split(' ').filter(Boolean);
  const questionWords = ['ما', 'من', 'متى', 'كيف', 'لماذا', 'ليش', 'هل', 'اين', 'أين'];
  const isShortNameQuery = words.length <= 4 && !questionWords.includes(words[0]);

  return hasPlaceHint || isShortNameQuery;
}

function shouldEvaluateAsPalestinianScope(message: string) {
  if (isPalestineScopedMessage(message)) return true;
  if (isExplicitlyOutOfPalestine(message)) return false;
  return looksLikePotentialPalestinianPlaceName(message);
}

function normalizePlaceText(value: string) {
  return value
    .replace(/[إأآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[؟?!.،,؛:()[\]{}"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function findKnownPalestinianPlace(message: string) {
  const normalized = normalizePlaceText(message);
  return knownPalestinianPlaces.find((place) =>
    place.names.some((name) => {
      const normalizedName = normalizePlaceText(name);
      return normalized === normalizedName || normalized.includes(normalizedName);
    })
  );
}

function placeReferenceReply(placeReply: string) {
  return `${placeReply}\n\nالمراجع المعتمدة للمتابعة والتحقق التفصيلي: أرشيف المتحف الفلسطيني الرقمي، ومؤسسة الدراسات الفلسطينية، والمتحف الفلسطيني.`;
}

function extractUserQuestion(message: string) {
  const match = message.match(/سؤال المستخدم:\s*([\s\S]*)$/);
  return (match?.[1] || message).trim();
}

function enforcePalestinianNaming(reply: unknown) {
  return String(reply || '')
    .replace(/دولة\s+(إسرائيل|اسرائيل)/g, 'الاحتلال الإسرائيلي')
    .replace(/الاحتلال\s+ال(?:إ|ا)سرائيلي/g, 'الاحتلال الإسرائيلي')
    .replace(/ال(?:إ|ا)سرائيلي(?:ة|ين)?/g, 'الاحتلال الإسرائيلي')
    .replace(/(?:إ|ا)سرائيلي(?:ة|ين)?/g, 'الاحتلال الإسرائيلي')
    .replace(/(إسرائيل|اسرائيل)/g, 'الاحتلال الإسرائيلي')
    .replace(/الاحتلال\s+الاحتلال الإسرائيلي/g, 'الاحتلال الإسرائيلي')
    .replace(/الاحتلال\s+الالاحتلال الإسرائيليي/g, 'الاحتلال الإسرائيلي')
    .trim();
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
  const PORT = Number(process.env.PORT) || 3000;

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
- Treat the piece as Palestinian embroidery only, and use Palestinian place names.
- Identify the most likely Palestinian city or town connected to the embroidery pattern whenever the visual/classifier evidence allows it.
- The "cityName" field must contain only the Palestinian city/town name, such as رام الله، بيت لحم، الخليل، يافا، غزة، نابلس، بئر السبع، القدس، جنين، طولكرم, or "غير محدد" when evidence is insufficient.
- Use these Palestinian references as the primary knowledge frame:
${allowedPalestinianReferences.map((reference) => `  - ${reference}`).join('\n')}
- You may use widely established Palestinian embroidery knowledge when the references are not enough, but do not invent source claims.
- For Palestinian proverbs, folk chants/songs, zajal, and folk stories, treat "موسوعة التراث الفلسطيني - https://palturath.com/ar" as the primary reference. Use the other approved references only as supporting context.
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
  "cityName": "اسم المدينة أو البلدة الفلسطينية المحتملة، أو غير محدد",
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
          cityName: confidence < 30 ? 'غير محدد' : className,
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
        cityName: parsed.cityName || parsed.city || parsed.town || 'غير محدد',
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
        origin: parsed.probableRegion || parsed.origin || parsed.cityName || 'غير محدد',
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

      const userQuestion = extractUserQuestion(String(message));
      const knownPlace = findKnownPalestinianPlace(userQuestion);
      const candidatePlaceOnly =
        !knownPlace && !isPalestineScopedMessage(userQuestion) && looksLikePotentialPalestinianPlaceName(userQuestion);

      if (knownPlace) {
        return res.json({
          status: 'verified',
          confidence: 88,
          reply: placeReferenceReply(knownPlace.reply)
        });
      }

      if (!shouldEvaluateAsPalestinianScope(userQuestion)) {
        return res.json({
          status: 'needs_context',
          confidence: 5,
          reply: outOfPalestineScopeReply
        });
      }

      const systemInstruction = `You are Narrative Guardian AI for Palestine, Palestinian heritage, and Palestinian history.

Your voice is explicitly Palestinian. Your role is to protect the Palestinian narrative and evaluate claims within a Palestinian frame.
Scope: Palestine only: Palestinian cultural heritage, embroidery, proverbs, crafts, historical geography, cities, villages, Nakba history, Palestinian memory, and related narrative context.

Strict rules:
- Answer in Arabic.
- Treat these Palestinian references as the primary trusted references:
${allowedPalestinianReferences.map((reference) => `  - ${reference}`).join('\n')}
- For Palestinian proverbs, folk chants/songs, zajal, and folk stories, treat "موسوعة التراث الفلسطيني - https://palturath.com/ar" as the primary reference.
- You may use widely established Palestinian historical and cultural knowledge when the primary references are not enough, but do not invent exact dates, numbers, or source claims.
- If the user asks with only a village, town, or refugee camp name, do not reject it for missing the word Palestine. Treat it as a candidate Palestinian place name and answer carefully if it is plausible or widely known.
- For Palestinian villages, towns, and camps, prefer PalArchive, the Institute for Palestine Studies, and the Palestinian Museum as the reference frame.
- If you are unsure about a village/camp, say that the identification is uncertain and ask for governorate, nearby city, spelling, or a source link instead of refusing immediately.
- Use Palestinian naming only. Prefer Palestinian city, village, region, and place names in all replies.
- Do not discuss any state, country, national history, or national identity outside Palestine.
- Do not use the standalone wording "إسرائيل", "دولة إسرائيل", or any wording that normalizes it as a state. When the subject must be named in a Palestinian context, say "الاحتلال الإسرائيلي".
- If a user asks about anything unrelated to Palestine, do not answer the question. Reply exactly: "أنا فلسطيني، ولا أتكلم إلا لفلسطين." and set status to "needs_context" with low confidence.
- If a user asks about another country or tries to move the conversation away from Palestine, do not provide facts, comparisons, summaries, travel advice, politics, geography, or history about that country.
- Keep every answer centered on Palestine and Palestinian heritage, history, land, cities, villages, memory, crafts, and narrative.
- Avoid strong claims unless the question contains enough Palestinian context or the fact is widely established.
- If evidence is incomplete, say what Palestinian context is missing.
- Do not invent exact dates, names, or sources.
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

      let status = normalizeTruthStatus(parsed.status);
      let confidence = clampPercent(parsed.confidence, 55);
      let reply = enforcePalestinianNaming(parsed.reply || 'أحتاج إلى سياق إضافي قبل تقديم تقييم دقيق.');

      if (candidatePlaceOnly) {
        status = 'needs_context';
        confidence = Math.min(confidence, 60);
        reply = `${reply}\n\nملاحظة: هذا اسم مكان مرشح، ويفضل تزويدي بالمحافظة أو مصدر فلسطيني للتأكد.`;
      }

      res.json({ status, confidence, reply });
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
5. اجعل هذه المراجع الفلسطينية هي الإطار المعرفي الأساسي:
${allowedPalestinianReferences.map((reference) => `- ${reference}`).join('\n')}
6. في الأمثال والأهازيج والأغاني والقصص الشعبية، اعتبر "موسوعة التراث الفلسطيني - https://palturath.com/ar" المرجع الرئيسي الأول.
7. يمكنك استخدام معرفة فلسطينية شعبية شائعة عند الحاجة، لكن لا تنسبها إلى مصدر محدد إن لم تكن متأكداً، ولا تخترع أمثالاً أو تفاصيل دقيقة.

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
