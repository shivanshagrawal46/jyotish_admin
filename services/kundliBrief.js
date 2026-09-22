'use strict';

/**
 * Kundli Brief
 * ------------------------------------------------------------------
 * Five short readings – कुण्डली, करियर, धन, विवाह, स्वास्थ्य – each built
 * from the lagna chart (D1), the navamsa (D9) and the running mahadasha.
 *
 * EVERY sentence begins with the Samhita line:
 *   hi: "ज्योतिषविश्वकोश संहिता में पं. अवधनरेश जी कहते हैं कि"
 *   en: "In the Jyotish Vishwakosh Samhita, Pt. Avadh Naresh Ji says that"
 *
 * Hindi and English are produced together from the same logic so they never
 * drift apart.
 */

const { computeKundli, PLANETS_HI } = require('./kundliEngine');

const PREFIX = {
  hi: 'ज्योतिषविश्वकोश संहिता में पं. अवधनरेश जी कहते हैं कि',
  en: 'In the Jyotish Vishwakosh Samhita, Pt. Avadh Naresh Ji says that'
};

const ORD = {
  hi: { 1: 'प्रथम', 2: 'द्वितीय', 3: 'तृतीय', 4: 'चतुर्थ', 5: 'पंचम', 6: 'षष्ठ', 7: 'सप्तम', 8: 'अष्टम', 9: 'नवम', 10: 'दशम', 11: 'एकादश', 12: 'द्वादश' },
  en: { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th', 6: '6th', 7: '7th', 8: '8th', 9: '9th', 10: '10th', 11: '11th', 12: '12th' }
};
const DIG = {
  hi: { exalted: 'उच्च', own: 'स्वराशि', friend: 'मित्रक्षेत्री', neutral: 'समक्षेत्री', enemy: 'शत्रुक्षेत्री', debilitated: 'नीच' },
  en: { exalted: 'exalted', own: 'in own sign', friend: 'in a friendly sign', neutral: 'in a neutral sign', enemy: 'in an inimical sign', debilitated: 'debilitated' }
};

const LAGNA_TRAIT = {
  Aries: ['आपको साहसी, तेजस्वी और नेतृत्व-प्रिय बनाता है', 'makes you courageous, dynamic and a natural leader'],
  Taurus: ['आपको धैर्यवान, सौन्दर्यप्रिय और स्थिर बुद्धि वाला बनाता है', 'makes you patient, beauty-loving and steady of mind'],
  Gemini: ['आपको बुद्धिमान, वाक्पटु और बहुमुखी प्रतिभा का धनी बनाता है', 'makes you intelligent, articulate and versatile'],
  Cancer: ['आपको भावुक, संवेदनशील और परिवार-प्रेमी बनाता है', 'makes you emotional, sensitive and devoted to family'],
  Leo: ['आपको स्वाभिमानी, उदार और राजसी प्रवृत्ति का बनाता है', 'makes you self-respecting, generous and regal by nature'],
  Virgo: ['आपको विश्लेषणशील, व्यवहार-कुशल और परिश्रमी बनाता है', 'makes you analytical, tactful and hard-working'],
  Libra: ['आपको न्यायप्रिय, सौम्य और सामाजिक बनाता है', 'makes you fair-minded, gentle and sociable'],
  Scorpio: ['आपको गहन, रहस्यमय और दृढ़-निश्चयी बनाता है', 'makes you deep, private and resolute'],
  Sagittarius: ['आपको धर्मपरायण, आशावादी और स्पष्टवादी बनाता है', 'makes you righteous, optimistic and outspoken'],
  Capricorn: ['आपको कर्मठ, अनुशासित और महत्वाकांक्षी बनाता है', 'makes you industrious, disciplined and ambitious'],
  Aquarius: ['आपको विचारशील, मानवतावादी और मौलिक चिन्तक बनाता है', 'makes you thoughtful, humanitarian and original'],
  Pisces: ['आपको करुणामय, कल्पनाशील और आध्यात्मिक बनाता है', 'makes you compassionate, imaginative and spiritual']
};

const MOON_TRAIT = {
  Aries: ['मन उत्साही, निर्भीक और तत्पर रहता है', 'the mind is enthusiastic, fearless and quick to act'],
  Taurus: ['मन स्थिर, सहनशील और सुख-प्रिय रहता है', 'the mind is steady, tolerant and comfort-loving'],
  Gemini: ['मन चंचल, जिज्ञासु और संवादप्रिय रहता है', 'the mind is restless, curious and communicative'],
  Cancer: ['मन भावुक, ममतामय और कल्पनाशील रहता है', 'the mind is emotional, nurturing and imaginative'],
  Leo: ['मन स्वाभिमानी, उदार और महत्वाकांक्षी रहता है', 'the mind is proud, generous and ambitious'],
  Virgo: ['मन व्यावहारिक, विश्लेषणशील और सेवाभावी रहता है', 'the mind is practical, analytical and service-minded'],
  Libra: ['मन संतुलित, सौन्दर्यप्रिय और सामाजिक रहता है', 'the mind is balanced, aesthetic and sociable'],
  Scorpio: ['मन गहन, तीव्र और दृढ़ रहता है', 'the mind is deep, intense and determined'],
  Sagittarius: ['मन आशावादी, धर्मप्रिय और स्पष्टवादी रहता है', 'the mind is optimistic, righteous and candid'],
  Capricorn: ['मन गंभीर, अनुशासित और लक्ष्य-केन्द्रित रहता है', 'the mind is serious, disciplined and goal-focused'],
  Aquarius: ['मन स्वतन्त्र, विचारशील और मानवतावादी रहता है', 'the mind is independent, thoughtful and humanitarian'],
  Pisces: ['मन करुणामय, कल्पनाशील और आध्यात्मिक रहता है', 'the mind is compassionate, imaginative and spiritual']
};

// Career fields by the sign on the 10th house
const CAREER_FIELD = {
  Aries: ['सुरक्षा-सेवा, इंजीनियरिंग, खेल, उद्यम और नेतृत्व के क्षेत्र आपके लिए अनुकूल हैं', 'defence, engineering, sports, entrepreneurship and leadership roles suit you'],
  Taurus: ['वित्त, बैंकिंग, कला, विलासिता-उत्पाद और कृषि के क्षेत्र आपके लिए अनुकूल हैं', 'finance, banking, the arts, luxury goods and agriculture suit you'],
  Gemini: ['लेखन, मीडिया, व्यापार, तकनीक और संचार के क्षेत्र आपके लिए अनुकूल हैं', 'writing, media, trade, technology and communication suit you'],
  Cancer: ['शिक्षा, आतिथ्य, जनसेवा, जल-सम्बन्धी कार्य और रियल एस्टेट आपके लिए अनुकूल हैं', 'education, hospitality, public service, marine work and real estate suit you'],
  Leo: ['प्रशासन, राजनीति, प्रबन्धन, मनोरंजन और सरकारी सेवा आपके लिए अनुकूल हैं', 'administration, politics, management, entertainment and government service suit you'],
  Virgo: ['चिकित्सा, लेखा, विश्लेषण, सॉफ्टवेयर और सेवा-क्षेत्र आपके लिए अनुकूल हैं', 'medicine, accounts, analysis, software and the service sector suit you'],
  Libra: ['विधि, व्यापार, फैशन, कला और साझेदारी-आधारित व्यवसाय आपके लिए अनुकूल हैं', 'law, trade, fashion, the arts and partnership businesses suit you'],
  Scorpio: ['अनुसंधान, चिकित्सा, गुप्तचर सेवा, बीमा और खनन के क्षेत्र आपके लिए अनुकूल हैं', 'research, medicine, investigation, insurance and mining suit you'],
  Sagittarius: ['शिक्षण, विधि, धर्म-दर्शन, परामर्श और विदेश-सम्बन्धी कार्य आपके लिए अनुकूल हैं', 'teaching, law, philosophy, consulting and foreign-linked work suit you'],
  Capricorn: ['प्रशासन, उद्योग, निर्माण, राजनीति और दीर्घकालीन संगठन आपके लिए अनुकूल हैं', 'administration, industry, construction, politics and long-term organisations suit you'],
  Aquarius: ['विज्ञान, तकनीक, समाज-सेवा, नवाचार और अनुसंधान आपके लिए अनुकूल हैं', 'science, technology, social service, innovation and research suit you'],
  Pisces: ['चिकित्सा, अध्यात्म, कला, समुद्री कार्य और परोपकार आपके लिए अनुकूल हैं', 'healing, spirituality, the arts, maritime work and charity suit you']
};

// Spouse nature by the sign on the 7th house
const SPOUSE_TRAIT = {
  Aries: ['साहसी, स्पष्टवादी और ऊर्जावान', 'bold, frank and energetic'], Taurus: ['सौम्य, सुन्दर और सुख-सुविधा प्रिय', 'gentle, attractive and comfort-loving'],
  Gemini: ['बुद्धिमान, वाक्पटु और मिलनसार', 'intelligent, articulate and friendly'], Cancer: ['भावुक, घरेलू और स्नेही', 'emotional, home-loving and affectionate'],
  Leo: ['स्वाभिमानी, प्रभावशाली और उदार', 'proud, impressive and generous'], Virgo: ['व्यवहार-कुशल, सुव्यवस्थित और सेवाभावी', 'tactful, organised and caring'],
  Libra: ['सुन्दर, सामाजिक और संतुलित', 'attractive, sociable and balanced'], Scorpio: ['गहन, आकर्षक और दृढ़', 'intense, magnetic and determined'],
  Sagittarius: ['धर्मप्रिय, शिक्षित और आशावादी', 'righteous, educated and optimistic'], Capricorn: ['गम्भीर, कर्मठ और उत्तरदायी', 'serious, hard-working and responsible'],
  Aquarius: ['विचारशील, स्वतन्त्र और मित्रवत', 'thoughtful, independent and amiable'], Pisces: ['करुणामय, कलाप्रिय और भावुक', 'compassionate, artistic and sensitive']
};

// Body areas by lagna sign
const BODY = {
  Aries: ['सिर, नेत्र और ज्वर', 'head, eyes and fevers'], Taurus: ['गला, दाँत और थायरॉइड', 'throat, teeth and thyroid'],
  Gemini: ['फेफड़े, कन्धे और स्नायु', 'lungs, shoulders and nerves'], Cancer: ['छाती, आमाशय और पाचन', 'chest, stomach and digestion'],
  Leo: ['हृदय, रीढ़ और रक्तचाप', 'heart, spine and blood pressure'], Virgo: ['आँतें, पाचन और त्वचा', 'intestines, digestion and skin'],
  Libra: ['गुर्दे, कमर और मूत्र-संस्थान', 'kidneys, lower back and urinary system'], Scorpio: ['प्रजनन-अंग, मूत्राशय और संक्रमण', 'reproductive organs, bladder and infections'],
  Sagittarius: ['जाँघ, यकृत और मोटापा', 'thighs, liver and weight'], Capricorn: ['घुटने, हड्डियाँ और जोड़', 'knees, bones and joints'],
  Aquarius: ['पिंडली, रक्त-संचार और स्नायु', 'calves, circulation and nerves'], Pisces: ['पैर, निद्रा और लसीका-तंत्र', 'feet, sleep and the lymphatic system']
};

const REMEDY = {
  Sun: ['रविवार', 'Sunday', '"ॐ घृणि सूर्याय नमः"', '"Om Ghrini Suryaya Namah"'],
  Moon: ['सोमवार', 'Monday', '"ॐ सों सोमाय नमः"', '"Om Som Somaya Namah"'],
  Mars: ['मंगलवार', 'Tuesday', '"ॐ अं अंगारकाय नमः"', '"Om Am Angarakaya Namah"'],
  Mercury: ['बुधवार', 'Wednesday', '"ॐ बुं बुधाय नमः"', '"Om Bum Budhaya Namah"'],
  Jupiter: ['गुरुवार', 'Thursday', '"ॐ बृं बृहस्पतये नमः"', '"Om Brim Brihaspataye Namah"'],
  Venus: ['शुक्रवार', 'Friday', '"ॐ शुं शुक्राय नमः"', '"Om Shum Shukraya Namah"'],
  Saturn: ['शनिवार', 'Saturday', '"ॐ शं शनैश्चराय नमः"', '"Om Sham Shanaishcharaya Namah"'],
  Rahu: ['शनिवार', 'Saturday', '"ॐ रां राहवे नमः"', '"Om Ram Rahave Namah"'],
  Ketu: ['मंगलवार', 'Tuesday', '"ॐ कें केतवे नमः"', '"Om Kem Ketave Namah"']
};

// ------------------------------------------------------------------
const H = (p) => PLANETS_HI[p];
const strong = (pl) => pl.dignity === 'exalted' || pl.dignity === 'own';
const weak = (pl) => pl.dignity === 'debilitated' || pl.combust;
const level = (pl) => (pl.strength >= 70 ? 'strong' : pl.strength >= 50 ? 'mid' : 'weak');
const fmt = (iso) => { const [y, m, d] = iso.split('-'); return `${d}-${m}-${y}`; };
const joinHi = (a) => a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} और ${a[a.length - 1]}`;
const joinEn = (a) => a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`;

/** pick[level] → text */
const pick = (lv, s, m, w) => (lv === 'strong' ? s : lv === 'mid' ? m : w);

// ------------------------------------------------------------------
function overview(k, name) {
  const P = k.planets; const L = k.lagna; const le = P[L.lord]; const M = P.Moon;
  const md = k.dasha.current.mahadasha; const mdP = P[md.lord];
  const who = name ? [`${String(name).trim()} जी, `, `${String(name).trim()} ji, `] : ['', ''];
  const d9 = le.navamsa.dignity;
  return [
    [`${who[0]}आपका लग्न ${L.signHindi} है और लग्नेश ${H(L.lord)} ${ORD.hi[le.house]} भाव में ${le.signHindi} राशि में ${DIG.hi[le.dignity]} अवस्था में हैं, जो ${LAGNA_TRAIT[L.sign][0]}।`,
      `${who[1]}your lagna is ${L.sign} and its lord ${L.lord} is ${DIG.en[le.dignity]} in ${le.sign} in the ${ORD.en[le.house]} house, which ${LAGNA_TRAIT[L.sign][1]}.`],
    [`आपकी चन्द्र राशि ${M.signHindi} और जन्म नक्षत्र ${k.nakshatra.nameHindi} (${k.nakshatra.pada} चरण) है, अतः ${MOON_TRAIT[M.sign][0]}।`,
      `your Moon sign is ${M.sign} and your birth nakshatra is ${k.nakshatra.name} (pada ${k.nakshatra.pada}), so ${MOON_TRAIT[M.sign][1]}.`],
    [`नवांश कुण्डली में लग्न ${k.navamsa.lagna.signHindi} है${k.navamsa.lagna.vargottama ? ' (वर्गोत्तम)' : ''} और लग्नेश ${H(L.lord)} नवांश में ${DIG.hi[d9]} हैं, ${d9 === 'exalted' || d9 === 'own' ? 'जिससे जन्मकुण्डली के शुभ फल जीवन में स्थायी रूप से फलित होंगे' : d9 === 'debilitated' ? 'अतः बाह्य सफलता के साथ मन की स्थिरता हेतु उपाय अपेक्षित हैं' : 'जिससे जीवन की दिशा स्थिर और संतुलित रहेगी'}।`,
      `in the navamsa the lagna is ${k.navamsa.lagna.sign}${k.navamsa.lagna.vargottama ? ' (vargottama)' : ''} and the lagna lord ${L.lord} is ${DIG.en[d9]} there, ${d9 === 'exalted' || d9 === 'own' ? 'so the good results of the birth chart will bear lasting fruit' : d9 === 'debilitated' ? 'so remedies are needed for inner steadiness alongside outer success' : 'so the direction of life stays steady and balanced'}.`],
    [`वर्तमान में ${md.lordHindi} की महादशा (${fmt(md.start)} से ${fmt(md.end)}) चल रही है और दशानाथ ${ORD.hi[mdP.house]} भाव में ${DIG.hi[mdP.dignity]} होने से यह काल ${pick(level(mdP), 'आपके लिए उन्नति और सम्मान का है', 'मिश्रित परन्तु परिश्रम से फलदायी है', 'धैर्य और सावधानी का है')}।`,
      `you are running the mahadasha of ${md.lord} (${fmt(md.start)} to ${fmt(md.end)}) and, with its lord ${DIG.en[mdP.dignity]} in the ${ORD.en[mdP.house]} house, this period ${pick(level(mdP), 'is one of progress and honour for you', 'is mixed but rewards effort', 'calls for patience and care')}.`]
  ];
}

function career(k) {
  const P = k.planets; const h10 = k.houses[9]; const l10 = h10.lord; const L10 = P[l10];
  const md = k.dasha.current.mahadasha; const mdP = P[md.lord];
  const idx = k.dasha.mahadashas.findIndex((m) => m.lord === md.lord);
  const next = idx >= 0 ? k.dasha.mahadashas[idx + 1] : null;
  const d9 = L10.navamsa.dignity; const d9lv = d9 === 'exalted' || d9 === 'own' ? 'strong' : d9 === 'debilitated' ? 'weak' : 'mid';
  const in10 = h10.planets;
  const mdCareer = md.lord === l10 || mdP.house === 10 || (level(mdP) === 'strong' && [1, 2, 6, 11].includes(mdP.house)) ? 'strong'
    : ([8, 12].includes(mdP.house) || level(mdP) === 'weak') ? 'weak' : 'mid';
  return [
    [`आपका कर्म भाव (दशम) ${h10.signHindi} राशि का है, जिसके स्वामी ${H(l10)} ${ORD.hi[L10.house]} भाव में ${DIG.hi[L10.dignity]} हैं, अतः ${CAREER_FIELD[h10.sign][0]}।`,
      `your 10th house of career is ${h10.sign}, whose lord ${l10} is ${DIG.en[L10.dignity]} in the ${ORD.en[L10.house]} house, so ${CAREER_FIELD[h10.sign][1]}.`],
    in10.length
      ? [`दशम भाव में ${joinHi(in10.map(H))} की स्थिति कर्मक्षेत्र में ${in10.some((p) => strong(P[p])) ? 'विशेष पद-प्रतिष्ठा और पहचान' : in10.some((p) => weak(P[p])) ? 'परिश्रम के बाद पहचान' : 'सक्रियता और अवसर'} का संकेत देती है।`,
        `${joinEn(in10)} in the 10th house ${in10.length > 1 ? 'indicate' : 'indicates'} ${in10.some((p) => strong(P[p])) ? 'notable position and recognition' : in10.some((p) => weak(P[p])) ? 'recognition after hard work' : 'activity and opportunity'} in your profession.`]
      : ['दशम भाव में कोई ग्रह न होने से करियर की दिशा दशमेश की दशा-अन्तर्दशा में स्पष्ट होगी।',
        'with no planet in the 10th house, the direction of your career becomes clear in the periods of the 10th lord.'],
    [`नवांश में दशमेश ${H(l10)} ${DIG.hi[d9]} हैं, जो ${pick(d9lv, 'कर्मक्षेत्र में स्थायी सफलता और पद-वृद्धि', 'क्रमिक प्रगति', 'करियर में उतार-चढ़ाव के बाद स्थिरता')} का सूचक है।`,
      `in the navamsa the 10th lord ${l10} is ${DIG.en[d9]}, indicating ${pick(d9lv, 'lasting professional success and rise in position', 'gradual progress', 'stability after ups and downs in career')}.`],
    [`${md.lordHindi} की महादशा में ${pick(mdCareer, 'पदोन्नति, नई जिम्मेदारी और आय-वृद्धि के प्रबल योग हैं', 'परिश्रम का फल क्रमशः मिलेगा', 'कार्यक्षेत्र में परिवर्तन और धैर्य अपेक्षित है')}${next ? `, और इसके बाद ${next.lordHindi} की महादशा ${fmt(next.start)} से आरम्भ होगी` : ''}।`,
      `in the mahadasha of ${md.lord} ${pick(mdCareer, 'there are strong indications of promotion, new responsibility and rising income', 'effort will be rewarded step by step', 'change at work and patience are called for')}${next ? `, and after it the mahadasha of ${next.lord} begins on ${fmt(next.start)}` : ''}.`]
  ];
}

function wealth(k) {
  const P = k.planets; const l2 = k.houses[1].lord; const l11 = k.houses[10].lord; const L2 = P[l2]; const L11 = P[l11]; const J = P.Jupiter;
  const md = k.dasha.current.mahadasha; const mdP = P[md.lord];
  const dhana = L2.house === L11.house || L2.house === 11 || L11.house === 2;
  const d9 = L2.navamsa.dignity; const d9lv = d9 === 'exalted' || d9 === 'own' ? 'strong' : d9 === 'debilitated' ? 'weak' : 'mid';
  const mdW = md.lord === l2 || md.lord === l11 || [2, 11].includes(mdP.house) || level(mdP) === 'strong' ? 'strong'
    : [6, 8, 12].includes(mdP.house) || level(mdP) === 'weak' ? 'weak' : 'mid';
  return [
    [`धनेश ${H(l2)} ${ORD.hi[L2.house]} भाव में ${DIG.hi[L2.dignity]} और लाभेश ${H(l11)} ${ORD.hi[L11.house]} भाव में ${DIG.hi[L11.dignity]} हैं, ${dhana ? 'जिनका परस्पर सम्बन्ध धन योग बनाकर आय के स्रोत बढ़ाता है' : 'अतः धन-संचय परिश्रम और नियोजन से क्रमशः होगा'}।`,
      `the 2nd lord ${l2} is ${DIG.en[L2.dignity]} in the ${ORD.en[L2.house]} house and the 11th lord ${l11} is ${DIG.en[L11.dignity]} in the ${ORD.en[L11.house]} house, ${dhana ? 'and their link forms Dhana Yoga, multiplying sources of income' : 'so wealth accumulates gradually through effort and planning'}.`],
    [`धन-कारक गुरु ${J.signHindi} में ${DIG.hi[J.dignity]} होकर ${ORD.hi[J.house]} भाव में हैं, जो ${pick(level(J), 'धन, बचत और सम्पत्ति में वृद्धि', 'संतुलित आर्थिक स्थिति', 'व्यय पर नियंत्रण की आवश्यकता')} दर्शाते हैं।`,
      `Jupiter, the karaka of wealth, is ${DIG.en[J.dignity]} in ${J.sign} in the ${ORD.en[J.house]} house, showing ${pick(level(J), 'growth of wealth, savings and property', 'a balanced financial position', 'a need to control expenses')}.`],
    [`नवांश में धनेश ${H(l2)} ${DIG.hi[d9]} हैं, अतः ${pick(d9lv, 'धन का स्थायित्व और सम्पत्ति-लाभ बना रहेगा', 'आर्थिक स्थिति सामान्य और स्थिर रहेगी', 'आर्थिक उतार-चढ़ाव से बचने हेतु बचत आवश्यक है')}।`,
      `in the navamsa the 2nd lord ${l2} is ${DIG.en[d9]}, so ${pick(d9lv, 'wealth stays stable and property gains continue', 'finances remain normal and steady', 'saving is essential to avoid financial swings')}.`],
    [`${md.lordHindi} की महादशा में ${pick(mdW, 'आय-वृद्धि, सम्पत्ति-लाभ और बचत के उत्तम योग हैं', 'आय स्थिर रहेगी और बचत सम्भव होगी', 'अनावश्यक व्यय और ऋण से बचें तथा निवेश सोच-समझकर करें')}।`,
      `in the mahadasha of ${md.lord} ${pick(mdW, 'there are fine prospects of rising income, property gains and savings', 'income stays steady and saving is possible', 'avoid needless expense and debt, and invest with care')}.`]
  ];
}

function marriage(k, gender) {
  const P = k.planets; const h7 = k.houses[6]; const l7 = h7.lord; const L7 = P[l7];
  const karaka = gender === 'female' ? 'Jupiter' : 'Venus'; const K = P[karaka];
  const kLabel = gender === 'female' ? ['पति-कारक गुरु', 'Jupiter, karaka of the husband,'] : ['पत्नी-कारक शुक्र', 'Venus, karaka of the wife,'];
  const md = k.dasha.current.mahadasha; const mdP = P[md.lord];
  const mars = P.Mars; const fromMoon = ((mars.signIndex - P.Moon.signIndex + 12) % 12) + 1;
  const MD = [1, 2, 4, 7, 8, 12]; const mdL = MD.includes(mars.house); const mdM = MD.includes(fromMoon);
  const cancelled = strong(mars) || mars.house === P.Jupiter.house;
  const sc = (d) => ({ exalted: 2, own: 2, friend: 1, neutral: 0, enemy: -1, debilitated: -2 }[d] || 0);
  const d97 = k.navamsa.houses[6].planets;
  const score = sc(L7.navamsa.dignity) + sc(K.navamsa.dignity)
    + d97.filter((p) => ['Jupiter', 'Venus', 'Mercury', 'Moon'].includes(p)).length
    - d97.filter((p) => ['Mars', 'Saturn', 'Rahu', 'Ketu', 'Sun'].includes(p)).length;
  const mdM7 = md.lord === l7 || md.lord === karaka || mdP.house === 7 ? 'strong' : [6, 8, 12].includes(mdP.house) ? 'weak' : 'mid';
  return [
    [`सप्तमेश ${H(l7)} ${ORD.hi[L7.house]} भाव में ${DIG.hi[L7.dignity]} और ${kLabel[0]} ${K.signHindi} में ${DIG.hi[K.dignity]} हैं, जो ${SPOUSE_TRAIT[h7.sign][0]} जीवनसाथी का संकेत देते हैं।`,
      `the 7th lord ${l7} is ${DIG.en[L7.dignity]} in the ${ORD.en[L7.house]} house and ${kLabel[1]} is ${DIG.en[K.dignity]} in ${K.sign}, pointing to a ${SPOUSE_TRAIT[h7.sign][1]} life partner.`],
    (mdL || mdM)
      ? [`मंगल ${mdL ? `लग्न से ${ORD.hi[mars.house]}` : `चन्द्र से ${ORD.hi[fromMoon]}`} भाव में होने से ${mdL && mdM ? 'पूर्ण' : 'आंशिक'} मंगल दोष है${cancelled ? ', जो मंगल के बलवान होने से प्रायः निष्प्रभावी है' : ', अतः विवाह से पूर्व कुण्डली-मिलान अवश्य कराएँ'}।`,
        `Mars in the ${mdL ? `${ORD.en[mars.house]} house from the lagna` : `${ORD.en[fromMoon]} house from the Moon`} gives ${mdL && mdM ? 'full' : 'partial'} Mangal Dosha${cancelled ? ', which is largely neutralised as Mars is strong' : ', so horoscope matching before marriage is essential'}.`]
      : ['कुण्डली में मंगल दोष नहीं है, अतः वैवाहिक जीवन में इस दोष की कोई बाधा नहीं है।',
        'there is no Mangal Dosha in the chart, so married life faces no obstacle from it.'],
    [`नवांश में सप्तमेश ${H(l7)} ${DIG.hi[L7.navamsa.dignity]} और ${kLabel[0]} ${DIG.hi[K.navamsa.dignity]} हैं${d97.length ? ` तथा नवांश के सप्तम भाव में ${joinHi(d97.map(H))} स्थित ${d97.length > 1 ? 'हैं' : 'है'}` : ''}, ${score >= 2 ? 'जो दाम्पत्य में सामंजस्य और सुखद गृहस्थी का शुभ संकेत है' : score >= 0 ? 'जिससे दाम्पत्य जीवन संवाद और धैर्य से मधुर रहेगा' : 'अतः विवाह-निर्णय शुभ मुहूर्त और कुण्डली-मिलान के बाद ही करें'}।`,
      `in the navamsa the 7th lord ${l7} is ${DIG.en[L7.navamsa.dignity]} and ${kLabel[1]} is ${DIG.en[K.navamsa.dignity]}${d97.length ? `, with ${joinEn(d97)} in the 7th house of the navamsa` : ''}, ${score >= 2 ? 'an auspicious sign of harmony and a happy household' : score >= 0 ? 'so married life stays sweet through dialogue and patience' : 'so decide on marriage only after horoscope matching and in an auspicious muhurta'}.`],
    [`${md.lordHindi} की महादशा ${pick(mdM7, 'विवाह और सम्बन्धों के लिए अनुकूल है तथा इसी अवधि में विवाह या दाम्पत्य-सुख के योग बनते हैं', 'में वैवाहिक जीवन सामान्यतः स्थिर रहेगा', 'में सम्बन्धों में धैर्य और संवाद आवश्यक है')}।`,
      `the mahadasha of ${md.lord} ${pick(mdM7, 'is favourable for marriage and relationships, and marriage or marital happiness is indicated in this very period', 'keeps married life generally stable', 'asks for patience and dialogue in relationships')}.`]
  ];
}

function health(k) {
  const P = k.planets; const L = k.lagna; const le = P[L.lord]; const M = P.Moon;
  const l6 = k.houses[5].lord; const l8 = k.houses[7].lord;
  const md = k.dasha.current.mahadasha; const mdP = P[md.lord];
  const d9 = le.navamsa.dignity; const d9lv = d9 === 'exalted' || d9 === 'own' ? 'strong' : d9 === 'debilitated' ? 'weak' : 'mid';
  const moonLv = strong(M) || [1, 4, 7, 10].includes(M.house) ? 'strong' : weak(M) ? 'weak' : 'mid';
  const seven = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const rp = seven.find((p) => P[p].dignity === 'debilitated') || (level(mdP) === 'weak' ? md.lord : null) || (level(le) === 'weak' ? L.lord : null) || md.lord;
  const R = REMEDY[rp];
  const mdH = [6, 8, 12].includes(mdP.house) || level(mdP) === 'weak' ? 'weak' : 'strong';
  return [
    [`लग्नेश ${H(L.lord)} ${DIG.hi[le.dignity]} होने से आपकी शारीरिक क्षमता ${pick(level(le), 'उत्तम और रोग-प्रतिरोधक शक्ति प्रबल है', 'संतुलित है', 'सामान्य है और स्वास्थ्य के प्रति नियमित सजगता आवश्यक है')}।`,
      `with the lagna lord ${L.lord} ${DIG.en[le.dignity]}, your physical constitution ${pick(level(le), 'is excellent with strong immunity', 'is balanced', 'is average and needs regular attention to health')}.`],
    [`षष्ठेश ${H(l6)} ${ORD.hi[P[l6].house]} भाव में और अष्टमेश ${H(l8)} ${ORD.hi[P[l8].house]} भाव में हैं, अतः ${BODY[L.sign][0]} से जुड़ी सावधानी रखें।`,
      `the 6th lord ${l6} is in the ${ORD.en[P[l6].house]} house and the 8th lord ${l8} in the ${ORD.en[P[l8].house]} house, so take care of the ${BODY[L.sign][1]}.`],
    [`चन्द्रमा ${ORD.hi[M.house]} भाव में ${DIG.hi[M.dignity]} होने से मानसिक स्थिति ${pick(moonLv, 'स्थिर और प्रसन्न रहेगी', 'सामान्य रहेगी', 'में तनाव की प्रवृत्ति हो सकती है, अतः ध्यान और प्राणायाम लाभकारी हैं')}।`,
      `with the Moon ${DIG.en[M.dignity]} in the ${ORD.en[M.house]} house, your mental state ${pick(moonLv, 'stays steady and cheerful', 'stays normal', 'may lean towards stress, so meditation and pranayama help')}.`],
    [`नवांश में लग्नेश ${DIG.hi[d9]} हैं, अतः दीर्घकालीन स्वास्थ्य ${pick(d9lv, 'सुदृढ़ रहेगा', 'सामान्य रहेगा', 'हेतु दिनचर्या और आहार पर विशेष ध्यान आवश्यक है')}।`,
      `in the navamsa the lagna lord is ${DIG.en[d9]}, so long-term health ${pick(d9lv, 'remains robust', 'remains normal', 'needs special attention to routine and diet')}.`],
    [`${md.lordHindi} की महादशा में ${mdH === 'weak' ? 'स्वास्थ्य की उपेक्षा न करें और नियमित जाँच कराएँ' : 'स्वास्थ्य सामान्यतः अनुकूल रहेगा'}, तथा ${H(rp)} हेतु ${R[0]} को ${R[2]} का जप आपके लिए लाभकारी रहेगा।`,
      `in the mahadasha of ${md.lord} ${mdH === 'weak' ? 'do not neglect health and get regular check-ups' : 'health stays generally favourable'}, and chanting ${R[3]} on ${R[1]} for ${rp} will benefit you.`]
  ];
}

// ------------------------------------------------------------------
const TITLES = {
  kundli: ['कुण्डली', 'Kundli'], career: ['करियर', 'Career'], wealth: ['धन-सम्पत्ति', 'Wealth'],
  marriage: ['विवाह', 'Marriage'], health: ['स्वास्थ्य', 'Health']
};

function toBrief(key, pairs, lang) {
  const i = lang === 'hi' ? 0 : 1;
  const sentences = pairs.map((p) => `${PREFIX[lang]} ${p[i]}`);
  return { key, title: TITLES[key][i], sentences, text: sentences.join(' ') };
}

/**
 * @param {object} input { dateOfBirth, timeOfBirth, latitude, longitude, timezoneOffset?, name?, gender? }
 */
function generateKundliBrief(input) {
  const k = computeKundli(input);
  const gender = String(input.gender || '').toLowerCase();
  const raw = {
    kundli: overview(k, input.name),
    career: career(k),
    wealth: wealth(k),
    marriage: marriage(k, gender),
    health: health(k)
  };
  const phal = { hi: [], en: [] };
  Object.keys(raw).forEach((key) => {
    phal.hi.push(toBrief(key, raw[key], 'hi'));
    phal.en.push(toBrief(key, raw[key], 'en'));
  });

  const planets = {};
  Object.values(k.planets).forEach((p) => {
    planets[p.name] = {
      nameHindi: p.nameHindi,
      sign: p.sign, signHindi: p.signHindi, degree: p.degreeFormatted, house: p.house,
      nakshatra: p.nakshatra.name, nakshatraHindi: p.nakshatra.nameHindi, pada: p.nakshatra.pada,
      dignity: p.dignity, dignityHindi: p.dignityHindi, retrograde: p.retrograde, combust: p.combust,
      navamsaSign: p.navamsa.sign, navamsaSignHindi: p.navamsa.signHindi, navamsaHouse: p.navamsa.house, vargottama: p.navamsa.vargottama
    };
  });

  return {
    prefix: PREFIX,
    phal,
    lagna: { sign: k.lagna.sign, signHindi: k.lagna.signHindi, degree: k.lagna.degreeFormatted, lord: k.lagna.lord, lordHindi: k.lagna.lordHindi },
    rashi: { sign: k.rashi.sign, signHindi: k.rashi.signHindi },
    nakshatra: { name: k.nakshatra.name, nameHindi: k.nakshatra.nameHindi, pada: k.nakshatra.pada, lord: k.nakshatra.lord, lordHindi: k.nakshatra.lordHindi },
    navamsaLagna: { sign: k.navamsa.lagna.sign, signHindi: k.navamsa.lagna.signHindi, lord: k.navamsa.lagna.lord, lordHindi: k.navamsa.lagna.lordHindi, vargottama: k.navamsa.lagna.vargottama },
    planets,
    mahadasha: {
      current: k.dasha.current.mahadasha,
      antardasha: k.dasha.current.antardasha,
      list: k.dasha.mahadashas
    },
    ayanamsa: k.meta.ayanamsaName
  };
}

module.exports = { generateKundliBrief, PREFIX };
