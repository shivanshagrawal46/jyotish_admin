// Central registry describing every admin CRUD resource. Each entry becomes a
// REST router mounted at /api/admin/resources/<name> (see index.js).
//
// Model requires are defensive: if a model file is missing, that resource is
// simply skipped instead of crashing the whole server.

function safe(path) {
  try {
    return require(path);
  } catch (e) {
    console.warn(`[admin] model not found, skipping: ${path} (${e.message})`);
    return null;
  }
}

// ---- Models ----
const Festival = safe('../../../models/Festival');
const DivineQuote = safe('../../../models/DivineQuote');
const DivineSanskrit = safe('../../../models/DivineSanskrit');
const YouTube = safe('../../../models/YouTube');
const Puja = safe('../../../models/Puja');
const Comment = safe('../../../models/Comment');
const Order = safe('../../../models/Order');
const SavedKundli = safe('../../../models/SavedKundli');
const User = safe('../../../models/User');
const Media = safe('../../../models/Media');
const AboutTeam = safe('../../../models/AboutTeam');
const AboutUs = safe('../../../models/AboutUs');
const Notification = safe('../../../models/Notification');
const KoshPurchase = safe('../../../models/KoshPurchase');
const Csu = safe('../../../models/Csu');
const Csu2 = safe('../../../models/Csu2');
const Csu3 = safe('../../../models/Csu3');

const McqCategory = safe('../../../models/McqCategory');
const McqMaster = safe('../../../models/McqMaster');
const McqContent = safe('../../../models/McqContent');

const KarmkandCategory = safe('../../../models/KarmkandCategory');
const KarmkandSubCategory = safe('../../../models/KarmkandSubCategory');
const KarmkandContent = safe('../../../models/KarmkandContent');

const LearningCategory = safe('../../../models/LearningCategory');
const LearningChapter = safe('../../../models/LearningChapter');
const LearningContent = safe('../../../models/LearningContent');

const CelebrityKundliCategory = safe('../../../models/CelebrityKundliCategory');
const CelebrityKundli = safe('../../../models/CelebrityKundli');

const MuhuratCategory = safe('../../../models/MuhuratCategory');
const MuhuratContent = safe('../../../models/MuhuratContent');

const EMagazineCategory = safe('../../../models/EMagazineCategory');
const EMagazineSubject = safe('../../../models/EMagazineSubject');
const EMagazineWriter = safe('../../../models/EMagazineWriter');
const EMagazine = safe('../../../models/EMagazine');

const AstroShopCategory = safe('../../../models/AstroShopCategory');
const Product = safe('../../../models/Product');

const BookCategory = safe('../../../models/BookCategory');
const BookName = safe('../../../models/BookName');
const BookChapter = safe('../../../models/BookChapter');
const BookContent = safe('../../../models/BookContent');

const GranthCategory = safe('../../../models/GranthCategory');
const GranthName = safe('../../../models/GranthName');
const GranthChapter = safe('../../../models/GranthChapter');
const GranthContent = safe('../../../models/GranthContent');

const RashifalDailyDate = safe('../../../models/RashifalDailyDate');
const RashifalDailyContent = safe('../../../models/RashifalDailyContent');
const RashifalWeeklyDate = safe('../../../models/RashifalWeeklyDate');
const RashifalWeeklyContent = safe('../../../models/RashifalWeeklyContent');
const RashifalMonthlyYear = safe('../../../models/RashifalMonthlyYear');
const RashifalMonthly = safe('../../../models/RashifalMonthly');
const RashifalYearlyYear = safe('../../../models/RashifalYearlyYear');
const RashifalYearly = safe('../../../models/RashifalYearly');

const NumerologyDailyDate = safe('../../../models/NumerologyDailyDate');
const NumerologyDailyContent = safe('../../../models/NumerologyDailyContent');
const NumerologyWeeklyDate = safe('../../../models/NumerologyWeeklyDate');
const NumerologyWeeklyContent = safe('../../../models/NumerologyWeeklyContent');
const NumerologyMonthlyYear = safe('../../../models/NumerologyMonthlyYear');
const NumerologyMonthly = safe('../../../models/NumerologyMonthly');
const NumerologyYearlyYear = safe('../../../models/NumerologyYearlyYear');
const NumerologyYearly = safe('../../../models/NumerologyYearly');

const PrashanYantraCategory = safe('../../../models/PrashanYantraCategory');
const AnkPrashan = safe('../../../models/AnkPrashan');
const HanumatPrashanwali = safe('../../../models/HanumatPrashanwali');
const KaryaPrashanYantra = safe('../../../models/KaryaPrashanYantra');
const TwentyPrashanYantra = safe('../../../models/TwentyPrashanYantra');
const SixtyFourPrashanYantra = safe('../../../models/SixtyFourPrashanYantra');
const BeejPrashanYantra = safe('../../../models/BeejPrashanYantra');
const HanumatJyotishQuestion = safe('../../../models/HanumatJyotishQuestion');
const HanumatJyotishResponse = safe('../../../models/HanumatJyotishResponse');

const bcrypt = safe('bcryptjs');
const FCMService = safe('../../../services/fcmService');

// Hash a plaintext password for the Users resource; drop empty passwords on edit.
async function hashUserPassword(writable) {
  if (writable.password === undefined) return writable;
  if (!writable.password) {
    delete writable.password;
    return writable;
  }
  if (bcrypt) writable.password = await bcrypt.hash(writable.password, 10);
  return writable;
}

// Registry: name -> { model, opts }
const registry = {};
function add(name, model, opts = {}) {
  if (!model) return;
  registry[name] = { model, opts };
}

// ---- Shared Excel column sets for content-type resources ----
// Rashifal/Numerology daily & weekly content (one row per rashi/number).
const HOROSCOPE_COLS = ['sequence', 'title_hn', 'title_en', 'details_hn', 'details_en', 'images'];
// Book/Granth content (chapter entries).
const BOOKISH_COLS = ['sequence', 'title_hn', 'title_en', 'title_hinglish', 'meaning', 'details', 'extra', 'images', 'video_links'];

// ---- Flat modules ----
add('festivals', Festival, {
  searchFields: ['festival_name', 'vrat', 'jyanti', 'vishesh'],
  defaultSort: { sequence: 1, date: 1 },
});
add('divineQuotes', DivineQuote, { searchFields: ['quote', 'meaning'], defaultSort: { createdAt: -1 } });
add('divineSanskrit', DivineSanskrit, { searchFields: ['quote', 'meaning'], defaultSort: { createdAt: -1 } });
add('youtube', YouTube, { searchFields: ['title', 'category', 'link'] });
add('puja', Puja, { searchFields: ['title', 'temple_name', 'temple_location'] });
add('comments', Comment, { searchFields: ['name', 'mobile', 'comment'], allowCreate: false });
add('orders', Order, {
  searchFields: ['customerName', 'email', 'phoneNumber', 'productName'],
  allowCreate: false,
});
add('savedKundli', SavedKundli, { searchFields: ['name', 'place', 'userId'], allowCreate: false });
add('users', User, {
  searchFields: ['username'],
  select: '-password',
  transform: async (w) => hashUserPassword(w),
});
add('media', Media, { searchFields: ['originalname', 'filename'], allowCreate: false });
add('aboutTeam', AboutTeam, { searchFields: ['name', 'designation', 'team_name'] });
add('aboutUs', AboutUs, { singleton: true });
add('csu', Csu, { searchFields: ['heading_hn'], defaultSort: { pageNo: 1, sequence: 1 } });
add('csu2', Csu2, { searchFields: ['heading'], defaultSort: { pageNo: 1, sequence: 1 } });
add('csu3', Csu3, { searchFields: ['heading'], defaultSort: { pageNo: 1, sequence: 1 } });

// Kosh paid-content purchase records (who paid for which content). The Flutter app
// writes these via the public /api/kosh-purchase endpoint; admins view/manage here.
// Setting status to 'refunded' re-locks the content for that user automatically.
add('koshPurchases', KoshPurchase, {
  searchFields: ['email', 'phone', 'reference'],
  defaultSort: { createdAt: -1 },
});

// Notifications are handled by a dedicated API (routes/api/adminNotifications.js)
// because they need the cascading deep-link builder + FCM push, so they are NOT
// registered as a generic CRUD resource here.

// ---- MCQ (Category -> Master -> Content) ----
add('mcqCategories', McqCategory, {
  searchFields: ['name'],
  defaultSort: { position: 1 },
  cascades: McqMaster ? [{ model: McqMaster, field: 'category' }] : [],
});
add('mcqMasters', McqMaster, {
  parentField: 'category',
  searchFields: ['name'],
  defaultSort: { position: 1 },
  cascades: McqContent ? [{ model: McqContent, field: 'master' }] : [],
});
add('mcqContent', McqContent, {
  parentField: 'master',
  searchFields: ['question'],
  defaultSort: { createdAt: 1 },
  excel: {
    label: 'MCQ Questions',
    columns: ['question', 'option1', 'option2', 'option3', 'option4', 'correctAnswers', 'explanation', 'references', 'image', 'isActive'],
    bool: ['isActive'],
    sample: [
      { question: 'Question text?', option1: 'A', option2: 'B', option3: 'C', option4: 'D', correctAnswers: '1', explanation: 'Why', references: '', image: '', isActive: 'yes' },
    ],
  },
});

// ---- Karmkand (Category -> SubCategory -> Content) ----
add('karmkandCategories', KarmkandCategory, {
  searchFields: ['name'],
  defaultSort: { position: 1 },
  cascades: KarmkandSubCategory ? [{ model: KarmkandSubCategory, field: 'parentCategory' }] : [],
});
add('karmkandSubCategories', KarmkandSubCategory, {
  parentField: 'parentCategory',
  searchFields: ['name'],
  defaultSort: { position: 1 },
  cascades: KarmkandContent ? [{ model: KarmkandContent, field: 'subCategory' }] : [],
});
add('karmkandContent', KarmkandContent, {
  parentField: 'subCategory',
  searchFields: ['hindiWord', 'englishWord', 'meaning', 'search'],
  defaultSort: { hindiWord: 1 }, // Hindi alphabetical order (matches the app)
  collation: { locale: 'hi', strength: 1 },
  excel: {
    label: 'Karmkand Content',
    columns: ['sequenceNo', 'hindiWord', 'englishWord', 'hinglishWord', 'meaning', 'extra', 'structure', 'search', 'youtubeLink', 'image'],
    sample: [
      { sequenceNo: 1, hindiWord: 'शब्द', englishWord: 'word', hinglishWord: 'shabd', meaning: 'Meaning', extra: '', structure: '', search: 'keywords', youtubeLink: '', image: '' },
    ],
  },
});

// ---- Learning (Category -> Chapter -> Content) ----
add('learningCategories', LearningCategory, { searchFields: ['name'], defaultSort: { position: 1 }, cascades: LearningChapter ? [{ model: LearningChapter, field: 'category' }] : [] });
add('learningChapters', LearningChapter, { parentField: 'category', searchFields: ['name'], defaultSort: { position: 1 }, cascades: LearningContent ? [{ model: LearningContent, field: 'chapter' }] : [] });
add('learningContent', LearningContent, {
  parentField: 'chapter',
  searchFields: ['title'],
  defaultSort: { position: 1 },
  excel: {
    label: 'Learning Content',
    columns: ['position', 'title', 'content', 'isActive'],
    bool: ['isActive'],
    sample: [{ position: 1, title: 'Title', content: 'Body text', isActive: 'yes' }],
  },
});

// ---- Celebrity Kundli (Category -> Kundli) ----
add('celebrityCategories', CelebrityKundliCategory, {
  searchFields: ['name', 'id'],
  allowIdWrite: true,
  cascades: CelebrityKundli ? [{ model: CelebrityKundli, field: 'category' }] : [],
});
add('celebrityKundli', CelebrityKundli, {
  parentField: 'category',
  searchFields: ['name', 'place'],
  populate: [{ path: 'category', select: 'name' }],
});

// ---- Muhurat (Category -> Content) ----
add('muhuratCategories', MuhuratCategory, {
  searchFields: ['categoryName'],
  cascades: MuhuratContent ? [{ model: MuhuratContent, field: 'categoryId' }] : [],
});
add('muhuratContent', MuhuratContent, {
  parentField: 'categoryId',
  searchFields: ['date', 'detail'],
  defaultSort: { year: -1 },
  excel: {
    label: 'Muhurat Content',
    columns: ['year', 'date', 'detail'],
    sample: [{ year: 2026, date: '15 August 2026', detail: 'Muhurat details' }],
  },
});

// ---- E-Magazine ----
add('emagCategories', EMagazineCategory, { searchFields: ['name'], defaultSort: { position: 1 } });
add('emagSubjects', EMagazineSubject, { searchFields: ['name'] });
add('emagWriters', EMagazineWriter, { searchFields: ['name', 'designation'] });
add('emagazines', EMagazine, {
  searchFields: ['title', 'month'],
  defaultSort: { createdAt: -1 },
  populate: [
    { path: 'category', select: 'name' },
    { path: 'subject', select: 'name' },
    { path: 'writer', select: 'name' },
  ],
});

// ---- Astro Shop (Category -> Product) ----
add('astroCategories', AstroShopCategory, {
  searchFields: ['name'],
  cascades: Product ? [{ model: Product, field: 'category' }] : [],
});
add('products', Product, {
  parentField: 'category',
  searchFields: ['title', 'promo_note'],
  populate: [{ path: 'category', select: 'name' }],
});

// Derive ancestor refs (all required on the schema) from the immediate parent,
// so drilling in and creating a child fills category/book automatically.
function deriveChapterAncestors(NameModel) {
  return async (writable) => {
    if (writable.book && NameModel) {
      const b = await NameModel.findById(writable.book).lean();
      if (b && b.category && !writable.category) writable.category = b.category;
    }
    return writable;
  };
}
function deriveContentAncestors(ChapterModel) {
  return async (writable) => {
    if (writable.chapter && ChapterModel) {
      const ch = await ChapterModel.findById(writable.chapter).lean();
      if (ch) {
        if (ch.book) writable.book = ch.book;
        if (ch.category) writable.category = ch.category;
      }
    }
    return writable;
  };
}

// ---- Book (Category -> Name -> Chapter -> Content) ----
add('bookCategories', BookCategory, { searchFields: ['name'], cascades: BookName ? [{ model: BookName, field: 'category' }] : [] });
add('bookNames', BookName, { parentField: 'category', searchFields: ['name'], cascades: BookChapter ? [{ model: BookChapter, field: 'book' }] : [] });
add('bookChapters', BookChapter, { parentField: 'book', searchFields: ['name'], transform: deriveChapterAncestors(BookName), cascades: BookContent ? [{ model: BookContent, field: 'chapter' }] : [] });
add('bookContent', BookContent, { parentField: 'chapter', searchFields: ['title_hn', 'title_en', 'title_hinglish'], defaultSort: { sequence: 1 }, transform: deriveContentAncestors(BookChapter), excel: { label: 'Book Content', columns: BOOKISH_COLS } });

// ---- Granth (Category -> Name -> Chapter -> Content) ----
add('granthCategories', GranthCategory, { searchFields: ['name'], cascades: GranthName ? [{ model: GranthName, field: 'category' }] : [] });
add('granthNames', GranthName, { parentField: 'category', searchFields: ['name'], cascades: GranthChapter ? [{ model: GranthChapter, field: 'book' }] : [] });
add('granthChapters', GranthChapter, { parentField: 'book', searchFields: ['name'], transform: deriveChapterAncestors(GranthName), cascades: GranthContent ? [{ model: GranthContent, field: 'chapter' }] : [] });
add('granthContent', GranthContent, { parentField: 'chapter', searchFields: ['title_hn', 'title_en', 'title_hinglish'], defaultSort: { sequence: 1 }, transform: deriveContentAncestors(GranthChapter), excel: { label: 'Granth Content', columns: BOOKISH_COLS } });

// ---- Rashifal ----
add('rashifalDailyDates', RashifalDailyDate, { searchFields: ['dateLabel', 'notes'], defaultSort: { sequence: 1 }, cascades: RashifalDailyContent ? [{ model: RashifalDailyContent, field: 'dateRef' }] : [] });
add('rashifalDailyContent', RashifalDailyContent, { parentField: 'dateRef', searchFields: ['title_hn', 'title_en'], defaultSort: { sequence: 1 }, excel: { label: 'Rashifal Daily', columns: HOROSCOPE_COLS } });
add('rashifalWeeklyDates', RashifalWeeklyDate, { searchFields: ['dateLabel', 'notes'], defaultSort: { sequence: 1 }, cascades: RashifalWeeklyContent ? [{ model: RashifalWeeklyContent, field: 'dateRef' }] : [] });
add('rashifalWeeklyContent', RashifalWeeklyContent, { parentField: 'dateRef', searchFields: ['title_hn', 'title_en'], defaultSort: { sequence: 1 }, excel: { label: 'Rashifal Weekly', columns: HOROSCOPE_COLS } });
add('rashifalMonthlyYears', RashifalMonthlyYear, { searchFields: ['description'], defaultSort: { year: -1 }, cascades: RashifalMonthly ? [{ model: RashifalMonthly, field: 'yearRef' }] : [] });
add('rashifalMonthly', RashifalMonthly, { parentField: 'yearRef', searchFields: ['month', 'title_hn', 'title_en'], defaultSort: { sequence: 1 }, excel: { label: 'Rashifal Monthly', columns: ['month', ...HOROSCOPE_COLS] } });
add('rashifalYearlyYears', RashifalYearlyYear, { searchFields: ['description'], defaultSort: { year: -1 }, cascades: RashifalYearly ? [{ model: RashifalYearly, field: 'yearRef' }] : [] });
add('rashifalYearly', RashifalYearly, { parentField: 'yearRef', searchFields: ['title_hn', 'title_en'], defaultSort: { sequence: 1 }, excel: { label: 'Rashifal Yearly', columns: ['date', ...HOROSCOPE_COLS] } });

// ---- Numerology ----
add('numerologyDailyDates', NumerologyDailyDate, { searchFields: ['dateLabel', 'notes'], defaultSort: { sequence: 1 }, cascades: NumerologyDailyContent ? [{ model: NumerologyDailyContent, field: 'dateRef' }] : [] });
add('numerologyDailyContent', NumerologyDailyContent, { parentField: 'dateRef', searchFields: ['title_hn', 'title_en'], defaultSort: { sequence: 1 }, excel: { label: 'Numerology Daily', columns: HOROSCOPE_COLS } });
add('numerologyWeeklyDates', NumerologyWeeklyDate, { searchFields: ['dateLabel', 'notes'], defaultSort: { sequence: 1 }, cascades: NumerologyWeeklyContent ? [{ model: NumerologyWeeklyContent, field: 'dateRef' }] : [] });
add('numerologyWeeklyContent', NumerologyWeeklyContent, { parentField: 'dateRef', searchFields: ['title_hn', 'title_en'], defaultSort: { sequence: 1 }, excel: { label: 'Numerology Weekly', columns: HOROSCOPE_COLS } });
add('numerologyMonthlyYears', NumerologyMonthlyYear, { searchFields: ['description'], defaultSort: { year: -1 }, cascades: NumerologyMonthly ? [{ model: NumerologyMonthly, field: 'yearRef' }] : [] });
add('numerologyMonthly', NumerologyMonthly, { parentField: 'yearRef', searchFields: ['month', 'title_hn', 'title_en'], defaultSort: { sequence: 1 }, excel: { label: 'Numerology Monthly', columns: ['month', ...HOROSCOPE_COLS] } });
add('numerologyYearlyYears', NumerologyYearlyYear, { searchFields: ['description'], defaultSort: { year: -1 }, cascades: NumerologyYearly ? [{ model: NumerologyYearly, field: 'yearRef' }] : [] });
add('numerologyYearly', NumerologyYearly, { parentField: 'yearRef', searchFields: ['title_hn', 'title_en'], defaultSort: { sequence: 1 }, excel: { label: 'Numerology Yearly', columns: ['date', ...HOROSCOPE_COLS] } });

// ---- Prashan Yantra family ----
add('prashanCategories', PrashanYantraCategory, { searchFields: ['name', 'description'], defaultSort: { position: 1 } });
add('ankPrashan', AnkPrashan, { singleton: true });
add('hanumatPrashanwali', HanumatPrashanwali, { singleton: true });
add('karyaPrashan', KaryaPrashanYantra, { singleton: true });
add('twentyPrashan', TwentyPrashanYantra, { singleton: true });
add('sixtyFourPrashan', SixtyFourPrashanYantra, { singleton: true });
add('beejPrashan', BeejPrashanYantra, { singleton: true });
add('hanumatQuestions', HanumatJyotishQuestion, { searchFields: ['question', 'description'], defaultSort: { position: 1 }, cascades: HanumatJyotishResponse ? [{ model: HanumatJyotishResponse, field: 'question' }] : [] });
add('hanumatResponses', HanumatJyotishResponse, { parentField: 'question', populate: [{ path: 'question', select: 'question' }] });

module.exports = registry;
