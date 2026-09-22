'use strict';

/**
 * Kundli Phal (कुण्डली फल)
 * ------------------------------------------------------------------
 * Turns the raw chart from kundliEngine into a short, astrologer-style
 * Hindi reading. Every section (and the short summary) starts with the
 * mandated opening line:
 *
 *   "ज्योतिषविश्वकोश संहिता में पं. अवधनरेश जी कहते हैं कि"
 *
 * Sections: लग्न, चन्द्र-नक्षत्र, ग्रह-योग, नवांश (D9), दशा, उपाय.
 */

const { computeKundli, SIGN_LORD, PLANETS_HI, NATURAL_BENEFICS } = require('./kundliEngine');

const PREFIX = 'ज्योतिषविश्वकोश संहिता में पं. अवधनरेश जी कहते हैं कि';
const say = (text) => `${PREFIX} ${text}`;

const HOUSE_NAME = {
  1: 'लग्न (तनु)', 2: 'धन', 3: 'पराक्रम', 4: 'सुख', 5: 'संतान-विद्या', 6: 'रिपु-रोग',
  7: 'विवाह-जीवनसाथी', 8: 'आयु', 9: 'भाग्य-धर्म', 10: 'कर्म', 11: 'लाभ', 12: 'व्यय-मोक्ष'
};
const HOUSE_THEME = {
  1: 'स्वास्थ्य, व्यक्तित्व और आत्मबल', 2: 'धन, वाणी और कुटुम्ब', 3: 'पराक्रम, भाई-बहन और छोटी यात्राएँ',
  4: 'माता, गृह-सुख, वाहन और भूमि', 5: 'संतान, विद्या, बुद्धि और प्रेम-सम्बन्ध', 6: 'रोग, ऋण, शत्रु और प्रतियोगिता',
  7: 'विवाह, जीवनसाथी और साझेदारी', 8: 'आयु, गुप्त विद्या और अचानक परिवर्तन', 9: 'भाग्य, धर्म, गुरु और दूर-यात्रा',
  10: 'कर्म, पद-प्रतिष्ठा और राजकीय सम्मान', 11: 'आय, लाभ, मित्र और इच्छा-पूर्ति', 12: 'व्यय, विदेश, शयन-सुख और मोक्ष'
};
const ORD = { 1: 'प्रथम', 2: 'द्वितीय', 3: 'तृतीय', 4: 'चतुर्थ', 5: 'पंचम', 6: 'षष्ठ', 7: 'सप्तम', 8: 'अष्टम', 9: 'नवम', 10: 'दशम', 11: 'एकादश', 12: 'द्वादश' };

const LAGNA_TRAITS = {
  Aries: 'मेष लग्न के जातक साहसी, तेजस्वी और नेतृत्व-प्रिय होते हैं; निर्णय शीघ्र लेते हैं और आगे बढ़कर कार्य करना इनका स्वभाव है, किन्तु क्रोध व उतावलेपन पर संयम आवश्यक है।',
  Taurus: 'वृषभ लग्न के जातक धैर्यवान, सौन्दर्यप्रिय और स्थिर बुद्धि वाले होते हैं; धन-संचय, कला और सुख-साधनों के प्रति स्वाभाविक रुचि रहती है।',
  Gemini: 'मिथुन लग्न के जातक बुद्धिमान, वाक्पटु और बहुमुखी प्रतिभा के धनी होते हैं; लेखन, संवाद, व्यापार और तकनीक में विशेष सफलता मिलती है।',
  Cancer: 'कर्क लग्न के जातक भावुक, संवेदनशील और परिवार-प्रेमी होते हैं; इनमें कल्पनाशक्ति व स्मरणशक्ति प्रबल होती है और मन की स्थिरता ही इनकी उन्नति की कुंजी है।',
  Leo: 'सिंह लग्न के जातक स्वाभिमानी, उदार और राजसी प्रवृत्ति के होते हैं; अधिकार, सम्मान और नेतृत्व इन्हें स्वाभाविक रूप से आकर्षित करते हैं।',
  Virgo: 'कन्या लग्न के जातक विश्लेषणशील, व्यवहार-कुशल और परिश्रमी होते हैं; लेखा, चिकित्सा, शोध और सेवा-कार्यों में इनकी सूक्ष्म दृष्टि विशेष लाभ देती है।',
  Libra: 'तुला लग्न के जातक न्यायप्रिय, सौम्य और सामाजिक होते हैं; संतुलन बनाए रखना इनकी विशेषता है और कला, व्यापार व साझेदारी से लाभ प्राप्त होता है।',
  Scorpio: 'वृश्चिक लग्न के जातक गहन, रहस्यमय और दृढ़-निश्चयी होते हैं; इनमें अद्भुत सहनशक्ति व अनुसंधान-वृत्ति होती है और संकट में भी ये विचलित नहीं होते।',
  Sagittarius: 'धनु लग्न के जातक धर्मपरायण, आशावादी और स्पष्टवादी होते हैं; शिक्षा, दर्शन, विधि और परामर्श के क्षेत्र इनके लिए विशेष अनुकूल रहते हैं।',
  Capricorn: 'मकर लग्न के जातक कर्मठ, अनुशासित और महत्वाकांक्षी होते हैं; धीरे-धीरे परन्तु निश्चित रूप से ऊँचाइयों तक पहुँचना इनका स्वभाव है।',
  Aquarius: 'कुंभ लग्न के जातक विचारशील, मानवतावादी और मौलिक चिन्तन वाले होते हैं; नवीन विचारों, विज्ञान और समाज-सेवा में इनकी विशेष रुचि रहती है।',
  Pisces: 'मीन लग्न के जातक करुणामय, कल्पनाशील और आध्यात्मिक प्रवृत्ति के होते हैं; कला, अध्यात्म, चिकित्सा और परोपकार के क्षेत्र इन्हें संतोष देते हैं।'
};

const LAGNESH_IN_HOUSE = {
  1: 'लग्नेश का लग्न में ही स्थित होना उत्तम स्वास्थ्य, आत्मबल और स्वतन्त्र निर्णय-क्षमता प्रदान करता है।',
  2: 'लग्नेश का धन भाव में होना जातक को अपने ही प्रयासों से धन-संचय व कुटुम्ब का सुख देता है; वाणी प्रभावशाली रहती है।',
  3: 'लग्नेश का पराक्रम भाव में होना जातक को साहसी, उद्यमी और भाई-बहनों से स्नेह रखने वाला बनाता है।',
  4: 'लग्नेश का सुख भाव में होना माता का सुख, भूमि-वाहन और गृह-सौख्य देता है; मन शांत व स्थिर रहता है।',
  5: 'लग्नेश का पंचम भाव में होना विद्या, बुद्धि और संतान का सुख देता है; जातक भाग्यवान व कलाप्रिय होता है।',
  6: 'लग्नेश का षष्ठ भाव में होना जातक को प्रतियोगिता व शत्रुओं पर विजय दिलाता है, किन्तु स्वास्थ्य व ऋण के प्रति सजगता आवश्यक है।',
  7: 'लग्नेश का सप्तम भाव में होना विवाह और साझेदारी को जीवन का केन्द्र बनाता है; जीवनसाथी से विशेष लाभ प्राप्त होता है।',
  8: 'लग्नेश का अष्टम भाव में होना गूढ़ विद्याओं में रुचि व दीर्घायु देता है, परन्तु अचानक उतार-चढ़ाव के प्रति सावधानी अपेक्षित है।',
  9: 'लग्नेश का भाग्य भाव में होना अत्यन्त शुभ है; जातक भाग्यशाली, धर्मपरायण और गुरुजनों की कृपा प्राप्त करने वाला होता है।',
  10: 'लग्नेश का कर्म भाव में होना कर्मयोगी बनाता है; राजकीय सम्मान, पद-प्रतिष्ठा और व्यवसाय में उन्नति के प्रबल संकेत हैं।',
  11: 'लग्नेश का लाभ भाव में होना आय के अनेक स्रोत, मित्रों का सहयोग और इच्छाओं की पूर्ति कराता है।',
  12: 'लग्नेश का व्यय भाव में होना विदेश-सम्बन्ध, अध्यात्म और त्याग की प्रवृत्ति देता है; व्यय पर नियंत्रण से उन्नति निश्चित है।'
};

const MOON_SIGN_MIND = {
  Aries: 'मेष का चन्द्रमा मन को उत्साही, निर्भीक और तत्पर बनाता है; आप भावनाओं को शीघ्र व्यक्त करते हैं।',
  Taurus: 'वृषभ का चन्द्रमा मन को स्थिर, सहनशील और सुख-प्रिय बनाता है; आप सम्बन्धों में निष्ठावान रहते हैं।',
  Gemini: 'मिथुन का चन्द्रमा मन को चंचल, जिज्ञासु और संवादप्रिय बनाता है; आप नई बातें शीघ्र सीखते हैं।',
  Cancer: 'कर्क का चन्द्रमा स्वराशि का है, अतः मन भावुक, ममतामय और कल्पनाशील रहता है; परिवार आपकी शक्ति है।',
  Leo: 'सिंह का चन्द्रमा मन को स्वाभिमानी, उदार और महत्वाकांक्षी बनाता है; सम्मान आपके लिए महत्वपूर्ण है।',
  Virgo: 'कन्या का चन्द्रमा मन को व्यावहारिक, विश्लेषणशील और सेवाभावी बनाता है; आप हर बात की गहराई में जाते हैं।',
  Libra: 'तुला का चन्द्रमा मन को संतुलित, सौन्दर्यप्रिय और सामाजिक बनाता है; आप मेल-मिलाप के पक्षधर हैं।',
  Scorpio: 'वृश्चिक का चन्द्रमा मन को गहन, तीव्र और दृढ़ बनाता है; आप अपनी भावनाएँ सरलता से प्रकट नहीं करते।',
  Sagittarius: 'धनु का चन्द्रमा मन को आशावादी, धर्मप्रिय और स्पष्टवादी बनाता है; ज्ञान की खोज आपको आनन्द देती है।',
  Capricorn: 'मकर का चन्द्रमा मन को गंभीर, अनुशासित और लक्ष्य-केन्द्रित बनाता है; आप उत्तरदायित्व निभाने वाले हैं।',
  Aquarius: 'कुंभ का चन्द्रमा मन को स्वतन्त्र, विचारशील और मानवतावादी बनाता है; आप परम्परा से हटकर सोचते हैं।',
  Pisces: 'मीन का चन्द्रमा मन को करुणामय, कल्पनाशील और आध्यात्मिक बनाता है; आपकी अन्तर्दृष्टि प्रबल है।'
};

const NAK_TRAIT = {
  Ashwini: 'अश्विनी नक्षत्र शीघ्रता, चिकित्सा-कौशल और नवीन आरम्भ की ऊर्जा देता है।',
  Bharani: 'भरणी नक्षत्र सहनशीलता, उत्तरदायित्व और सृजन की प्रबल शक्ति देता है।',
  Krittika: 'कृत्तिका नक्षत्र तेज, स्पष्टवादिता और अन्याय के प्रति असहिष्णुता देता है।',
  Rohini: 'रोहिणी नक्षत्र सौन्दर्य, आकर्षण, कला और भौतिक समृद्धि का वरदान देता है।',
  Mrigashira: 'मृगशिरा नक्षत्र जिज्ञासा, खोज-प्रवृत्ति और मधुर वाणी देता है।',
  Ardra: 'आर्द्रा नक्षत्र तीक्ष्ण बुद्धि, परिवर्तन-क्षमता और गहन अनुभवों से सीखने की शक्ति देता है।',
  Punarvasu: 'पुनर्वसु नक्षत्र पुनरुत्थान, आशावाद और हर परिस्थिति से उबरने की क्षमता देता है।',
  Pushya: 'पुष्य नक्षत्र पोषण, धर्म, सेवा और स्थायी समृद्धि का श्रेष्ठ नक्षत्र है।',
  Ashlesha: 'आश्लेषा नक्षत्र गहन अन्तर्दृष्टि, रहस्य-ज्ञान और सम्मोहक व्यक्तित्व देता है।',
  Magha: 'मघा नक्षत्र पितृ-कृपा, राजसी प्रवृत्ति और परम्परा के प्रति सम्मान देता है।',
  'Purva Phalguni': 'पूर्वा फाल्गुनी नक्षत्र आनन्द, कला, प्रेम और सामाजिक आकर्षण देता है।',
  'Uttara Phalguni': 'उत्तरा फाल्गुनी नक्षत्र उदारता, परोपकार और स्थायी सम्बन्धों की क्षमता देता है।',
  Hasta: 'हस्त नक्षत्र हस्त-कौशल, चतुरता और कार्य में निपुणता देता है।',
  Chitra: 'चित्रा नक्षत्र सृजनात्मकता, कलात्मक दृष्टि और आकर्षक व्यक्तित्व देता है।',
  Swati: 'स्वाति नक्षत्र स्वतन्त्रता, व्यापार-बुद्धि और लचीलापन देता है।',
  Vishakha: 'विशाखा नक्षत्र लक्ष्य के प्रति दृढ़ता, महत्वाकांक्षा और विजय की वृत्ति देता है।',
  Anuradha: 'अनुराधा नक्षत्र मित्रता, भक्ति, संगठन-क्षमता और विदेश से लाभ देता है।',
  Jyeshtha: 'ज्येष्ठा नक्षत्र संरक्षक-भाव, अधिकार और गूढ़ विषयों में सामर्थ्य देता है।',
  Mula: 'मूल नक्षत्र जड़ तक जाने की खोजी प्रवृत्ति, दर्शन और परिवर्तन की शक्ति देता है।',
  'Purva Ashadha': 'पूर्वाषाढ़ा नक्षत्र अजेय आत्मविश्वास, प्रेरक वाणी और उत्साह देता है।',
  'Uttara Ashadha': 'उत्तराषाढ़ा नक्षत्र धर्मनिष्ठा, नेतृत्व और अन्तिम विजय का आशीर्वाद देता है।',
  Shravana: 'श्रवण नक्षत्र श्रवण-ज्ञान, विद्वत्ता, यश और सीखने की अपार क्षमता देता है।',
  Dhanishta: 'धनिष्ठा नक्षत्र संगीत, धन, ताल और सामूहिक कार्यों में सफलता देता है।',
  Shatabhisha: 'शतभिषा नक्षत्र चिकित्सा, रहस्य-ज्ञान, एकान्त-प्रियता और मौलिक चिन्तन देता है।',
  'Purva Bhadrapada': 'पूर्वा भाद्रपद नक्षत्र तप, तीव्र बुद्धि और आध्यात्मिक-भौतिक दोनों की चाह देता है।',
  'Uttara Bhadrapada': 'उत्तरा भाद्रपद नक्षत्र गम्भीरता, करुणा, धैर्य और गहन ज्ञान देता है।',
  Revati: 'रेवती नक्षत्र पोषण, यात्रा-सुख, सौम्यता और सर्वजन-हितकारी प्रवृत्ति देता है।'
};

const KARAKAMSA_THEME = {
  Aries: 'आत्मा का झुकाव साहस, सुरक्षा-सम्बन्धी कार्यों, भूमि और नेतृत्व की ओर है।',
  Taurus: 'आत्मा का झुकाव धन-सम्पदा, कला, सौन्दर्य और सुख-साधनों के सृजन की ओर है।',
  Gemini: 'आत्मा का झुकाव लेखन, संवाद, व्यापार और बौद्धिक कार्यों की ओर है।',
  Cancer: 'आत्मा का झुकाव पोषण, जल-सम्बन्धी कार्यों, जनसेवा और परिवार की ओर है।',
  Leo: 'आत्मा का झुकाव अधिकार, प्रशासन, राजनीति और नेतृत्व की ओर है।',
  Virgo: 'आत्मा का झुकाव चिकित्सा, लेखा, सेवा और सूक्ष्म विश्लेषण की ओर है।',
  Libra: 'आत्मा का झुकाव व्यापार, न्याय, कला और सामाजिक सम्बन्धों की ओर है।',
  Scorpio: 'आत्मा का झुकाव अनुसंधान, गुप्त विद्या, चिकित्सा और गहन साधना की ओर है।',
  Sagittarius: 'आत्मा का झुकाव शिक्षा, धर्म, विधि और मार्गदर्शन की ओर है।',
  Capricorn: 'आत्मा का झुकाव संगठन, प्रशासन, उद्योग और दीर्घकालीन निर्माण की ओर है।',
  Aquarius: 'आत्मा का झुकाव समाज-सेवा, विज्ञान, नवाचार और सामूहिक कल्याण की ओर है।',
  Pisces: 'आत्मा का झुकाव अध्यात्म, करुणा, कला और मोक्ष-मार्ग की ओर है।'
};

const DASHA_LORD_EFFECT = {
  Sun: 'सूर्य की दशा आत्मबल, पिता, राजकीय सम्पर्क और पद-प्रतिष्ठा से जुड़े विषयों को सक्रिय करती है।',
  Moon: 'चन्द्र की दशा मन, माता, जन-सम्पर्क, यात्रा और भावनात्मक विषयों को प्रधान बनाती है।',
  Mars: 'मंगल की दशा साहस, भूमि-सम्पत्ति, भाई-बन्धु और ऊर्जा से जुड़े कार्यों को गति देती है।',
  Mercury: 'बुध की दशा बुद्धि, शिक्षा, व्यापार, लेखन और संवाद के क्षेत्रों को उभारती है।',
  Jupiter: 'गुरु की दशा ज्ञान, धर्म, संतान, धन-वृद्धि और गुरुजनों की कृपा का काल होती है।',
  Venus: 'शुक्र की दशा सुख-सुविधा, विवाह, प्रेम, कला और भौतिक समृद्धि का काल होती है।',
  Saturn: 'शनि की दशा कर्म, अनुशासन, परिश्रम और दीर्घकालीन स्थायित्व की परीक्षा लेती है।',
  Rahu: 'राहु की दशा अचानक परिवर्तन, विदेश-सम्बन्ध, तकनीक और महत्वाकांक्षा को प्रबल करती है।',
  Ketu: 'केतु की दशा वैराग्य, आत्म-चिन्तन, गूढ़ ज्ञान और आकस्मिक घटनाओं का काल होती है।'
};

const REMEDY = {
  Sun: { day: 'रविवार', mantra: '"ॐ घृणि सूर्याय नमः"', dana: 'गेहूँ, गुड़ एवं ताँबे', extra: 'प्रातः सूर्य को जल अर्पित करना और पिता का सम्मान' },
  Moon: { day: 'सोमवार', mantra: '"ॐ सों सोमाय नमः"', dana: 'चावल, दूध एवं श्वेत वस्त्र', extra: 'शिव-आराधना और माता की सेवा' },
  Mars: { day: 'मंगलवार', mantra: '"ॐ अं अंगारकाय नमः"', dana: 'मसूर दाल, लाल वस्त्र एवं गुड़', extra: 'हनुमान चालीसा का पाठ' },
  Mercury: { day: 'बुधवार', mantra: '"ॐ बुं बुधाय नमः"', dana: 'हरे मूँग एवं हरे वस्त्र', extra: 'गणेश-आराधना और गौ-सेवा' },
  Jupiter: { day: 'गुरुवार', mantra: '"ॐ बृं बृहस्पतये नमः"', dana: 'चने की दाल, हल्दी एवं पीले वस्त्र', extra: 'गुरुजनों की सेवा और विष्णु-आराधना' },
  Venus: { day: 'शुक्रवार', mantra: '"ॐ शुं शुक्राय नमः"', dana: 'दही, चावल एवं श्वेत वस्त्र', extra: 'लक्ष्मी-आराधना और स्वच्छता का पालन' },
  Saturn: { day: 'शनिवार', mantra: '"ॐ शं शनैश्चराय नमः"', dana: 'काले तिल, उड़द, लोहा एवं सरसों तेल', extra: 'हनुमान जी की आराधना और श्रमिकों की सहायता' },
  Rahu: { day: 'शनिवार', mantra: '"ॐ रां राहवे नमः"', dana: 'नीले वस्त्र, नारियल एवं उड़द', extra: 'दुर्गा-सप्तशती का पाठ' },
  Ketu: { day: 'मंगलवार', mantra: '"ॐ कें केतवे नमः"', dana: 'तिल, कम्बल एवं बहुरंगी वस्त्र', extra: 'गणेश-आराधना और कुत्तों को भोजन' }
};

// ------------------------------------------------------------------
// helpers
// ------------------------------------------------------------------
const H = (p) => PLANETS_HI[p];
const isStrong = (pl) => pl.dignity === 'exalted' || pl.dignity === 'own';
const isWeak = (pl) => pl.dignity === 'debilitated' || pl.combust;
const houseFromMoon = (k, p) => ((k.planets[p].signIndex - k.planets.Moon.signIndex + 12) % 12) + 1;
const lordOfHouse = (k, h) => k.houses[h - 1].lord;
const join = (arr) => arr.length <= 1 ? arr.join('') : `${arr.slice(0, -1).join(', ')} और ${arr[arr.length - 1]}`;
const joinEn = (arr) => arr.length <= 1 ? arr.join('') : `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`;
const ORD_EN = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th', 6: '6th', 7: '7th', 8: '8th', 9: '9th', 10: '10th', 11: '11th', 12: '12th' };
const DIG_EN = { exalted: 'exalted', own: 'in its own sign', friend: 'in a friendly sign', neutral: 'in a neutral sign', enemy: 'in an inimical sign', debilitated: 'debilitated' };
// distinct house themes, at most three, separated so the sentence stays readable
const themes = (planets, P) => [...new Set(planets.map((p) => HOUSE_THEME[P[p].house]))].slice(0, 3).join('; ');
const fmtDate = (iso) => { const [y, m, d] = iso.split('-'); return `${d}-${m}-${y}`; };

// ------------------------------------------------------------------
// Yoga detection (D1)
// ------------------------------------------------------------------
function detectYogas(k) {
  const P = k.planets;
  const yogas = [];
  const push = (nameHindi, name, type, description, descriptionEn, weight) => yogas.push({ name, nameHindi, type, description, descriptionEn, weight });
  const KENDRA = [1, 4, 7, 10];
  const TRIKONA = [1, 5, 9];
  const ordEn = (h) => ORD_EN[h];

  // Panch Mahapurush
  const PMP = { Mars: 'रुचक', Mercury: 'भद्र', Jupiter: 'हंस', Venus: 'मालव्य', Saturn: 'शश' };
  const PMP_EN = { Mars: 'Ruchaka', Mercury: 'Bhadra', Jupiter: 'Hamsa', Venus: 'Malavya', Saturn: 'Shasha' };
  const PMP_FRUIT = {
    Mars: 'साहस, भूमि-सम्पत्ति, सेनापति-तुल्य नेतृत्व और शत्रुओं पर विजय',
    Mercury: 'तीक्ष्ण बुद्धि, विद्वत्ता, वाक्-चातुर्य और व्यापार में यश',
    Jupiter: 'ज्ञान, धर्म, सम्मान, संतान-सुख और गुरु-तुल्य प्रतिष्ठा',
    Venus: 'सौन्दर्य, वाहन-सुख, कला में दक्षता और वैवाहिक आनन्द',
    Saturn: 'दीर्घायु, अधिकार, जन-नेतृत्व और स्थायी सम्पत्ति'
  };
  const PMP_FRUIT_EN = {
    Mars: 'courage, landed property, commander-like leadership and victory over rivals',
    Mercury: 'sharp intellect, scholarship, eloquence and fame in trade',
    Jupiter: 'wisdom, righteousness, honour, happiness from children and guru-like prestige',
    Venus: 'beauty, vehicles and comforts, mastery in the arts and marital joy',
    Saturn: 'long life, authority, leadership of the masses and lasting property'
  };
  Object.keys(PMP).forEach((p) => {
    if (KENDRA.includes(P[p].house) && isStrong(P[p])) {
      push(`${PMP[p]} महापुरुष योग`, `${PMP_EN[p]} Mahapurusha Yoga`, 'yoga',
        `${H(p)} ${P[p].signHindi} राशि में ${P[p].dignityHindi} होकर केन्द्र (${ORD[P[p].house]} भाव) में स्थित हैं, जिससे ${PMP[p]} महापुरुष योग बनता है; यह योग ${PMP_FRUIT[p]} प्रदान करता है।`,
        `${p} is ${DIG_EN[P[p].dignity]} in ${P[p].sign} and placed in a kendra (the ${ordEn(P[p].house)} house), forming ${PMP_EN[p]} Mahapurusha Yoga; this yoga bestows ${PMP_FRUIT_EN[p]}.`, 10);
    }
  });

  // Gajakesari
  const jupFromMoon = houseFromMoon(k, 'Jupiter');
  if (KENDRA.includes(jupFromMoon) && P.Jupiter.dignity !== 'debilitated') {
    push('गजकेसरी योग', 'Gajakesari Yoga', 'yoga',
      'गुरु चन्द्रमा से केन्द्र में स्थित हैं, जिससे गजकेसरी योग बन रहा है; यह योग यश, विद्या, धन-वैभव और समाज में स्थायी सम्मान देता है।',
      'Jupiter is in a kendra from the Moon, forming Gajakesari Yoga; this yoga grants fame, learning, wealth and lasting respect in society.', 9);
  }

  // Budhaditya
  if (P.Sun.house === P.Mercury.house && !P.Mercury.combust) {
    push('बुधादित्य योग', 'Budhaditya Yoga', 'yoga',
      `सूर्य और बुध ${ORD[P.Sun.house]} भाव में एक साथ हैं, जिससे बुधादित्य योग बनता है; यह प्रखर बुद्धि, वाक्-शक्ति और शिक्षा-प्रशासन में सफलता देता है।`,
      `Sun and Mercury are together in the ${ordEn(P.Sun.house)} house, forming Budhaditya Yoga; it gives a brilliant mind, persuasive speech and success in education and administration.`, 6);
  } else if (P.Sun.house === P.Mercury.house) {
    push('बुधादित्य योग', 'Budhaditya Yoga', 'yoga',
      `सूर्य और बुध ${ORD[P.Sun.house]} भाव में साथ होकर बुधादित्य योग बना रहे हैं; बुध के अस्त होने से इसका फल कुछ न्यून है, फिर भी बुद्धि व वाणी में प्रखरता रहेगी।`,
      `Sun and Mercury together in the ${ordEn(P.Sun.house)} house form Budhaditya Yoga; Mercury being combust softens the result, yet intellect and speech remain sharp.`, 4);
  }

  // Chandra-Mangal
  if (P.Moon.house === P.Mars.house) {
    push('चन्द्र-मंगल योग', 'Chandra-Mangal Yoga', 'yoga',
      `चन्द्र और मंगल की युति ${ORD[P.Moon.house]} भाव में है, जिससे चन्द्र-मंगल (लक्ष्मी) योग बनता है; यह अपने पुरुषार्थ से धनार्जन की क्षमता देता है।`,
      `Moon and Mars are conjunct in the ${ordEn(P.Moon.house)} house, forming Chandra-Mangal (Lakshmi) Yoga; it gives the ability to earn wealth through one's own effort.`, 6);
  }

  // Raj yoga
  const kendraLords = new Set(KENDRA.map((h) => lordOfHouse(k, h)));
  const trikonaLords = new Set(TRIKONA.map((h) => lordOfHouse(k, h)));
  let rajFound = false;
  for (const a of kendraLords) {
    for (const b of trikonaLords) {
      if (a !== b && P[a].house === P[b].house && !rajFound) {
        rajFound = true;
        push('राजयोग', 'Raja Yoga', 'yoga',
          `केन्द्रेश ${H(a)} और त्रिकोणेश ${H(b)} की युति ${ORD[P[a].house]} भाव में होने से राजयोग बन रहा है; यह उच्च पद, सम्मान और समृद्धि का सूचक है।`,
          `The kendra lord ${a} and the trikona lord ${b} are conjunct in the ${ordEn(P[a].house)} house, forming Raja Yoga; it indicates high position, honour and prosperity.`, 9);
      }
    }
  }
  const yogakaraka = [...kendraLords].find((p) => [5, 9].some((h) => lordOfHouse(k, h) === p) && [4, 7, 10].some((h) => lordOfHouse(k, h) === p));
  if (yogakaraka && !rajFound) {
    push('योगकारक ग्रह', 'Yogakaraka', 'yoga',
      `${H(yogakaraka)} आपकी कुंडली में केन्द्र और त्रिकोण दोनों के स्वामी होकर योगकारक हैं; इनकी दशा-अन्तर्दशा में विशेष उन्नति के योग बनते हैं।`,
      `${yogakaraka} owns both a kendra and a trikona in your chart and is therefore the Yogakaraka; its dasha and antardasha bring special advancement.`, 6);
  }

  // Dhana yoga
  const l2 = lordOfHouse(k, 2); const l11 = lordOfHouse(k, 11); const l1 = k.lagna.lord;
  if (P[l2].house === P[l11].house || P[l2].house === 11 || P[l11].house === 2 || (P[l1].house === P[l2].house && l1 !== l2) || (P[l1].house === P[l11].house && l1 !== l11)) {
    push('धन योग', 'Dhana Yoga', 'yoga',
      `धनेश ${H(l2)} और लाभेश ${H(l11)} का परस्पर सम्बन्ध धन योग बना रहा है; आय के स्रोत क्रमशः बढ़ते रहेंगे और धन-संचय संभव होगा।`,
      `The 2nd lord ${l2} and the 11th lord ${l11} are linked, forming Dhana Yoga; sources of income will keep growing and savings will accumulate.`, 5);
  }

  // Vipreet Raj yoga
  const DUS = [6, 8, 12];
  const vipreet = DUS.filter((h) => DUS.includes(P[lordOfHouse(k, h)].house));
  if (vipreet.length) {
    push('विपरीत राजयोग', 'Vipreet Raja Yoga', 'yoga',
      `${join(vipreet.map((h) => `${ORD[h]} भावेश ${H(lordOfHouse(k, h))}`))} त्रिक भाव में स्थित होकर विपरीत राजयोग बना रहे हैं; विपरीत परिस्थितियों से ही आपको अप्रत्याशित लाभ व उन्नति मिलती है।`,
      `The ${joinEn(vipreet.map((h) => `${ordEn(h)} lord ${lordOfHouse(k, h)}`))} placed in a dusthana ${vipreet.length > 1 ? 'form' : 'forms'} Vipreet Raja Yoga; adverse situations themselves turn into unexpected gains and progress for you.`, 5);
  }

  // Neechabhanga (one entry listing every cancelled debilitation)
  const nbHi = []; const nbEn = [];
  ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].forEach((p) => {
    if (P[p].dignity !== 'debilitated') return;
    const dispositor = SIGN_LORD[P[p].signIndex];
    const byKendra = KENDRA.includes(P[dispositor].house) || KENDRA.includes(houseFromMoon(k, dispositor));
    if (byKendra || isStrong(P[dispositor]) || P[p].navamsa.dignity === 'exalted' || P[p].navamsa.dignity === 'own') {
      const causeHi = byKendra ? `राशि-स्वामी ${H(dispositor)} केन्द्र में` : (isStrong(P[dispositor]) ? `राशि-स्वामी ${H(dispositor)} बलवान` : 'नवांश में बली');
      const causeEn = byKendra ? `dispositor ${dispositor} in a kendra` : (isStrong(P[dispositor]) ? `dispositor ${dispositor} strong` : 'strong in navamsa');
      nbHi.push(`${H(p)} (${P[p].signHindi} में नीच, ${causeHi})`);
      nbEn.push(`${p} (debilitated in ${P[p].sign}, ${causeEn})`);
    }
  });
  if (nbHi.length) {
    push('नीचभंग राजयोग', 'Neechabhanga Raja Yoga', 'yoga',
      `${join(nbHi)} की नीचता भंग होकर नीचभंग राजयोग बन रहा है; प्रारम्भिक संघर्ष के बाद ${nbHi.length > 1 ? 'ये ग्रह' : 'यह ग्रह'} असाधारण उन्नति ${nbHi.length > 1 ? 'देते हैं' : 'देता है'}।`,
      `The debilitation of ${joinEn(nbEn)} is cancelled, forming Neechabhanga Raja Yoga; after early struggle ${nbEn.length > 1 ? 'these planets give' : 'this planet gives'} extraordinary rise.`, 7);
  }

  // Adhi yoga
  const adhi = ['Mercury', 'Jupiter', 'Venus'].filter((p) => [6, 7, 8].includes(houseFromMoon(k, p)));
  if (adhi.length >= 2) {
    push('अधि योग', 'Adhi Yoga', 'yoga',
      `चन्द्रमा से षष्ठ, सप्तम, अष्टम में ${join(adhi.map(H))} जैसे शुभ ग्रह होने से अधि योग बनता है; यह नेतृत्व, वैभव और दीर्घ आयु का शुभ योग है।`,
      `Benefics ${joinEn(adhi)} in the 6th, 7th and 8th from the Moon form Adhi Yoga; an auspicious yoga for leadership, affluence and long life.`, 5);
  }

  // Amala yoga
  const amala = NATURAL_BENEFICS.filter((p) => p !== 'Moon' && (P[p].house === 10 || houseFromMoon(k, p) === 10));
  if (amala.length) {
    push('अमला योग', 'Amala Yoga', 'yoga',
      `दशम भाव में ${join(amala.map(H))} जैसे शुभ ग्रह होने से अमला योग बनता है; कर्म-क्षेत्र में निष्कलंक यश और स्थायी प्रतिष्ठा मिलती है।`,
      `Benefic ${joinEn(amala)} in the 10th house forms Amala Yoga; it brings spotless reputation and lasting prestige in one's profession.`, 4);
  }

  // ---- Doshas ----
  const MD = [1, 2, 4, 7, 8, 12];
  const mdLagna = MD.includes(P.Mars.house);
  const mdMoon = MD.includes(houseFromMoon(k, 'Mars'));
  if (mdLagna || mdMoon) {
    const cancelled = isStrong(P.Mars) || (P.Mars.house === P.Jupiter.house) || (['Cancer', 'Leo'].includes(P.Mars.sign) && P.Mars.house === 1);
    const full = mdLagna && mdMoon;
    push('मंगल दोष', 'Mangal Dosha', 'dosha',
      `मंगल ${mdLagna ? `लग्न से ${ORD[P.Mars.house]}` : `चन्द्र से ${ORD[houseFromMoon(k, 'Mars')]}`} भाव में होने से ${full ? 'पूर्ण' : 'आंशिक'} मंगल दोष है${cancelled ? ', किन्तु मंगल के बलवान/शुभ-दृष्ट होने से यह दोष प्रायः परिहृत (क्षीण) हो जाता है' : '; विवाह में कुंडली-मिलान के समय इस पर विशेष विचार आवश्यक है'}।`,
      `Mars in the ${mdLagna ? `${ordEn(P.Mars.house)} house from the lagna` : `${ordEn(houseFromMoon(k, 'Mars'))} house from the Moon`} creates ${full ? 'full' : 'partial'} Mangal Dosha${cancelled ? ', but since Mars is strong or well aspected the dosha is largely cancelled' : '; it must be weighed carefully during horoscope matching for marriage'}.`,
      cancelled ? 3 : 7);
  }

  const rahu = P.Rahu.longitude; const ketu = P.Ketu.longitude;
  const inArc = (x, a, b) => ((x - a + 360) % 360) < ((b - a + 360) % 360);
  const seven = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const allRK = seven.every((p) => inArc(P[p].longitude, rahu, ketu));
  const allKR = seven.every((p) => inArc(P[p].longitude, ketu, rahu));
  if (allRK || allKR) {
    push('कालसर्प योग', 'Kaal Sarp Yoga', 'dosha',
      'सभी ग्रह राहु-केतु के एक ओर स्थित होने से कालसर्प योग बनता है; इससे प्रयासों में विलम्ब व उतार-चढ़ाव आते हैं, परन्तु यही योग दृढ़ संकल्प से असाधारण ऊँचाई भी दिलाता है। राहु-केतु की शान्ति एवं शिव-आराधना श्रेयस्कर है।',
      'All planets lie on one side of the Rahu-Ketu axis, forming Kaal Sarp Yoga; it brings delays and ups and downs in efforts, yet with firm resolve the same yoga lifts one to remarkable heights. Propitiation of Rahu-Ketu and worship of Lord Shiva are advised.', 7);
  }

  const around = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].filter((p) => [2, 12].includes(houseFromMoon(k, p)));
  const withMoon = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].filter((p) => houseFromMoon(k, p) === 1);
  const kendraMoon = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Sun'].filter((p) => KENDRA.includes(houseFromMoon(k, p)));
  if (!around.length && !withMoon.length) {
    const cancelled = kendraMoon.length > 0 || KENDRA.includes(P.Moon.house);
    push('केमद्रुम योग', 'Kemadruma Yoga', 'dosha',
      `चन्द्रमा के दोनों ओर कोई ग्रह न होने से केमद्रुम योग बनता है${cancelled ? ', किन्तु केन्द्र में ग्रह होने से यह भंग हो जाता है और मानसिक स्थिरता बनी रहती है' : '; मन में कभी-कभी अकेलापन व अस्थिरता अनुभव हो सकती है, अतः चन्द्र-शान्ति व नियमित ध्यान लाभकारी है'}।`,
      `No planet flanks the Moon, forming Kemadruma Yoga${cancelled ? ', but planets in kendra cancel it and mental stability is preserved' : '; occasional loneliness or restlessness may be felt, so Moon propitiation and regular meditation help'}.`,
      cancelled ? 2 : 5);
  }

  yogas.sort((a, b) => b.weight - a.weight);
  return yogas;
}

// ------------------------------------------------------------------
// Section builders
// ------------------------------------------------------------------
function lagnaSection(k) {
  const L = k.lagna;
  const le = k.planets[L.lord];
  let t = `आपकी जन्मकुंडली का लग्न ${L.signHindi} है, जिसके स्वामी ${H(L.lord)} ${ORD[le.house]} भाव (${HOUSE_NAME[le.house]}) में ${le.signHindi} राशि में ${le.dignityHindi} अवस्था में स्थित हैं। `;
  t += LAGNA_TRAITS[L.sign] + ' ';
  t += LAGNESH_IN_HOUSE[le.house];
  if (isStrong(le)) t += ' लग्नेश की यह बलवान स्थिति स्वास्थ्य, आत्मविश्वास और भाग्य को दृढ़ता प्रदान करती है।';
  else if (le.dignity === 'debilitated') t += ' लग्नेश का नीच होना स्वास्थ्य व आत्मविश्वास के प्रति सजग रहने का संकेत है; इसकी नवांश स्थिति से ही अन्तिम बल का निर्णय होगा।';
  if (le.combust) t += ' लग्नेश सूर्य के निकट अस्त होने से अपने फल कुछ विलम्ब से देंगे।';
  if (le.retrograde && !['Rahu', 'Ketu'].includes(L.lord)) t += ' लग्नेश वक्री होने से आप बातों को गहराई से सोचकर, कुछ अलग ढंग से कार्य करते हैं।';
  return { key: 'lagna', title: 'लग्न एवं व्यक्तित्व', text: say(t) };
}

function chandraSection(k) {
  const M = k.planets.Moon;
  const n = k.nakshatra;
  const elong = (M.longitude - k.planets.Sun.longitude + 360) % 360;
  const paksha = elong < 180 ? 'शुक्ल' : 'कृष्ण';
  const pakshaBala = elong >= 72 && elong <= 288;
  let t = `आपकी चन्द्र राशि ${M.signHindi} और जन्म नक्षत्र ${n.nameHindi} (${n.pada} चरण) है, जिसके स्वामी ${n.lordHindi} हैं; चन्द्रमा ${ORD[M.house]} भाव में ${M.dignityHindi} अवस्था में हैं। `;
  t += MOON_SIGN_MIND[M.sign] + ' ';
  t += NAK_TRAIT[n.name] + ' ';
  t += `जन्म ${paksha} पक्ष में हुआ है, अतः चन्द्रमा ${pakshaBala ? 'पक्ष-बल से युक्त है और मन की स्थिरता, स्मरणशक्ति व लोकप्रियता को पुष्ट करता है' : 'पक्ष-बल में कुछ न्यून है; मन को स्थिर रखने हेतु ध्यान व शिव-आराधना विशेष उपयोगी रहेगी'}।`;
  if (M.house === 1 || M.house === 4 || M.house === 7 || M.house === 10) t += ' चन्द्रमा केन्द्र में होने से जन-सम्पर्क और सामाजिक प्रभाव बढ़ता है।';
  return { key: 'chandra', title: 'चन्द्र राशि एवं नक्षत्र', text: say(t) };
}

function grahaYogaSection(k, yogas) {
  const P = k.planets;
  const seven = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const strong = seven.filter((p) => isStrong(P[p]));
  const weak = seven.filter((p) => isWeak(P[p]));
  let t = '';
  if (strong.length) {
    t += `कुंडली में ${join(strong.map((p) => `${H(p)} ${P[p].signHindi} में ${P[p].dignityHindi} होकर ${ORD[P[p].house]} भाव में`))} स्थित हैं, जो ${themes(strong, P)} के क्षेत्र में विशेष बल प्रदान करते हैं। `;
  } else {
    t += 'कुंडली में कोई ग्रह उच्च या स्वराशि का नहीं है, अतः फल-प्राप्ति मुख्यतः दशा और नवांश-बल पर निर्भर करेगी। ';
  }
  if (weak.length) {
    t += `${join(weak.map((p) => `${H(p)} (${P[p].dignity === 'debilitated' ? 'नीच' : 'अस्त'})`))} की स्थिति कुछ कमज़ोर है, जिससे ${themes(weak, P)} के विषयों में प्रयास अधिक करने पड़ सकते हैं। `;
  }
  const top = yogas.slice(0, 4);
  if (top.length) {
    t += top.map((y) => y.description).join(' ');
  } else {
    t += 'कोई विशेष राजयोग या दोष प्रबल रूप से नहीं बन रहा है; ग्रहों का संतुलन सामान्य है और परिश्रम का फल क्रमशः प्राप्त होगा।';
  }
  return { key: 'graha_yoga', title: 'ग्रह स्थिति एवं योग', text: say(t.trim()) };
}

function navamsaSection(k, gender) {
  const P = k.planets;
  const N = k.navamsa;
  const L = k.lagna;
  const le = P[L.lord];
  const seven = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

  let t = `नवांश कुंडली (D9) में लग्न ${N.lagna.signHindi} है, जिसके स्वामी ${H(N.lagna.lord)} हैं`;
  t += N.lagna.vargottama ? '; जन्म लग्न और नवांश लग्न एक ही राशि होने से लग्न वर्गोत्तम है, जो व्यक्तित्व और भाग्य को असाधारण दृढ़ता देता है। ' : '। ';

  // Lagnesh in D9
  t += `जन्म-लग्नेश ${H(L.lord)} नवांश में ${le.navamsa.signHindi} राशि में ${le.navamsa.dignityHindi} अवस्था में हैं, अतः `;
  if (le.navamsa.dignity === 'exalted' || le.navamsa.dignity === 'own') t += 'जन्मकुंडली के शुभ फल जीवन के उत्तरार्ध में और भी पुष्ट होंगे। ';
  else if (le.navamsa.dignity === 'debilitated') t += 'बाह्य सफलता के साथ आन्तरिक संतोष हेतु सचेत प्रयास करने होंगे; लग्नेश का उपाय लाभकारी रहेगा। ';
  else t += 'जीवन की दिशा स्थिर रहेगी और परिश्रम का फल यथासमय मिलता रहेगा। ';

  // Vargottama planets
  const varg = seven.filter((p) => P[p].navamsa.vargottama);
  if (varg.length) t += `${join(varg.map(H))} वर्गोत्तम ${varg.length > 1 ? 'हैं' : 'है'}, अर्थात जन्म और नवांश दोनों में एक ही राशि में; ${varg.length > 1 ? 'ये ग्रह अपने' : 'यह ग्रह अपना'} फल पूर्ण दृढ़ता से ${varg.length > 1 ? 'देंगे' : 'देगा'}। `;

  // D9 exalted / debilitated
  const d9Strong = seven.filter((p) => !P[p].navamsa.vargottama && (P[p].navamsa.dignity === 'exalted' || P[p].navamsa.dignity === 'own'));
  const d9Weak = seven.filter((p) => P[p].navamsa.dignity === 'debilitated');
  if (d9Strong.length) t += `नवांश में ${join(d9Strong.map((p) => `${H(p)} ${P[p].navamsa.signHindi} में ${P[p].navamsa.dignityHindi}`))} होकर अपने कारकत्व को सुदृढ़ कर रहे हैं${d9Strong.some((p) => P[p].dignity === 'debilitated') ? ', जिससे जन्मकुंडली की नीचता का दोष बहुत सीमा तक दूर हो जाता है' : ''}। `;
  if (d9Weak.length) t += `नवांश में ${join(d9Weak.map(H))} नीच ${d9Weak.length > 1 ? 'हैं' : 'है'}, अतः ${themes(d9Weak, P)} के फल जन्मकुंडली के संकेत से कुछ न्यून रहेंगे। `;

  // Marriage from D9
  const l7 = lordOfHouse(k, 7);
  const karaka = gender === 'female' ? 'Jupiter' : 'Venus';
  const d9SeventhPlanets = N.houses[6].planets;
  const malefics7 = d9SeventhPlanets.filter((p) => ['Mars', 'Saturn', 'Rahu', 'Ketu', 'Sun'].includes(p));
  const benefics7 = d9SeventhPlanets.filter((p) => ['Jupiter', 'Venus', 'Mercury', 'Moon'].includes(p));
  let mScore = 0;
  const dscore = (d) => ({ exalted: 2, own: 2, friend: 1, neutral: 0, enemy: -1, debilitated: -2 }[d] || 0);
  mScore += dscore(P[l7].navamsa.dignity) + dscore(P[karaka].navamsa.dignity) + benefics7.length - malefics7.length;
  const karakaLabel = gender === 'female' ? 'पति-कारक गुरु' : 'पत्नी-कारक शुक्र';
  if (l7 === karaka) {
    t += `विवाह-सुख के लिए नवांश में सप्तमेश एवं ${karakaLabel} ${P[l7].navamsa.signHindi} राशि में ${P[l7].navamsa.dignityHindi} हैं`;
  } else {
    t += `विवाह-सुख के लिए नवांश में सप्तमेश ${H(l7)} ${P[l7].navamsa.signHindi} राशि में ${P[l7].navamsa.dignityHindi} तथा ${karakaLabel} ${P[karaka].navamsa.signHindi} राशि में ${P[karaka].navamsa.dignityHindi} हैं`;
  }
  if (d9SeventhPlanets.length) t += `; नवांश के सप्तम भाव में ${join(d9SeventhPlanets.map(H))} स्थित ${d9SeventhPlanets.length > 1 ? 'हैं' : 'है'}`;
  t += '। ';
  if (mScore >= 2) t += 'ये संकेत दाम्पत्य जीवन में सामंजस्य, जीवनसाथी से सहयोग और सुखद गृहस्थी के हैं। ';
  else if (mScore >= 0) t += 'दाम्पत्य जीवन सामान्यतः संतोषजनक रहेगा; परस्पर संवाद और धैर्य से सम्बन्ध मधुर बने रहेंगे। ';
  else t += 'दाम्पत्य में मतभेद की सम्भावना है, अतः विवाह-निर्णय कुंडली-मिलान व शुभ मुहूर्त में ही करें और सप्तमेश का उपाय करें। ';

  // Karakamsa
  t += `आत्मकारक ${k.atmakaraka.planetHindi} का नवांश ${k.atmakaraka.karakamsaHindi} राशि में (कारकांश) है — ${KARAKAMSA_THEME[k.atmakaraka.karakamsa]}`;
  return { key: 'navamsa', title: 'नवांश कुण्डली (D9) फल', text: say(t.trim()) };
}

function dashaSection(k) {
  const D = k.dasha.current;
  const P = k.planets;
  const md = P[D.mahadasha.lord];
  const ad = P[D.antardasha.lord];
  let t = `वर्तमान में आप ${D.mahadasha.lordHindi} की महादशा (${fmtDate(D.mahadasha.start)} से ${fmtDate(D.mahadasha.end)}) में ${D.antardasha.lordHindi} की अन्तर्दशा (${fmtDate(D.antardasha.start)} से ${fmtDate(D.antardasha.end)}) से गुज़र रहे हैं। `;
  t += DASHA_LORD_EFFECT[D.mahadasha.lord] + ' ';
  t += `दशानाथ ${H(D.mahadasha.lord)} आपकी कुंडली में ${ORD[md.house]} भाव में ${md.dignityHindi} अवस्था में हैं`;
  if (md.strength >= 70) t += `, अतः यह दशा आपके लिए उन्नतिकारक है, विशेषकर ${HOUSE_THEME[md.house]} के क्षेत्र में शुभ परिणाम मिलेंगे। `;
  else if (md.strength >= 50) t += `, अतः यह दशा मिश्रित फलदायी है; ${HOUSE_THEME[md.house]} के विषयों में परिश्रम का फल क्रमशः मिलेगा। `;
  else t += `, अतः इस दशा में ${HOUSE_THEME[md.house]} से जुड़े मामलों में धैर्य व सावधानी अपेक्षित है; दशानाथ के उपाय से लाभ होगा। `;
  if (D.mahadasha.lord !== D.antardasha.lord) {
    const relation = md.house === ad.house ? 'दशानाथ के साथ ही स्थित हैं' : `${ORD[ad.house]} भाव में ${ad.dignityHindi} हैं`;
    t += `अन्तर्दशानाथ ${H(D.antardasha.lord)} ${relation}, जिससे इस अवधि में ${HOUSE_THEME[ad.house]} के विषय ${ad.strength >= 60 ? 'विशेष रूप से अनुकूल' : 'ध्यान देने योग्य'} रहेंगे। `;
  }
  if (D.upcomingAntardashas.length) {
    t += `इसके पश्चात ${D.upcomingAntardashas[0].lordHindi} की अन्तर्दशा (${fmtDate(D.upcomingAntardashas[0].start)} से) आरम्भ होगी।`;
  }
  return { key: 'dasha', title: 'दशा फल', text: say(t.trim()) };
}

function chooseRemedyPlanet(k) {
  const P = k.planets;
  const seven = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const deb = seven.find((p) => P[p].dignity === 'debilitated' && P[p].navamsa.dignity !== 'exalted');
  if (deb) return { planet: deb, reason: 'नीच राशि में' };
  const md = k.dasha.current.mahadasha.lord;
  if (P[md].strength < 55) return { planet: md, reason: `दशानाथ होकर भी ${P[md].dignityHindi} में` };
  if (P[k.lagna.lord].strength < 55) return { planet: k.lagna.lord, reason: `लग्नेश होकर ${P[k.lagna.lord].dignityHindi} में` };
  const comb = seven.find((p) => P[p].combust);
  if (comb) return { planet: comb, reason: 'अस्त अवस्था में' };
  return { planet: md, reason: 'वर्तमान दशानाथ के रूप में' };
}

function upaySection(k) {
  const { planet, reason } = chooseRemedyPlanet(k);
  const r = REMEDY[planet];
  const isLord = planet === k.dasha.current.mahadasha.lord;
  let t = `आपकी कुंडली में ${H(planet)} ${reason} ${isLord && !reason.includes('दशानाथ') ? 'और वर्तमान दशानाथ भी ' : ''}हैं, अतः ${H(planet)} की शान्ति एवं बल-वृद्धि सर्वप्रथम करणीय है। `;
  t += `${r.day} को ${r.mantra} मन्त्र का 108 बार जप, ${r.dana} का दान तथा ${r.extra} विशेष लाभकारी रहेगा। `;
  const yogaDosha = detectYogas(k).find((y) => y.type === 'dosha' && y.weight >= 5);
  if (yogaDosha) t += `${yogaDosha.nameHindi} की शान्ति हेतु योग्य आचार्य से विधिवत पूजन कराना श्रेयस्कर है। `;
  t += 'कोई भी रत्न धारण करने से पूर्व कुंडली दिखाकर ही निर्णय लें; नियमित इष्ट-आराधना, माता-पिता की सेवा और सत्कर्म ही सबसे बड़ा उपाय है।';
  return { key: 'upay', title: 'उपाय', text: say(t) };
}

function shortSummary(k, yogas, name) {
  const P = k.planets;
  const D = k.dasha.current;
  const md = P[D.mahadasha.lord];
  const who = name ? `${String(name).trim()} जी, ` : '';
  let t = `${who}आपका लग्न ${k.lagna.signHindi}, चन्द्र राशि ${k.rashi.signHindi} एवं जन्म नक्षत्र ${k.nakshatra.nameHindi} (${k.nakshatra.pada} चरण) है। `;
  const seven = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const strong = seven.filter((p) => isStrong(P[p]));
  if (yogas.length && yogas[0].type === 'yoga') t += `कुंडली में ${yogas[0].nameHindi} बन रहा है, जो ${strong.length ? `${join(strong.map(H))} के बल से ` : ''}आपको ${yogas[0].name.includes('Dhana') ? 'धन-समृद्धि' : 'सम्मान और उन्नति'} दिलाएगा। `;
  else if (strong.length) t += `${join(strong.map(H))} बलवान होकर ${themes(strong, P)} को पुष्ट करते हैं। `;
  else t += 'ग्रहों का संतुलन सामान्य है और परिश्रम से क्रमशः उन्नति के योग हैं। ';
  const dosha = yogas.find((y) => y.type === 'dosha' && y.weight >= 5);
  if (dosha) t += `${dosha.nameHindi} के कारण कुछ विषयों में सावधानी व उपाय अपेक्षित है। `;
  const varg = seven.filter((p) => P[p].navamsa.vargottama);
  t += `नवांश लग्न ${k.navamsa.lagna.signHindi} है${varg.length ? ` और ${join(varg.map(H))} वर्गोत्तम होकर अपने फल दृढ़ता से देंगे` : `; लग्नेश ${H(k.lagna.lord)} नवांश में ${P[k.lagna.lord].navamsa.dignityHindi} में हैं`}। `;
  t += `वर्तमान ${D.mahadasha.lordHindi}-${D.antardasha.lordHindi} दशा ${md.strength >= 70 ? 'उन्नतिकारक' : md.strength >= 50 ? 'मिश्रित फल देने वाली' : 'धैर्य की परीक्षा लेने वाली'} है`;
  t += `, विशेषकर ${HOUSE_THEME[md.house]} के क्षेत्र में। `;
  const rem = chooseRemedyPlanet(k);
  t += `${H(rem.planet)} का उपाय — ${REMEDY[rem.planet].day} को ${REMEDY[rem.planet].mantra} का जप — आपके लिए विशेष हितकारी रहेगा।`;
  return say(t);
}

// ------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------
/**
 * @param {object} input same as computeKundli input + { name, gender }
 * @returns {object} { prefix, shortSummary, sections, fullText, yogas, grahaSthiti, navamsaSthiti, kundli }
 */
function generateKundliPhal(input) {
  const kundli = computeKundli(input);
  const gender = String(input.gender || '').toLowerCase();
  const yogas = detectYogas(kundli);

  const sections = [
    lagnaSection(kundli),
    chandraSection(kundli),
    grahaYogaSection(kundli, yogas),
    navamsaSection(kundli, gender),
    dashaSection(kundli),
    upaySection(kundli)
  ];

  const grahaSthiti = Object.values(kundli.planets).map((p) => ({
    graha: p.nameHindi,
    planet: p.name,
    rashi: p.signHindi,
    sign: p.sign,
    ansh: p.degreeFormatted,
    bhav: p.house,
    nakshatra: `${p.nakshatra.nameHindi} (${p.nakshatra.pada})`,
    avastha: p.dignityHindi + (p.retrograde && !['Rahu', 'Ketu'].includes(p.name) ? ', वक्री' : '') + (p.combust ? ', अस्त' : ''),
    navamsaRashi: p.navamsa.signHindi,
    vargottama: p.navamsa.vargottama
  }));

  const { buildEnglishPhal } = require('./kundliPhalEn');
  const english = buildEnglishPhal(kundli, yogas, chooseRemedyPlanet(kundli), { name: input.name, gender });

  return {
    language: 'hi',
    prefix: PREFIX,
    shortSummary: shortSummary(kundli, yogas, input.name),
    sections,
    fullText: sections.map((s) => `【${s.title}】\n${s.text}`).join('\n\n'),
    yogas: yogas.map(({ weight, ...y }) => y),
    grahaSthiti,
    english: { language: 'en', ...english },
    kundli
  };
}

module.exports = { generateKundliPhal, detectYogas, chooseRemedyPlanet, PREFIX, HOUSE_THEME, ORD_EN, DIG_EN, joinEn, isStrong, isWeak, houseFromMoon, lordOfHouse };
