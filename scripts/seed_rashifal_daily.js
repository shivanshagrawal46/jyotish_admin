/**
 * Seeds one-day-at-a-time rashifal entries for 20 Sep 2026 -> 20 Dec 2026.
 *
 * Writes into RashifalWeeklyDate / RashifalWeeklyContent because in this
 * project those are the records the app renders on its Daily screen (the
 * RashifalDaily* models hold week ranges like "8 jun 2026 - 14 jun 2026").
 *
 * Idempotent: a day already present (same dateLabel or same calendar dateISO)
 * is skipped, so re-running only fills the gaps.
 *
 *   node scripts/seed_rashifal_daily.js --dry-run
 *   node scripts/seed_rashifal_daily.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const RashifalWeeklyDate = require('../models/RashifalWeeklyDate');
const RashifalWeeklyContent = require('../models/RashifalWeeklyContent');

const START = { y: 2026, m: 8, d: 20 };  // 20 Sep 2026 (month is 0-based)
const END = { y: 2026, m: 11, d: 20 };   // 20 Dec 2026

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const RASHIS = [
  { hn: 'मेष', en: 'Aries', lordHn: 'मंगल', lordEn: 'Mars' },
  { hn: 'वृषभ', en: 'Taurus', lordHn: 'शुक्र', lordEn: 'Venus' },
  { hn: 'मिथुन', en: 'Gemini', lordHn: 'बुध', lordEn: 'Mercury' },
  { hn: 'कर्क', en: 'Cancer', lordHn: 'चंद्रमा', lordEn: 'the Moon' },
  { hn: 'सिंह', en: 'Leo', lordHn: 'सूर्य', lordEn: 'the Sun' },
  { hn: 'कन्या', en: 'Virgo', lordHn: 'बुध', lordEn: 'Mercury' },
  { hn: 'तुला', en: 'Libra', lordHn: 'शुक्र', lordEn: 'Venus' },
  { hn: 'वृश्चिक', en: 'Scorpio', lordHn: 'मंगल', lordEn: 'Mars' },
  { hn: 'धनु', en: 'Sagittarius', lordHn: 'गुरु', lordEn: 'Jupiter' },
  { hn: 'मकर', en: 'Capricorn', lordHn: 'शनि', lordEn: 'Saturn' },
  { hn: 'कुम्भ', en: 'Aquarius', lordHn: 'शनि', lordEn: 'Saturn' },
  { hn: 'मीन', en: 'Pisces', lordHn: 'गुरु', lordEn: 'Jupiter' }
];

const MOOD = [
  { hn: 'दिन की शुरुआत उत्साह एवं नई ऊर्जा के साथ होगी।', en: 'The day begins with enthusiasm and fresh energy.' },
  { hn: 'आज मन शांत रहेगा और सोच स्पष्ट बनी रहेगी।', en: 'Your mind stays calm today and your thinking remains clear.' },
  { hn: 'प्रातःकाल कुछ व्यस्तता रहेगी, परंतु दोपहर बाद राहत अनुभव होगी।', en: 'The morning will be somewhat busy, but you will feel relief after midday.' },
  { hn: 'आज आत्मविश्वास प्रबल रहेगा और निर्णय लेने में सरलता होगी।', en: 'Confidence runs high today and decisions come easily.' },
  { hn: 'दिन मिश्रित फल देने वाला रहेगा, धैर्य बनाए रखें।', en: 'The day brings mixed results, so hold on to your patience.' },
  { hn: 'आज रुके हुए कार्य गति पकड़ेंगे और मन प्रसन्न रहेगा।', en: 'Stalled work picks up pace today and your mood stays cheerful.' },
  { hn: 'आज किसी पुराने मित्र अथवा परिचित से भेंट संभव है।', en: 'A meeting with an old friend or acquaintance is possible today.' },
  { hn: 'दिन सामान्य रहेगा, परंतु सायंकाल शुभ समाचार मिल सकता है।', en: 'The day stays ordinary, but good news may arrive in the evening.' },
  { hn: 'आज कार्यक्षेत्र में व्यस्तता अपेक्षा से अधिक रहेगी।', en: 'You will be busier than expected in your field of work today.' },
  { hn: 'आज मन में नए विचार आएंगे और रचनात्मकता बढ़ेगी।', en: 'New ideas come to mind today and your creativity increases.' },
  { hn: 'प्रातःकाल थोड़ा आलस्य रहेगा, परंतु दिन चढ़ते ही स्फूर्ति आएगी।', en: 'There may be slight lethargy early on, but energy returns as the day progresses.' },
  { hn: 'आज किसी शुभ कार्य की योजना बन सकती है।', en: 'Plans for an auspicious undertaking may take shape today.' },
  { hn: 'आज समय आपके पक्ष में रहेगा, अवसर का लाभ उठाएं।', en: 'Time favours you today, so make the most of the opportunity.' }
];

const CAREER = [
  { hn: 'कार्यक्षेत्र में वरिष्ठ अधिकारी आपके कार्य से प्रसन्न होंगे।', en: 'At work, seniors will be pleased with your performance.' },
  { hn: 'व्यापार में नया अनुबंध प्राप्त होने के संकेत हैं।', en: 'There are signs of landing a new contract in business.' },
  { hn: 'नौकरी में स्थान परिवर्तन अथवा नई जिम्मेदारी मिल सकती है।', en: 'A transfer or a new responsibility may come your way at your job.' },
  { hn: 'सहकर्मियों का सहयोग मिलेगा और अटके कार्य पूर्ण होंगे।', en: 'Colleagues will cooperate and pending tasks will get completed.' },
  { hn: 'आज किसी महत्वपूर्ण बैठक में आपकी बात का प्रभाव पड़ेगा।', en: 'Your words will carry weight in an important meeting today.' },
  { hn: 'प्रतिस्पर्धा बढ़ सकती है, अतः सतर्क रहकर कार्य करें।', en: 'Competition may increase, so work with alertness.' },
  { hn: 'साझेदारी के कार्यों में सोच-विचार कर आगे बढ़ें।', en: 'Move ahead thoughtfully in partnership matters.' },
  { hn: 'लंबे समय से प्रतीक्षित कार्य आज पूर्ण होने की संभावना है।', en: 'Work awaited for a long time is likely to conclude today.' },
  { hn: 'स्वतंत्र व्यवसाय करने वालों को अच्छा लाभ मिलेगा।', en: 'Those running independent businesses will earn good profit.' },
  { hn: 'कार्यालय में किसी विवाद से दूर रहना उत्तम रहेगा।', en: 'It is best to stay away from any dispute at the office.' },
  { hn: 'विद्यार्थियों को अध्ययन में मन लगाने से सफलता मिलेगी।', en: 'Students will find success by applying their minds to study.' },
  { hn: 'नई नौकरी के लिए किया गया प्रयास फलदायी होगा।', en: 'Efforts made towards a new job will bear fruit.' },
  { hn: 'कार्य की गुणवत्ता पर ध्यान देने से प्रशंसा प्राप्त होगी।', en: 'Attending to the quality of your work will earn you appreciation.' }
];

const MONEY = [
  { hn: 'धन लाभ के अवसर बनेंगे तथा रुका हुआ भुगतान प्राप्त हो सकता है।', en: 'Opportunities for gain arise and a stuck payment may be received.' },
  { hn: 'आज अनावश्यक व्यय पर नियंत्रण रखना आवश्यक है।', en: 'It is necessary to control unnecessary spending today.' },
  { hn: 'निवेश संबंधी निर्णय सोच-समझकर लें।', en: 'Take investment decisions only after careful thought.' },
  { hn: 'किसी निकट संबंधी से आर्थिक सहयोग मिल सकता है।', en: 'Financial support may come from a close relative.' },
  { hn: 'आय के नए स्रोत बनने के संकेत हैं।', en: 'There are indications of new sources of income opening up.' },
  { hn: 'उधार के लेन-देन से आज बचना उत्तम रहेगा।', en: 'It would be best to avoid lending or borrowing today.' },
  { hn: 'संपत्ति संबंधी मामलों में प्रगति होगी।', en: 'Matters related to property will progress.' },
  { hn: 'आज बचत की ओर ध्यान देने का उत्तम समय है।', en: 'Today is a good time to turn your attention to savings.' },
  { hn: 'व्यापारिक यात्रा से आर्थिक लाभ संभव है।', en: 'Financial gain from a business trip is possible.' },
  { hn: 'पारिवारिक आवश्यकताओं पर व्यय बढ़ सकता है।', en: 'Expenses on family needs may rise.' },
  { hn: 'पुराने निवेश से आज अच्छा प्रतिफल मिल सकता है।', en: 'An old investment may yield good returns today.' },
  { hn: 'आर्थिक स्थिति में धीरे-धीरे सुधार होगा।', en: 'Your financial position will improve gradually.' },
  { hn: 'आज किसी शुभ वस्तु की खरीदारी हो सकती है।', en: 'You may make a purchase of something auspicious today.' }
];

const FAMILY = [
  { hn: 'पारिवारिक वातावरण सुखद रहेगा तथा सबका सहयोग मिलेगा।', en: 'The family atmosphere stays pleasant and everyone will be supportive.' },
  { hn: 'जीवनसाथी के साथ सामंजस्य बढ़ेगा।', en: 'Harmony with your spouse will grow.' },
  { hn: 'संतान की ओर से शुभ समाचार प्राप्त हो सकता है।', en: 'Good news may be received from your children.' },
  { hn: 'घर में किसी मांगलिक कार्य की चर्चा चल सकती है।', en: 'Talk of an auspicious family event may come up at home.' },
  { hn: 'माता-पिता के स्वास्थ्य का ध्यान रखें।', en: "Take care of your parents' health." },
  { hn: 'भाई-बहनों से मतभेद संभव है, वाणी पर संयम रखें।', en: 'A difference with siblings is possible, so keep your speech measured.' },
  { hn: 'मित्रों के साथ समय व्यतीत करने का अवसर मिलेगा।', en: 'You will get a chance to spend time with friends.' },
  { hn: 'अतिथि के आगमन से घर में प्रसन्नता रहेगी।', en: 'The arrival of a guest will bring cheer to the home.' },
  { hn: 'प्रेम संबंधों में मधुरता बनी रहेगी।', en: 'Sweetness will prevail in matters of the heart.' },
  { hn: 'विवाह योग्य जातकों के लिए अच्छा प्रस्ताव आ सकता है।', en: 'A good proposal may come for those of marriageable age.' },
  { hn: 'किसी पारिवारिक विषय पर सबकी सहमति बन जाएगी।', en: 'Everyone will come to agreement on a family matter.' },
  { hn: 'आज परिवार के साथ तीर्थ अथवा भ्रमण की योजना बन सकती है।', en: 'A plan for a pilgrimage or outing with family may be made today.' },
  { hn: 'पड़ोसियों अथवा संबंधियों से सहयोग प्राप्त होगा।', en: 'You will receive cooperation from neighbours or relatives.' }
];

const HEALTH = [
  { hn: 'स्वास्थ्य सामान्य रहेगा, परंतु खान-पान का ध्यान रखें।', en: 'Health stays normal, but pay attention to your diet.' },
  { hn: 'आज शारीरिक स्फूर्ति बनी रहेगी।', en: 'Physical vigour will stay with you today.' },
  { hn: 'मौसमी बदलाव से सर्दी-जुकाम की संभावना है।', en: 'A seasonal change may bring cold and cough.' },
  { hn: 'पेट संबंधी विकार से बचने हेतु हल्का भोजन करें।', en: 'Eat light food to avoid stomach-related trouble.' },
  { hn: 'प्रातःकाल योग एवं प्राणायाम लाभकारी रहेगा।', en: 'Morning yoga and breathing exercises will be beneficial.' },
  { hn: 'अत्यधिक परिश्रम से थकान हो सकती है, विश्राम आवश्यक है।', en: 'Overexertion may cause fatigue, so rest is necessary.' },
  { hn: 'पुराना रोग हो तो आज आराम अनुभव होगा।', en: 'If you have an old ailment, you will feel relief today.' },
  { hn: 'नेत्र एवं सिर संबंधी कष्ट से सावधान रहें।', en: 'Be careful of trouble related to the eyes and head.' },
  { hn: 'जल का पर्याप्त सेवन करें तथा दिनचर्या नियमित रखें।', en: 'Drink enough water and keep your routine regular.' },
  { hn: 'मानसिक तनाव से बचें, ध्यान करना हितकर होगा।', en: 'Avoid mental stress; meditation will be helpful.' },
  { hn: 'वाहन चलाते समय सावधानी बरतें।', en: 'Exercise caution while driving.' },
  { hn: 'संधि एवं कमर के दर्द में सतर्कता रखें।', en: 'Be watchful of joint and back pain.' },
  { hn: 'आज दिनचर्या में हल्का व्यायाम सम्मिलित करें।', en: 'Include some light exercise in your routine today.' }
];

const REMEDY = [
  { hn: 'आज {lordHn} से संबंधित वस्तु का दान शुभ रहेगा।', en: 'Donating an item related to {lordEn} will be auspicious today.' },
  { hn: 'प्रातःकाल सूर्य को जल अर्पित करें।', en: 'Offer water to the Sun in the morning.' },
  { hn: 'हनुमान चालीसा का पाठ मनोबल बढ़ाएगा।', en: 'Reciting the Hanuman Chalisa will lift your morale.' },
  { hn: 'गाय को रोटी खिलाना लाभकारी रहेगा।', en: 'Feeding a cow will prove beneficial.' },
  { hn: 'किसी जरूरतमंद को अन्न का दान करें।', en: 'Donate grain to someone in need.' },
  { hn: 'शिवलिंग पर जल अर्पित करना शुभ फल देगा।', en: 'Offering water on a Shivling will give auspicious results.' },
  { hn: 'आज तुलसी के पौधे में जल दें।', en: 'Water the Tulsi plant today.' },
  { hn: 'इष्ट देव का स्मरण कर कार्य आरंभ करें।', en: 'Begin your work after remembering your chosen deity.' },
  { hn: 'पक्षियों को दाना डालना मंगलकारी रहेगा।', en: 'Feeding grain to birds will be auspicious.' },
  { hn: '{lordHn} के मंत्र का जाप करने से बाधाएं दूर होंगी।', en: 'Chanting the mantra of {lordEn} will remove obstacles.' },
  { hn: 'वृद्धजनों का आशीर्वाद लेकर घर से निकलें।', en: 'Take the blessings of elders before leaving home.' },
  { hn: 'आज दीपदान करना शुभ माना जाएगा।', en: 'Offering a lamp will be considered auspicious today.' },
  { hn: 'जल में थोड़ा गंगाजल मिलाकर स्नान करना शुभ रहेगा।', en: 'Bathing with a little Ganga water mixed in will be auspicious.' }
];

const COLORS = [
  { hn: 'लाल', en: 'Red' }, { hn: 'सफेद', en: 'White' }, { hn: 'हरा', en: 'Green' },
  { hn: 'पीला', en: 'Yellow' }, { hn: 'नीला', en: 'Blue' }, { hn: 'गुलाबी', en: 'Pink' },
  { hn: 'नारंगी', en: 'Orange' }, { hn: 'क्रीम', en: 'Cream' }, { hn: 'आसमानी', en: 'Sky Blue' },
  { hn: 'बैंगनी', en: 'Purple' }, { hn: 'सुनहरा', en: 'Golden' }, { hn: 'चांदी जैसा', en: 'Silver' }
];

const DIRECTIONS = [
  { hn: 'पूर्व', en: 'East' }, { hn: 'पश्चिम', en: 'West' }, { hn: 'उत्तर', en: 'North' },
  { hn: 'दक्षिण', en: 'South' }, { hn: 'उत्तर-पूर्व', en: 'North-East' },
  { hn: 'दक्षिण-पूर्व', en: 'South-East' }, { hn: 'उत्तर-पश्चिम', en: 'North-West' },
  { hn: 'दक्षिण-पश्चिम', en: 'South-West' }
];

/**
 * Deterministic 32-bit mix. Indexing the pools by day/rashi arithmetic made the
 * copy repeat every 13 days (every pool is the same length), so each slot gets
 * its own hashed offset instead.
 */
function hash(day, rashi, slot) {
  let h = 2166136261 ^ Math.imul(day + 1, 374761393) ^ Math.imul(rashi + 1, 668265263) ^ Math.imul(slot + 1, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return h >>> 0;
}

function pick(pool, dayIndex, rashiIndex, slot) {
  return pool[hash(dayIndex, rashiIndex, slot) % pool.length];
}

function fill(text, rashi) {
  return text.replace('{lordHn}', rashi.lordHn).replace('{lordEn}', rashi.lordEn);
}

/** Builds the Hindi + English horoscope body for one rashi on one day. */
function buildDetails(rashi, rashiIndex, dayIndex, dateLabel) {
  const mood = pick(MOOD, dayIndex, rashiIndex, 1);
  const career = pick(CAREER, dayIndex, rashiIndex, 3);
  const money = pick(MONEY, dayIndex, rashiIndex, 5);
  const family = pick(FAMILY, dayIndex, rashiIndex, 7);
  const health = pick(HEALTH, dayIndex, rashiIndex, 11);
  const remedy = pick(REMEDY, dayIndex, rashiIndex, 13);
  const color = pick(COLORS, dayIndex, rashiIndex, 17);
  const direction = pick(DIRECTIONS, dayIndex, rashiIndex, 19);
  const luckyNumber = (hash(dayIndex, rashiIndex, 23) % 9) + 1;

  const details_hn = [
    `${dateLabel} — ${rashi.hn} राशि (स्वामी ${rashi.lordHn})।`,
    mood.hn,
    career.hn,
    money.hn,
    family.hn,
    health.hn,
    fill(remedy.hn, rashi),
    `शुभ रंग — ${color.hn}; शुभ अंक — ${luckyNumber}; शुभ दिशा — ${direction.hn}।`
  ].join(' ');

  const details_en = [
    `${dateLabel} — ${rashi.en} (ruled by ${rashi.lordEn}).`,
    mood.en,
    career.en,
    money.en,
    family.en,
    health.en,
    fill(remedy.en, rashi),
    `Lucky colour — ${color.en}; lucky number — ${luckyNumber}; auspicious direction — ${direction.en}.`
  ].join(' ');

  return { details_hn, details_en };
}

/** Every calendar day from START to END inclusive. */
function buildDayList() {
  const days = [];
  const cursor = new Date(START.y, START.m, START.d);
  const last = new Date(END.y, END.m, END.d);
  while (cursor <= last) {
    days.push(new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/** "20 September 26" — matches the format of the existing day entry. */
function formatLabel(date) {
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}`;
}

const DRY = process.argv.includes('--dry-run');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const days = buildDayList();
  console.log(`Range: ${formatLabel(days[0])} -> ${formatLabel(days[days.length - 1])} (${days.length} days)`);
  console.log(`Target: RashifalWeeklyDate / RashifalWeeklyContent${DRY ? '  [DRY RUN]' : ''}\n`);

  const maxSeqDoc = await RashifalWeeklyDate.findOne().sort({ sequence: -1 }).select('sequence').lean();
  let sequence = (maxSeqDoc && Number(maxSeqDoc.sequence)) || 0;

  let datesAdded = 0;
  let datesSkipped = 0;
  let contentAdded = 0;

  for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
    const day = days[dayIndex];
    const dateLabel = formatLabel(day);
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
    const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);

    const existing = await RashifalWeeklyDate.findOne({
      $or: [{ dateLabel }, { dateISO: { $gte: dayStart, $lte: dayEnd } }]
    }).lean();

    if (existing) {
      datesSkipped++;
      console.log(`= exists, skipped: ${dateLabel}`);
      continue;
    }

    sequence += 1;

    if (DRY) {
      datesAdded++;
      contentAdded += RASHIS.length;
      if (dayIndex < 2 || dayIndex === days.length - 1) {
        const sample = buildDetails(RASHIS[0], 0, dayIndex, dateLabel);
        console.log(`+ ${dateLabel} (seq ${sequence}) + ${RASHIS.length} rashis`);
        console.log(`    hn: ${sample.details_hn}`);
        console.log(`    en: ${sample.details_en}`);
      } else {
        console.log(`+ ${dateLabel} (seq ${sequence}) + ${RASHIS.length} rashis`);
      }
      continue;
    }

    const dateDoc = await RashifalWeeklyDate.create({
      dateLabel,
      dateISO: dayStart,
      notes: 'Daily rashifal',
      sequence
    });

    const rows = RASHIS.map((rashi, rashiIndex) => {
      const { details_hn, details_en } = buildDetails(rashi, rashiIndex, dayIndex, dateLabel);
      return {
        dateRef: dateDoc._id,
        sequence: rashiIndex + 1,
        title_hn: rashi.hn,
        title_en: rashi.en,
        details_hn,
        details_en,
        images: []
      };
    });

    await RashifalWeeklyContent.insertMany(rows);

    datesAdded++;
    contentAdded += rows.length;
    console.log(`+ ${dateLabel} (seq ${sequence}) + ${rows.length} rashis`);
  }

  console.log(`\ndates added: ${datesAdded}, dates skipped: ${datesSkipped}, rashi entries added: ${contentAdded}`);

  if (DRY) {
    // Confirm the generator is not emitting the same paragraph twice.
    const seen = new Map();
    let worstRashi = null;
    for (let d = 0; d < days.length; d++) {
      for (let r = 0; r < RASHIS.length; r++) {
        const { details_hn } = buildDetails(RASHIS[r], r, d, formatLabel(days[d]));
        // Strip the leading date line so we compare only the body copy.
        const body = details_hn.split('। ').slice(1).join('। ');
        const key = `${r}::${body}`;
        seen.set(key, (seen.get(key) || 0) + 1);
      }
    }
    let maxRepeat = 0;
    for (const [key, count] of seen) {
      if (count > maxRepeat) {
        maxRepeat = count;
        worstRashi = RASHIS[Number(key.split('::')[0])].hn;
      }
    }
    const totalRows = days.length * RASHIS.length;
    console.log(`\nuniqueness: ${seen.size} distinct bodies across ${totalRows} rows`);
    console.log(`most-repeated body appears ${maxRepeat}x (rashi ${worstRashi})`);
  }

  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { buildDayList, formatLabel, buildDetails, RASHIS };
