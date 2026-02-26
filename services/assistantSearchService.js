const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const EXCLUDED_MODEL_FILES = new Set([
  'Csu.js',
  'Csu2.js',
  'AssistantChatSession.js',
  'AssistantChatMessage.js'
]);

const QUERY_CACHE_TTL_MS = 2 * 60 * 1000;
const QUERY_CACHE_MAX_ENTRIES = 500;

let modelsInitialized = false;
const queryCache = new Map();

function normalizeSpace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function truncate(value, maxLen = 300) {
  const text = normalizeSpace(value);
  if (!text) return '';
  return text.length <= maxLen ? text : `${text.slice(0, maxLen)}...`;
}

function buildCacheKey(query, limit) {
  return `${query.toLowerCase().trim()}::${limit}`;
}

function getCached(query, limit) {
  const key = buildCacheKey(query, limit);
  const cached = queryCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.ts > QUERY_CACHE_TTL_MS) {
    queryCache.delete(key);
    return null;
  }
  queryCache.delete(key);
  queryCache.set(key, cached);
  return cached.payload;
}

function setCache(query, limit, payload) {
  const key = buildCacheKey(query, limit);
  if (queryCache.has(key)) queryCache.delete(key);
  queryCache.set(key, { ts: Date.now(), payload });
  if (queryCache.size > QUERY_CACHE_MAX_ENTRIES) {
    const firstKey = queryCache.keys().next().value;
    if (firstKey) queryCache.delete(firstKey);
  }
}

function initializeAllModels() {
  if (modelsInitialized) return;
  const modelsDir = path.join(__dirname, '..', 'models');
  const files = fs
    .readdirSync(modelsDir)
    .filter((file) => file.endsWith('.js') && !EXCLUDED_MODEL_FILES.has(file));
  for (const file of files) {
    require(path.join(modelsDir, file));
  }
  modelsInitialized = true;
}

function getModel(name) {
  return mongoose.models[name] || null;
}

function todayDateLabel() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function currentMonthName() {
  return new Date().toLocaleString('en-US', { month: 'long' });
}

function currentYear() {
  return new Date().getFullYear();
}

// ─── HINGLISH → HINDI TRANSLITERATION ───

const CONSONANT_MAP_SORTED = [
  ['ksh', 'क्ष'], ['gya', 'ज्ञ'], ['tra', 'त्र'], ['shr', 'श्र'],
  ['chh', 'छ'], ['bh', 'भ'], ['ch', 'च'], ['dh', 'ध'], ['gh', 'घ'],
  ['jh', 'झ'], ['kh', 'ख'], ['ph', 'फ'], ['sh', 'श'], ['th', 'थ'],
  ['ng', 'ं'], ['ny', 'ञ'],
  ['k', 'क'], ['g', 'ग'], ['j', 'ज'], ['t', 'त'], ['d', 'द'],
  ['n', 'न'], ['p', 'प'], ['b', 'ब'], ['m', 'म'], ['y', 'य'],
  ['r', 'र'], ['l', 'ल'], ['v', 'व'], ['w', 'व'], ['s', 'स'], ['h', 'ह'],
  ['q', 'क'], ['z', 'ज़'], ['f', 'फ']
];

function extractDevanagariConsonants(latinWord) {
  const w = latinWord.toLowerCase();
  const consonants = [];
  let i = 0;
  while (i < w.length) {
    let matched = false;
    for (const [eng, hin] of CONSONANT_MAP_SORTED) {
      if (w.startsWith(eng, i)) {
        consonants.push(hin);
        i += eng.length;
        matched = true;
        break;
      }
    }
    if (!matched) i++;
  }
  return consonants;
}

function hasLatinChars(text) {
  return /[a-zA-Z]{2,}/.test(text);
}

function hasDevanagari(text) {
  return /[\u0900-\u097F]/.test(text);
}

function buildSmartRegex(query) {
  const terms = [];
  const words = query.split(/\s+/).filter(Boolean);

  terms.push(escapeRegex(query));
  for (const w of words) {
    if (w.length >= 2) terms.push(escapeRegex(w));
  }

  if (hasLatinChars(query)) {
    for (const w of words) {
      if (!/[a-zA-Z]{2,}/.test(w)) continue;
      const hindiConsonants = extractDevanagariConsonants(w);
      if (hindiConsonants.length >= 2) {
        const loosePattern = hindiConsonants.map(escapeRegex).join('[\\u0900-\\u097F]*');
        terms.push(loosePattern);
      }
    }
  }

  if (hasDevanagari(query)) {
    const devanagariWords = query.match(/[\u0900-\u097F]+/g) || [];
    for (const dw of devanagariWords) {
      if (dw.length >= 2) terms.push(escapeRegex(dw));
      const consonants = dw.replace(/[\u093E-\u094D\u0902\u0903\u093C]/g, '');
      if (consonants.length >= 2) {
        const chars = [...consonants];
        const loosePattern = chars.map(escapeRegex).join('[\\u0900-\\u097F]*');
        terms.push(loosePattern);
      }
    }
  }

  const unique = [...new Set(terms.filter(Boolean))];
  if (!unique.length) return null;
  return new RegExp(unique.join('|'), 'i');
}

// ─── INTENT DETECTION ───

const INTENT_PATTERNS = {
  rashifal_daily: [/aaj\s*ka\s*rashifal/i, /today.*(rashifal|horoscope)/i, /daily\s*(rashifal|horoscope)/i, /आज\s*का\s*राशिफल/i, /dainik\s*rashifal/i, /दैनिक\s*राशिफल/i],
  rashifal_monthly: [/monthly\s*(rashifal|horoscope)/i, /masik\s*rashifal/i, /मासिक\s*राशिफल/i, /is\s*mahine\s*ka\s*rashifal/i, /this\s*month.*(rashifal|horoscope)/i],
  rashifal_yearly: [/yearly\s*(rashifal|horoscope)/i, /varshik\s*rashifal/i, /वार्षिक\s*राशिफल/i, /this\s*year.*(rashifal|horoscope)/i, /sal\s*ka\s*rashifal/i],
  rashifal_generic: [/rashifal/i, /राशिफल/i, /horoscope/i, /rashi\b/i, /राशि/i, /zodiac/i],
  numerology: [/numerology/i, /अंक\s*ज्योतिष/i, /ankjyotish/i, /ankfal/i, /अंकफल/i, /ank\s*shastra/i],
  astroshop: [/astroshop/i, /astro\s*shop/i, /stone/i, /gemstone/i, /rudraksha/i, /yantra/i, /product/i, /buy/i, /रत्न/i, /यंत्र/i, /sade\s*saati/i, /साढ़े\s*साती/i],
  puja: [/puja/i, /pooja/i, /e-?pooja/i, /पूजा/i, /e\s*puja/i],
  festival: [/festival/i, /panchang/i, /पंचांग/i, /त्योहार/i, /tyohar/i, /vrat/i, /व्रत/i, /jyanti/i, /जयंती/i],
  muhurat: [/muhurat/i, /मुहूर्त/i, /shubh\s*muhurat/i, /शुभ\s*मुहूर्त/i],
  learning: [/learning/i, /learn/i, /सीख/i, /jyotish\s*(learning|sikhe|course)/i, /ज्योतिष\s*(सीख|कोर्स)/i],
  book: [/book/i, /किताब/i, /पुस्तक/i, /pustak/i, /kitab/i],
  granth: [/granth/i, /ग्रंथ/i],
  emagazine: [/magazine/i, /e-?magazine/i, /ई-?मैगजीन/i, /patrika/i, /पत्रिका/i],
  mcq: [/mcq/i, /quiz/i, /प्रश्नोत्तरी/i, /question/i]
};

function detectIntents(query) {
  const text = normalizeSpace(query);
  const matched = [];
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (patterns.some((p) => p.test(text))) {
      matched.push(intent);
    }
  }
  return matched;
}

// ─── ALWAYS-SEARCH: KOSH (runs for EVERY query) ───

async function searchKosh(query, limit) {
  const hits = [];
  const KoshContent = getModel('KoshContent');
  const KoshSubCategory = getModel('KoshSubCategory');
  const KoshCategory = getModel('KoshCategory');
  if (!KoshContent) return hits;

  const regex = buildSmartRegex(query);
  if (!regex) return hits;

  const docs = await KoshContent.find({
    $or: [
      { hindiWord: regex },
      { englishWord: regex },
      { hinglishWord: regex },
      { meaning: regex },
      { search: regex }
    ]
  })
    .limit(limit)
    .lean();

  if (!docs.length) return hits;

  const subCatIds = [...new Set(docs.map((d) => String(d.subCategory)).filter(Boolean))];
  const subCats = KoshSubCategory ? await KoshSubCategory.find({ _id: { $in: subCatIds } }).lean() : [];
  const subCatMap = Object.fromEntries(subCats.map((s) => [String(s._id), s]));

  const catIds = [...new Set(subCats.map((s) => String(s.parentCategory)).filter(Boolean))];
  const cats = KoshCategory ? await KoshCategory.find({ _id: { $in: catIds } }).lean() : [];
  const catMap = Object.fromEntries(cats.map((c) => [String(c._id), c]));

  for (const doc of docs) {
    const subCat = subCatMap[String(doc.subCategory)];
    const cat = subCat ? catMap[String(subCat.parentCategory)] : null;

    hits.push({
      model: 'KoshContent',
      documentId: String(doc.id || doc._id),
      section: 'Kosh',
      path: {
        category: cat ? cat.name : '',
        subCategory: subCat ? subCat.name : ''
      },
      snippets: {
        title: truncate(doc.hindiWord || doc.englishWord || doc.hinglishWord, 200),
        hindiWord: truncate(doc.hindiWord),
        englishWord: truncate(doc.englishWord),
        hinglishWord: truncate(doc.hinglishWord),
        meaning: truncate(doc.meaning, 500),
        extra: truncate(doc.extra, 400),
        structure: truncate(doc.structure, 300)
      }
    });
  }
  return hits;
}

// ─── ALWAYS-SEARCH: KARMKAND (runs for EVERY query) ───

async function searchKarmkand(query, limit) {
  const hits = [];
  const KarmkandContent = getModel('KarmkandContent');
  const KarmkandSubCategory = getModel('KarmkandSubCategory');
  const KarmkandCategory = getModel('KarmkandCategory');
  if (!KarmkandContent) return hits;

  const regex = buildSmartRegex(query);
  if (!regex) return hits;

  const docs = await KarmkandContent.find({
    $or: [
      { hindiWord: regex },
      { englishWord: regex },
      { hinglishWord: regex },
      { meaning: regex },
      { search: regex }
    ]
  })
    .limit(limit)
    .lean();

  if (!docs.length) return hits;

  const subCatIds = [...new Set(docs.map((d) => String(d.subCategory)).filter(Boolean))];
  const subCats = KarmkandSubCategory ? await KarmkandSubCategory.find({ _id: { $in: subCatIds } }).lean() : [];
  const subCatMap = Object.fromEntries(subCats.map((s) => [String(s._id), s]));

  const catIds = [...new Set(subCats.map((s) => String(s.parentCategory)).filter(Boolean))];
  const cats = KarmkandCategory ? await KarmkandCategory.find({ _id: { $in: catIds } }).lean() : [];
  const catMap = Object.fromEntries(cats.map((c) => [String(c._id), c]));

  for (const doc of docs) {
    const subCat = subCatMap[String(doc.subCategory)];
    const cat = subCat ? catMap[String(subCat.parentCategory)] : null;

    hits.push({
      model: 'KarmkandContent',
      documentId: String(doc.id || doc._id),
      section: 'Karmkand',
      path: {
        category: cat ? cat.name : '',
        subCategory: subCat ? subCat.name : ''
      },
      snippets: {
        title: truncate(doc.hindiWord || doc.englishWord || doc.hinglishWord, 200),
        hindiWord: truncate(doc.hindiWord),
        englishWord: truncate(doc.englishWord),
        hinglishWord: truncate(doc.hinglishWord),
        meaning: truncate(doc.meaning, 500),
        extra: truncate(doc.extra, 400),
        structure: truncate(doc.structure, 300)
      }
    });
  }
  return hits;
}

// ─── INTENT-SPECIFIC SEARCH FUNCTIONS ───

async function searchRashifalDaily(query, limit) {
  const hits = [];
  const RashifalDailyDate = getModel('RashifalDailyDate');
  const RashifalDailyContent = getModel('RashifalDailyContent');
  if (!RashifalDailyDate || !RashifalDailyContent) return hits;

  const today = todayDateLabel();
  let dateDoc = await RashifalDailyDate.findOne({
    $or: [
      { dateLabel: { $regex: today, $options: 'i' } },
      { dateISO: { $gte: new Date(new Date().setHours(0, 0, 0, 0)), $lte: new Date(new Date().setHours(23, 59, 59, 999)) } }
    ]
  }).lean();

  if (!dateDoc) {
    dateDoc = await RashifalDailyDate.findOne().sort({ sequence: -1, createdAt: -1 }).lean();
  }
  if (!dateDoc) return hits;

  const contents = await RashifalDailyContent.find({ dateRef: dateDoc._id })
    .sort({ sequence: 1 })
    .limit(limit)
    .lean();

  for (const doc of contents) {
    hits.push({
      model: 'RashifalDailyContent',
      documentId: String(doc._id),
      section: 'Rashifal Daily',
      dateLabel: dateDoc.dateLabel || '',
      snippets: {
        title_hn: truncate(doc.title_hn),
        title_en: truncate(doc.title_en),
        details_hn: truncate(doc.details_hn),
        details_en: truncate(doc.details_en)
      }
    });
  }
  return hits;
}

async function searchRashifalMonthly(query, limit) {
  const hits = [];
  const RashifalMonthlyYear = getModel('RashifalMonthlyYear');
  const RashifalMonthly = getModel('RashifalMonthly');
  if (!RashifalMonthlyYear || !RashifalMonthly) return hits;

  const yearDoc = await RashifalMonthlyYear.findOne({ year: currentYear() }).lean();
  if (!yearDoc) return hits;

  const month = currentMonthName();
  const contents = await RashifalMonthly.find({ yearRef: yearDoc._id, month })
    .sort({ sequence: 1 })
    .limit(limit)
    .lean();

  for (const doc of contents) {
    hits.push({
      model: 'RashifalMonthly',
      documentId: String(doc._id),
      section: `Rashifal Monthly - ${month} ${currentYear()}`,
      snippets: {
        title_hn: truncate(doc.title_hn),
        title_en: truncate(doc.title_en),
        details_hn: truncate(doc.details_hn),
        details_en: truncate(doc.details_en)
      }
    });
  }
  return hits;
}

async function searchRashifalYearly(query, limit) {
  const hits = [];
  const RashifalYearlyYear = getModel('RashifalYearlyYear');
  const RashifalYearly = getModel('RashifalYearly');
  if (!RashifalYearlyYear || !RashifalYearly) return hits;

  const yearDoc = await RashifalYearlyYear.findOne({ year: currentYear() }).lean();
  if (!yearDoc) return hits;

  const contents = await RashifalYearly.find({ yearRef: yearDoc._id })
    .sort({ sequence: 1 })
    .limit(limit)
    .lean();

  for (const doc of contents) {
    hits.push({
      model: 'RashifalYearly',
      documentId: String(doc._id),
      section: `Rashifal Yearly - ${currentYear()}`,
      snippets: {
        title_hn: truncate(doc.title_hn),
        title_en: truncate(doc.title_en),
        details_hn: truncate(doc.details_hn),
        details_en: truncate(doc.details_en)
      }
    });
  }
  return hits;
}

async function searchAstroshop(query, limit) {
  const hits = [];
  const Product = getModel('Product');
  const AstroShopCategory = getModel('AstroShopCategory');
  if (!Product) return hits;

  const regex = buildSmartRegex(query);
  if (!regex) return hits;

  const docs = await Product.find({
    $or: [
      { title: regex },
      { short_description: regex },
      { full_description: regex },
      { slug: regex }
    ],
    is_active: true
  })
    .limit(limit)
    .lean();

  const catIds = [...new Set(docs.map((d) => String(d.category)).filter(Boolean))];
  const cats = AstroShopCategory ? await AstroShopCategory.find({ _id: { $in: catIds } }).lean() : [];
  const catMap = Object.fromEntries(cats.map((c) => [String(c._id), c]));

  for (const doc of docs) {
    const cat = catMap[String(doc.category)];
    hits.push({
      model: 'Product',
      documentId: String(doc._id),
      section: 'Astroshop',
      path: { category: cat ? cat.name : '' },
      snippets: {
        title: truncate(doc.title),
        short_description: truncate(doc.short_description),
        price: doc.price,
        rating: doc.rating
      }
    });
  }
  return hits;
}

async function searchPuja(query, limit) {
  const hits = [];
  const Puja = getModel('Puja');
  if (!Puja) return hits;

  const regex = buildSmartRegex(query);
  if (!regex) return hits;

  const docs = await Puja.find({
    $or: [
      { title: regex },
      { description: regex },
      { temple_name: regex },
      { tagline: regex }
    ],
    is_active: true
  })
    .limit(limit)
    .lean();

  for (const doc of docs) {
    hits.push({
      model: 'Puja',
      documentId: String(doc._id),
      section: 'E-Pooja',
      snippets: {
        title: truncate(doc.title),
        tagline: truncate(doc.tagline),
        temple_name: truncate(doc.temple_name),
        description: truncate(doc.description),
        price: doc.price
      }
    });
  }
  return hits;
}

async function searchFestivalPanchang(query, limit) {
  const hits = [];
  const Festival = getModel('Festival');
  if (!Festival) return hits;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const isPanchangQuery = /panchang|पंचांग/i.test(query);
  const isTodayQuery = /today|aaj|आज/i.test(query) || isPanchangQuery;

  let docs = [];
  if (isTodayQuery) {
    docs = await Festival.find({ date: { $gte: startOfDay, $lte: endOfDay } })
      .sort({ sequence: 1 })
      .limit(limit)
      .lean();
  }

  if (!docs.length) {
    const regex = buildSmartRegex(query);
    if (regex) {
      docs = await Festival.find({
        $or: [
          { festival_name: regex },
          { vrat: regex },
          { jyanti: regex },
          { vishesh: regex }
        ]
      })
        .sort({ date: -1 })
        .limit(limit)
        .lean();
    }
  }

  if (!docs.length && isTodayQuery) {
    docs = await Festival.find({ date: { $gte: startOfDay } })
      .sort({ date: 1 })
      .limit(limit)
      .lean();
  }

  for (const doc of docs) {
    hits.push({
      model: 'Festival',
      documentId: String(doc._id),
      section: isPanchangQuery ? 'Panchang' : 'Festival',
      snippets: {
        date: doc.date ? new Date(doc.date).toLocaleDateString('en-IN') : '',
        festival_name: truncate(doc.festival_name),
        vrat: truncate(doc.vrat),
        jyanti: truncate(doc.jyanti),
        vishesh: truncate(doc.vishesh)
      }
    });
  }
  return hits;
}

async function searchMuhurat(query, limit) {
  const hits = [];
  const MuhuratContent = getModel('MuhuratContent');
  const MuhuratCategory = getModel('MuhuratCategory');
  if (!MuhuratContent) return hits;

  const year = currentYear();
  const regex = buildSmartRegex(query);

  let docs = [];
  if (regex) {
    docs = await MuhuratContent.find({
      $or: [{ detail: regex }, { date: regex }],
      year
    })
      .limit(limit)
      .lean();
  }

  if (!docs.length) {
    docs = await MuhuratContent.find({ year }).limit(limit).lean();
  }

  const catIds = [...new Set(docs.map((d) => String(d.categoryId)).filter(Boolean))];
  const cats = MuhuratCategory ? await MuhuratCategory.find({ _id: { $in: catIds } }).lean() : [];
  const catMap = Object.fromEntries(cats.map((c) => [String(c._id), c]));

  for (const doc of docs) {
    const cat = catMap[String(doc.categoryId)];
    hits.push({
      model: 'MuhuratContent',
      documentId: String(doc.id || doc._id),
      section: 'Muhurat',
      path: { category: cat ? cat.categoryName : '' },
      snippets: {
        date: truncate(doc.date),
        detail: truncate(doc.detail),
        year: doc.year
      }
    });
  }
  return hits;
}

async function searchLearning(query, limit) {
  const hits = [];
  const LearningContent = getModel('LearningContent');
  const LearningChapter = getModel('LearningChapter');
  const LearningCategory = getModel('LearningCategory');
  if (!LearningContent) return hits;

  const regex = buildSmartRegex(query);
  if (!regex) return hits;

  const docs = await LearningContent.find({
    $or: [{ title: regex }, { content: regex }],
    isActive: true
  })
    .limit(limit)
    .lean();

  const chapterIds = [...new Set(docs.map((d) => String(d.chapter)).filter(Boolean))];
  const chapters = LearningChapter ? await LearningChapter.find({ _id: { $in: chapterIds } }).lean() : [];
  const chapterMap = Object.fromEntries(chapters.map((c) => [String(c._id), c]));

  const catIds = [...new Set(chapters.map((c) => String(c.category)).filter(Boolean))];
  const cats = LearningCategory ? await LearningCategory.find({ _id: { $in: catIds } }).lean() : [];
  const catMap = Object.fromEntries(cats.map((c) => [String(c._id), c]));

  for (const doc of docs) {
    const chapter = chapterMap[String(doc.chapter)];
    const cat = chapter ? catMap[String(chapter.category)] : null;
    hits.push({
      model: 'LearningContent',
      documentId: String(doc.id || doc._id),
      section: 'Learning',
      path: {
        category: cat ? cat.name : '',
        chapter: chapter ? chapter.name : ''
      },
      snippets: {
        title: truncate(doc.title),
        content: truncate(doc.content)
      }
    });
  }
  return hits;
}

async function searchNumerology(query, limit) {
  const hits = [];

  const isMonthly = /monthly|masik|मासिक|is\s*mahine/i.test(query);
  const isYearly = /yearly|varshik|वार्षिक|sal\s*ka/i.test(query);

  if (isMonthly) {
    const NumerologyMonthlyYear = getModel('NumerologyMonthlyYear');
    const NumerologyMonthly = getModel('NumerologyMonthly');
    if (NumerologyMonthlyYear && NumerologyMonthly) {
      const yearDoc = await NumerologyMonthlyYear.findOne({ year: currentYear() }).lean();
      if (yearDoc) {
        const month = currentMonthName();
        const docs = await NumerologyMonthly.find({ yearRef: yearDoc._id, month })
          .sort({ sequence: 1 }).limit(limit).lean();
        for (const doc of docs) {
          hits.push({
            model: 'NumerologyMonthly', documentId: String(doc._id),
            section: `Numerology Monthly - ${month} ${currentYear()}`,
            snippets: { title_hn: truncate(doc.title_hn), title_en: truncate(doc.title_en), details_hn: truncate(doc.details_hn), details_en: truncate(doc.details_en) }
          });
        }
      }
    }
    if (hits.length) return hits;
  }

  if (isYearly) {
    const NumerologyYearlyYear = getModel('NumerologyYearlyYear');
    const NumerologyYearly = getModel('NumerologyYearly');
    if (NumerologyYearlyYear && NumerologyYearly) {
      const yearDoc = await NumerologyYearlyYear.findOne({ year: currentYear() }).lean();
      if (yearDoc) {
        const docs = await NumerologyYearly.find({ yearRef: yearDoc._id })
          .sort({ sequence: 1 }).limit(limit).lean();
        for (const doc of docs) {
          hits.push({
            model: 'NumerologyYearly', documentId: String(doc._id),
            section: `Numerology Yearly - ${currentYear()}`,
            snippets: { title_hn: truncate(doc.title_hn), title_en: truncate(doc.title_en), details_hn: truncate(doc.details_hn), details_en: truncate(doc.details_en) }
          });
        }
      }
    }
    if (hits.length) return hits;
  }

  const NumerologyDailyDate = getModel('NumerologyDailyDate');
  const NumerologyDailyContent = getModel('NumerologyDailyContent');
  if (!NumerologyDailyDate || !NumerologyDailyContent) return hits;

  let dateDoc = await NumerologyDailyDate.findOne().sort({ sequence: -1, createdAt: -1 }).lean();
  if (!dateDoc) return hits;

  const contents = await NumerologyDailyContent.find({ dateRef: dateDoc._id })
    .sort({ sequence: 1 }).limit(limit).lean();

  for (const doc of contents) {
    hits.push({
      model: 'NumerologyDailyContent', documentId: String(doc._id),
      section: 'Numerology (Ankjyotish)',
      dateLabel: dateDoc.dateLabel || '',
      snippets: { title_hn: truncate(doc.title_hn), title_en: truncate(doc.title_en), details_hn: truncate(doc.details_hn), details_en: truncate(doc.details_en) }
    });
  }
  return hits;
}

async function searchBooks(query, limit) {
  const hits = [];
  const BookContent = getModel('BookContent');
  if (!BookContent) return hits;

  const regex = buildSmartRegex(query);
  if (!regex) return hits;

  const docs = await BookContent.find({
    $or: [
      { title_hn: regex }, { title_en: regex }, { title_hinglish: regex },
      { meaning: regex }, { details: regex }
    ]
  }).limit(limit).lean();

  for (const doc of docs) {
    hits.push({
      model: 'BookContent', documentId: String(doc._id), section: 'Books',
      snippets: { title_hn: truncate(doc.title_hn), title_en: truncate(doc.title_en), meaning: truncate(doc.meaning), details: truncate(doc.details) }
    });
  }
  return hits;
}

async function searchGranth(query, limit) {
  const hits = [];
  const GranthContent = getModel('GranthContent');
  if (!GranthContent) return hits;

  const regex = buildSmartRegex(query);
  if (!regex) return hits;

  const docs = await GranthContent.find({
    $or: [
      { title_hn: regex }, { title_en: regex }, { title_hinglish: regex },
      { meaning: regex }, { details: regex }
    ]
  }).limit(limit).lean();

  for (const doc of docs) {
    hits.push({
      model: 'GranthContent', documentId: String(doc._id), section: 'Granth',
      snippets: { title_hn: truncate(doc.title_hn), title_en: truncate(doc.title_en), meaning: truncate(doc.meaning), details: truncate(doc.details) }
    });
  }
  return hits;
}

async function searchEMagazine(query, limit) {
  const hits = [];
  const EMagazine = getModel('EMagazine');
  if (!EMagazine) return hits;

  const regex = buildSmartRegex(query);
  if (!regex) return hits;

  const docs = await EMagazine.find({
    $or: [{ title: regex }, { introduction: regex }, { subPoints: regex }, { summary: regex }]
  }).sort({ createdAt: -1 }).limit(limit).lean();

  for (const doc of docs) {
    hits.push({
      model: 'EMagazine', documentId: String(doc.id || doc._id), section: 'E-Magazine',
      snippets: { title: truncate(doc.title), introduction: truncate(doc.introduction), month: doc.month, year: doc.year }
    });
  }
  return hits;
}

async function searchGenericFallback(query, limit) {
  const hits = [];
  const regex = buildSmartRegex(query);
  if (!regex) return hits;

  const modelSearchList = [
    { name: 'DivineQuote', fields: ['hindiQuote', 'englishQuote', 'source'], section: 'Divine Quotes' },
    { name: 'DivineSanskrit', fields: ['hindiQuote', 'englishQuote', 'source'], section: 'Divine Sanskrit' },
    { name: 'CelebrityKundli', fields: ['name', 'about', 'place'], section: 'Celebrity Kundli' },
    { name: 'YouTube', fields: ['title', 'description'], section: 'YouTube' },
    { name: 'McqContent', fields: ['question', 'explanation'], section: 'MCQ' },
    { name: 'AboutUs', fields: ['title', 'content', 'description'], section: 'About Us' },
    { name: 'RashifalDaily', fields: ['title_hn', 'title_en', 'details_hn', 'details_en'], section: 'Rashifal' },
    { name: 'Product', fields: ['title', 'short_description', 'full_description'], section: 'Astroshop' },
    { name: 'Puja', fields: ['title', 'description', 'tagline', 'temple_name'], section: 'E-Pooja' },
    { name: 'LearningContent', fields: ['title', 'content'], section: 'Learning' },
    { name: 'BookContent', fields: ['title_hn', 'title_en', 'meaning', 'details'], section: 'Books' },
    { name: 'GranthContent', fields: ['title_hn', 'title_en', 'meaning', 'details'], section: 'Granth' },
    { name: 'EMagazine', fields: ['title', 'introduction', 'summary'], section: 'E-Magazine' },
    { name: 'Festival', fields: ['festival_name', 'vrat', 'jyanti', 'vishesh'], section: 'Festival/Panchang' },
    { name: 'MuhuratContent', fields: ['detail', 'date'], section: 'Muhurat' }
  ];

  for (const entry of modelSearchList) {
    if (hits.length >= limit) break;
    const model = getModel(entry.name);
    if (!model) continue;

    const orConditions = entry.fields
      .filter((f) => model.schema && model.schema.paths && model.schema.paths[f])
      .map((f) => ({ [f]: regex }));
    if (!orConditions.length) continue;

    try {
      const docs = await model.find({ $or: orConditions }).limit(5).lean();
      for (const doc of docs) {
        const snippets = {};
        for (const f of entry.fields) {
          if (doc[f]) snippets[f] = truncate(doc[f]);
        }
        if (!Object.keys(snippets).length) continue;

        hits.push({
          model: entry.name,
          documentId: String(doc.id || doc._id),
          section: entry.section,
          snippets
        });
      }
    } catch (err) {
      // skip
    }
  }
  return hits;
}

// ─── INTENT ROUTER ───

const INTENT_TO_SEARCH = {
  rashifal_daily: searchRashifalDaily,
  rashifal_monthly: searchRashifalMonthly,
  rashifal_yearly: searchRashifalYearly,
  rashifal_generic: async (q, l) => {
    const daily = await searchRashifalDaily(q, l);
    if (daily.length) return daily;
    const monthly = await searchRashifalMonthly(q, l);
    if (monthly.length) return monthly;
    return searchRashifalYearly(q, l);
  },
  numerology: searchNumerology,
  astroshop: searchAstroshop,
  puja: searchPuja,
  festival: searchFestivalPanchang,
  muhurat: searchMuhurat,
  learning: searchLearning,
  book: searchBooks,
  granth: searchGranth,
  emagazine: searchEMagazine,
  mcq: (q, l) => searchGenericFallback(q, l)
};

// ─── MAIN SEARCH ORCHESTRATOR ───

async function searchAppContent(query, options = {}) {
  initializeAllModels();

  const normalizedQuery = normalizeSpace(query);
  const limit = Math.max(1, Math.min(Number(options.limit) || 15, 30));

  if (!normalizedQuery) {
    return { query: '', found: false, totalMatches: 0, hits: [], searchedModels: 0 };
  }

  const cached = getCached(normalizedQuery, limit);
  if (cached) return { ...cached, cache: true };

  const intents = detectIntents(normalizedQuery);
  let allHits = [];
  let searchedModels = 0;
  const seenDocIds = new Set();

  function addHits(newHits) {
    for (const hit of newHits) {
      const key = `${hit.model}::${hit.documentId}`;
      if (seenDocIds.has(key)) continue;
      seenDocIds.add(key);
      allHits.push(hit);
    }
  }

  // PHASE 1: ALWAYS search Kosh + Karmkand for EVERY query
  const alwaysSearchPromises = [
    searchKosh(normalizedQuery, limit).catch((e) => { console.warn('[Search] Kosh failed:', e && e.message); return []; }),
    searchKarmkand(normalizedQuery, limit).catch((e) => { console.warn('[Search] Karmkand failed:', e && e.message); return []; })
  ];

  // PHASE 2: Run intent-specific searches in parallel
  const intentPromises = intents
    .filter((intent) => intent !== 'kosh' && intent !== 'karmkand')
    .map(async (intent) => {
      const searchFn = INTENT_TO_SEARCH[intent];
      if (!searchFn) return [];
      try {
        return await searchFn(normalizedQuery, limit);
      } catch (err) {
        console.warn(`[Search] Intent ${intent} failed:`, err && err.message);
        return [];
      }
    });

  const allResults = await Promise.all([...alwaysSearchPromises, ...intentPromises]);
  for (const resultHits of allResults) {
    addHits(resultHits);
    if (resultHits.length > 0) searchedModels += 1;
  }

  // PHASE 3: If few results, run generic fallback across remaining models
  if (allHits.length < 5) {
    try {
      const fallbackHits = await searchGenericFallback(normalizedQuery, limit);
      addHits(fallbackHits);
      searchedModels += 1;
    } catch (err) {
      console.warn('[Search] Generic fallback failed:', err && err.message);
    }
  }

  const finalHits = allHits.slice(0, limit);

  const payload = {
    query: normalizedQuery,
    found: finalHits.length > 0,
    totalMatches: finalHits.length,
    hits: finalHits,
    intents,
    searchedModels
  };

  setCache(normalizedQuery, limit, payload);
  return payload;
}

module.exports = {
  searchAppContent
};
