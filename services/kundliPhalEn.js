'use strict';

/**
 * Kundli Phal – English edition
 * ------------------------------------------------------------------
 * Same six sections as the Hindi reading (services/kundliPhal.js), written
 * in an astrologer's voice in English. Every section and the short summary
 * begins with the English rendering of the Samhita line:
 *
 *   "In the Jyotish Vishwakosh Samhita, Pt. Avadh Naresh Ji says that"
 */

const { SIGN_LORD } = require('./kundliEngine');

const PREFIX_EN = 'In the Jyotish Vishwakosh Samhita, Pt. Avadh Naresh Ji says that';
const say = (text) => `${PREFIX_EN} ${text}`;

const ORD = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th', 6: '6th', 7: '7th', 8: '8th', 9: '9th', 10: '10th', 11: '11th', 12: '12th' };
const DIG = { exalted: 'exalted', own: 'in its own sign', friend: 'in a friendly sign', neutral: 'in a neutral sign', enemy: 'in an inimical sign', debilitated: 'debilitated' };
const DIG_SHORT = { exalted: 'exalted', own: 'own sign', friend: 'friendly sign', neutral: 'neutral sign', enemy: 'inimical sign', debilitated: 'debilitated' };

const HOUSE_NAME = {
  1: 'Lagna (self)', 2: 'wealth', 3: 'courage', 4: 'happiness', 5: 'children and learning', 6: 'enemies and illness',
  7: 'marriage and partner', 8: 'longevity', 9: 'fortune and dharma', 10: 'career', 11: 'gains', 12: 'expenses and liberation'
};
const HOUSE_THEME = {
  1: 'health, personality and self-confidence', 2: 'wealth, speech and family', 3: 'courage, siblings and short journeys',
  4: 'mother, home comforts, vehicles and property', 5: 'children, education, intellect and romance', 6: 'illness, debts, rivals and competition',
  7: 'marriage, spouse and partnerships', 8: 'longevity, occult knowledge and sudden changes', 9: 'fortune, dharma, teachers and long journeys',
  10: 'career, status and public honour', 11: 'income, gains, friends and fulfilment of wishes', 12: 'expenses, foreign lands, rest and liberation'
};

const LAGNA_TRAITS = {
  Aries: 'Aries-born natives are courageous, dynamic and born leaders; they decide quickly and lead from the front, though temper and haste need restraint.',
  Taurus: 'Taurus-born natives are patient, beauty-loving and steady of mind; they have a natural inclination for accumulating wealth, the arts and life\'s comforts.',
  Gemini: 'Gemini-born natives are intelligent, articulate and versatile; writing, communication, trade and technology bring them special success.',
  Cancer: 'Cancer-born natives are emotional, sensitive and family-oriented; imagination and memory are strong, and steadiness of mind is the key to their rise.',
  Leo: 'Leo-born natives are self-respecting, generous and regal by nature; authority, honour and leadership attract them naturally.',
  Virgo: 'Virgo-born natives are analytical, tactful and hard-working; accounts, medicine, research and service reward their eye for detail.',
  Libra: 'Libra-born natives are fair-minded, gentle and sociable; balance is their hallmark, and the arts, trade and partnerships bring gains.',
  Scorpio: 'Scorpio-born natives are deep, private and resolute; they possess remarkable endurance and a researcher\'s instinct, and do not waver in a crisis.',
  Sagittarius: 'Sagittarius-born natives are righteous, optimistic and outspoken; education, philosophy, law and counselling suit them especially well.',
  Capricorn: 'Capricorn-born natives are industrious, disciplined and ambitious; rising slowly but surely to great heights is their nature.',
  Aquarius: 'Aquarius-born natives are thoughtful, humanitarian and original thinkers; new ideas, science and social service hold their interest.',
  Pisces: 'Pisces-born natives are compassionate, imaginative and spiritually inclined; the arts, spirituality, healing and charity give them fulfilment.'
};

const LAGNESH_IN_HOUSE = {
  1: 'The lagna lord placed in the lagna itself grants good health, inner strength and the capacity for independent decisions.',
  2: 'The lagna lord in the 2nd house lets the native build wealth through personal effort and enjoy family happiness; speech is influential.',
  3: 'The lagna lord in the 3rd house makes the native bold, enterprising and affectionate towards siblings.',
  4: 'The lagna lord in the 4th house gives the mother\'s blessings, land, vehicles and domestic comfort; the mind stays calm and settled.',
  5: 'The lagna lord in the 5th house bestows learning, intellect and happiness from children; the native is fortunate and artistic.',
  6: 'The lagna lord in the 6th house lets the native prevail in competition and over rivals, but health and debts call for vigilance.',
  7: 'The lagna lord in the 7th house makes marriage and partnership central to life; the spouse brings notable gains.',
  8: 'The lagna lord in the 8th house gives interest in occult subjects and longevity, but sudden ups and downs call for caution.',
  9: 'The lagna lord in the 9th house is highly auspicious; the native is fortunate, righteous and blessed by elders and teachers.',
  10: 'The lagna lord in the 10th house makes a karma-yogi; there are strong indications of public honour, position and professional rise.',
  11: 'The lagna lord in the 11th house brings many sources of income, support of friends and fulfilment of desires.',
  12: 'The lagna lord in the 12th house gives foreign connections, spirituality and a giving nature; controlling expenses ensures progress.'
};

const MOON_SIGN_MIND = {
  Aries: 'An Aries Moon makes the mind enthusiastic, fearless and quick to act; you express feelings promptly.',
  Taurus: 'A Taurus Moon makes the mind steady, tolerant and comfort-loving; you are loyal in relationships.',
  Gemini: 'A Gemini Moon makes the mind restless, curious and communicative; you learn new things quickly.',
  Cancer: 'A Cancer Moon sits in its own sign, so the mind is emotional, nurturing and imaginative; family is your strength.',
  Leo: 'A Leo Moon makes the mind proud, generous and ambitious; honour matters greatly to you.',
  Virgo: 'A Virgo Moon makes the mind practical, analytical and service-minded; you go to the depth of everything.',
  Libra: 'A Libra Moon makes the mind balanced, aesthetic and sociable; you favour harmony and reconciliation.',
  Scorpio: 'A Scorpio Moon makes the mind deep, intense and determined; you do not reveal your feelings easily.',
  Sagittarius: 'A Sagittarius Moon makes the mind optimistic, righteous and candid; the pursuit of knowledge delights you.',
  Capricorn: 'A Capricorn Moon makes the mind serious, disciplined and goal-focused; you carry responsibility well.',
  Aquarius: 'An Aquarius Moon makes the mind independent, thoughtful and humanitarian; you think beyond convention.',
  Pisces: 'A Pisces Moon makes the mind compassionate, imaginative and spiritual; your intuition is strong.'
};

const NAK_TRAIT = {
  Ashwini: 'Ashwini nakshatra gives speed, healing skill and the energy of fresh beginnings.',
  Bharani: 'Bharani nakshatra gives endurance, responsibility and powerful creative force.',
  Krittika: 'Krittika nakshatra gives brilliance, candour and intolerance of injustice.',
  Rohini: 'Rohini nakshatra bestows beauty, charm, artistry and material prosperity.',
  Mrigashira: 'Mrigashira nakshatra gives curiosity, a seeking nature and sweet speech.',
  Ardra: 'Ardra nakshatra gives a keen intellect, adaptability and the strength to learn from intense experiences.',
  Punarvasu: 'Punarvasu nakshatra gives renewal, optimism and the ability to recover from any setback.',
  Pushya: 'Pushya nakshatra is the finest star of nourishment, dharma, service and lasting prosperity.',
  Ashlesha: 'Ashlesha nakshatra gives deep insight, knowledge of secrets and a hypnotic personality.',
  Magha: 'Magha nakshatra gives ancestral blessings, a regal bearing and respect for tradition.',
  'Purva Phalguni': 'Purva Phalguni nakshatra gives joy, art, love and social charm.',
  'Uttara Phalguni': 'Uttara Phalguni nakshatra gives generosity, benevolence and the capacity for lasting bonds.',
  Hasta: 'Hasta nakshatra gives manual skill, cleverness and mastery in work.',
  Chitra: 'Chitra nakshatra gives creativity, artistic vision and an attractive personality.',
  Swati: 'Swati nakshatra gives independence, business acumen and flexibility.',
  Vishakha: 'Vishakha nakshatra gives determination towards goals, ambition and the will to win.',
  Anuradha: 'Anuradha nakshatra gives friendship, devotion, organising ability and gains from abroad.',
  Jyeshtha: 'Jyeshtha nakshatra gives a protective nature, authority and competence in hidden matters.',
  Mula: 'Mula nakshatra gives a root-seeking, investigative nature, philosophy and transformative power.',
  'Purva Ashadha': 'Purva Ashadha nakshatra gives invincible confidence, inspiring speech and zeal.',
  'Uttara Ashadha': 'Uttara Ashadha nakshatra gives righteousness, leadership and the blessing of final victory.',
  Shravana: 'Shravana nakshatra gives learning through listening, scholarship, fame and immense capacity to learn.',
  Dhanishta: 'Dhanishta nakshatra gives music, wealth, rhythm and success in collective ventures.',
  Shatabhisha: 'Shatabhisha nakshatra gives healing, knowledge of mysteries, love of solitude and original thought.',
  'Purva Bhadrapada': 'Purva Bhadrapada nakshatra gives austerity, sharp intellect and a longing for both the spiritual and the material.',
  'Uttara Bhadrapada': 'Uttara Bhadrapada nakshatra gives gravity, compassion, patience and profound wisdom.',
  Revati: 'Revati nakshatra gives nurturing, pleasant travel, gentleness and a nature that benefits all.'
};

const KARAKAMSA_THEME = {
  Aries: 'the soul inclines towards courage, protective work, land and leadership.',
  Taurus: 'the soul inclines towards wealth, the arts, beauty and the creation of comforts.',
  Gemini: 'the soul inclines towards writing, communication, trade and intellectual work.',
  Cancer: 'the soul inclines towards nurturing, water-related work, public service and family.',
  Leo: 'the soul inclines towards authority, administration, politics and leadership.',
  Virgo: 'the soul inclines towards medicine, accounts, service and fine analysis.',
  Libra: 'the soul inclines towards trade, justice, the arts and social relationships.',
  Scorpio: 'the soul inclines towards research, occult sciences, healing and deep sadhana.',
  Sagittarius: 'the soul inclines towards education, dharma, law and guidance.',
  Capricorn: 'the soul inclines towards organisation, administration, industry and long-term building.',
  Aquarius: 'the soul inclines towards social service, science, innovation and collective welfare.',
  Pisces: 'the soul inclines towards spirituality, compassion, the arts and the path of liberation.'
};

const DASHA_LORD_EFFECT = {
  Sun: 'The Sun\'s dasha activates matters of self-confidence, father, government contacts and status.',
  Moon: 'The Moon\'s dasha brings mind, mother, public dealings, travel and emotional matters to the fore.',
  Mars: 'Mars\'s dasha energises courage, land and property, siblings and vigorous action.',
  Mercury: 'Mercury\'s dasha brings out intellect, education, trade, writing and communication.',
  Jupiter: 'Jupiter\'s dasha is a period of wisdom, dharma, children, growth of wealth and the grace of teachers.',
  Venus: 'Venus\'s dasha is a period of comforts, marriage, love, the arts and material prosperity.',
  Saturn: 'Saturn\'s dasha tests one through work, discipline, perseverance and long-term stability.',
  Rahu: 'Rahu\'s dasha intensifies sudden change, foreign connections, technology and ambition.',
  Ketu: 'Ketu\'s dasha is a period of detachment, introspection, esoteric knowledge and unexpected events.'
};

const REMEDY = {
  Sun: { day: 'Sunday', mantra: '"Om Ghrini Suryaya Namah"', dana: 'wheat, jaggery and copper', extra: 'offering water to the rising Sun and honouring your father' },
  Moon: { day: 'Monday', mantra: '"Om Som Somaya Namah"', dana: 'rice, milk and white cloth', extra: 'worship of Lord Shiva and service to your mother' },
  Mars: { day: 'Tuesday', mantra: '"Om Am Angarakaya Namah"', dana: 'red lentils, red cloth and jaggery', extra: 'recitation of the Hanuman Chalisa' },
  Mercury: { day: 'Wednesday', mantra: '"Om Bum Budhaya Namah"', dana: 'green moong and green cloth', extra: 'worship of Lord Ganesha and care of cows' },
  Jupiter: { day: 'Thursday', mantra: '"Om Brim Brihaspataye Namah"', dana: 'chana dal, turmeric and yellow cloth', extra: 'service to teachers and elders and worship of Lord Vishnu' },
  Venus: { day: 'Friday', mantra: '"Om Shum Shukraya Namah"', dana: 'curd, rice and white cloth', extra: 'worship of Goddess Lakshmi and personal cleanliness' },
  Saturn: { day: 'Saturday', mantra: '"Om Sham Shanaishcharaya Namah"', dana: 'black sesame, urad, iron and mustard oil', extra: 'worship of Lord Hanuman and help to labourers' },
  Rahu: { day: 'Saturday', mantra: '"Om Ram Rahave Namah"', dana: 'blue cloth, coconut and urad', extra: 'recitation of the Durga Saptashati' },
  Ketu: { day: 'Tuesday', mantra: '"Om Kem Ketave Namah"', dana: 'sesame, a blanket and multi-coloured cloth', extra: 'worship of Lord Ganesha and feeding dogs' }
};

const REASON_EN = {
  'नीच राशि में': 'is debilitated',
  'अस्त अवस्था में': 'is combust',
  'वर्तमान दशानाथ के रूप में': 'rules the current dasha'
};

// helpers
const isStrong = (pl) => pl.dignity === 'exalted' || pl.dignity === 'own';
const isWeak = (pl) => pl.dignity === 'debilitated' || pl.combust;
const lordOfHouse = (k, h) => k.houses[h - 1].lord;
const join = (arr) => arr.length <= 1 ? arr.join('') : `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`;
const themes = (planets, P) => [...new Set(planets.map((p) => HOUSE_THEME[P[p].house]))].slice(0, 3).join('; ');
const fmtDate = (iso) => { const [y, m, d] = iso.split('-'); return `${d}-${m}-${y}`; };
const plural = (arr, one, many) => (arr.length > 1 ? many : one);

// ------------------------------------------------------------------
function lagnaSection(k) {
  const L = k.lagna;
  const le = k.planets[L.lord];
  let t = `your birth chart rises in ${L.sign} lagna, whose lord ${L.lord} is placed in the ${ORD[le.house]} house (${HOUSE_NAME[le.house]}) in ${le.sign}, ${DIG[le.dignity]}. `;
  t += LAGNA_TRAITS[L.sign] + ' ';
  t += LAGNESH_IN_HOUSE[le.house];
  if (isStrong(le)) t += ' This strong placement of the lagna lord fortifies health, confidence and fortune.';
  else if (le.dignity === 'debilitated') t += ' The debilitated lagna lord asks for care over health and self-confidence; its navamsa position decides its final strength.';
  if (le.combust) t += ' Being combust near the Sun, the lagna lord delivers its results with some delay.';
  if (le.retrograde && !['Rahu', 'Ketu'].includes(L.lord)) t += ' A retrograde lagna lord makes you reflect deeply and act in your own distinctive way.';
  return { key: 'lagna', title: 'Lagna and Personality', text: say(t) };
}

function chandraSection(k) {
  const M = k.planets.Moon;
  const n = k.nakshatra;
  const elong = (M.longitude - k.planets.Sun.longitude + 360) % 360;
  const paksha = elong < 180 ? 'Shukla (waxing)' : 'Krishna (waning)';
  const pakshaBala = elong >= 72 && elong <= 288;
  let t = `your Moon sign is ${M.sign} and your birth nakshatra is ${n.name} (pada ${n.pada}), ruled by ${n.lord}; the Moon occupies the ${ORD[M.house]} house, ${DIG[M.dignity]}. `;
  t += MOON_SIGN_MIND[M.sign] + ' ';
  t += NAK_TRAIT[n.name] + ' ';
  t += `You were born in the ${paksha} fortnight, so the Moon ${pakshaBala ? 'carries paksha-bala, strengthening steadiness of mind, memory and popularity' : 'is somewhat short of paksha-bala; meditation and worship of Lord Shiva will help keep the mind steady'}.`;
  if ([1, 4, 7, 10].includes(M.house)) t += ' The Moon in a kendra enhances public contact and social influence.';
  return { key: 'chandra', title: 'Moon Sign and Nakshatra', text: say(t) };
}

function grahaYogaSection(k, yogas) {
  const P = k.planets;
  const seven = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const strong = seven.filter((p) => isStrong(P[p]));
  const weak = seven.filter((p) => isWeak(P[p]));
  let t = '';
  if (strong.length) {
    t += `${join(strong.map((p) => `${p} is ${DIG[P[p].dignity]} in ${P[p].sign} in the ${ORD[P[p].house]} house`))}, giving special strength to ${themes(strong, P)}. `;
  } else {
    t += 'no planet is exalted or in its own sign, so results will depend mainly on the dasha and on navamsa strength. ';
  }
  if (weak.length) {
    t += `${join(weak.map((p) => `${p} (${P[p].dignity === 'debilitated' ? 'debilitated' : 'combust'})`))} ${plural(weak, 'is', 'are')} somewhat weak, so matters of ${themes(weak, P)} may call for extra effort. `;
  }
  const top = yogas.slice(0, 4);
  if (top.length) t += top.map((y) => y.descriptionEn).join(' ');
  else t += 'No major raja yoga or dosha is prominent; the planets are in fair balance and effort will bear fruit steadily.';
  return { key: 'graha_yoga', title: 'Planetary Positions and Yogas', text: say(t.trim()) };
}

function navamsaSection(k, gender) {
  const P = k.planets;
  const N = k.navamsa;
  const L = k.lagna;
  const le = P[L.lord];
  const seven = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

  let t = `in the Navamsa chart (D9) the lagna is ${N.lagna.sign}, ruled by ${N.lagna.lord}`;
  t += N.lagna.vargottama ? '; the birth lagna and navamsa lagna fall in the same sign, making the lagna vargottama, which gives exceptional firmness to personality and fortune. ' : '. ';

  t += `The birth lagna lord ${L.lord} is ${DIG[le.navamsa.dignity]} in ${le.navamsa.sign} in the navamsa, so `;
  if (le.navamsa.dignity === 'exalted' || le.navamsa.dignity === 'own') t += 'the good results of the birth chart will grow even stronger in the later part of life. ';
  else if (le.navamsa.dignity === 'debilitated') t += 'inner contentment will need conscious effort alongside outer success; remedies for the lagna lord will help. ';
  else t += 'the direction of life stays steady and effort is rewarded in due time. ';

  const varg = seven.filter((p) => P[p].navamsa.vargottama);
  if (varg.length) t += `${join(varg)} ${plural(varg, 'is', 'are')} vargottama, occupying the same sign in both the birth and navamsa charts; ${plural(varg, 'this planet', 'these planets')} will deliver ${plural(varg, 'its', 'their')} results with full firmness. `;

  const d9Strong = seven.filter((p) => !P[p].navamsa.vargottama && (P[p].navamsa.dignity === 'exalted' || P[p].navamsa.dignity === 'own'));
  const d9Weak = seven.filter((p) => P[p].navamsa.dignity === 'debilitated');
  if (d9Strong.length) t += `In the navamsa ${join(d9Strong.map((p) => `${p} is ${DIG[P[p].navamsa.dignity]} in ${P[p].navamsa.sign}`))}, reinforcing ${plural(d9Strong, 'its', 'their')} significations${d9Strong.some((p) => P[p].dignity === 'debilitated') ? ' and largely removing the debilitation seen in the birth chart' : ''}. `;
  if (d9Weak.length) t += `In the navamsa ${join(d9Weak)} ${plural(d9Weak, 'is', 'are')} debilitated, so results concerning ${themes(d9Weak, P)} will be somewhat less than the birth chart promises. `;

  const l7 = lordOfHouse(k, 7);
  const karaka = gender === 'female' ? 'Jupiter' : 'Venus';
  const karakaLabel = gender === 'female' ? 'Jupiter, the karaka of the husband,' : 'Venus, the karaka of the wife,';
  const d9SeventhPlanets = N.houses[6].planets;
  const malefics7 = d9SeventhPlanets.filter((p) => ['Mars', 'Saturn', 'Rahu', 'Ketu', 'Sun'].includes(p));
  const benefics7 = d9SeventhPlanets.filter((p) => ['Jupiter', 'Venus', 'Mercury', 'Moon'].includes(p));
  const dscore = (d) => ({ exalted: 2, own: 2, friend: 1, neutral: 0, enemy: -1, debilitated: -2 }[d] || 0);
  const mScore = dscore(P[l7].navamsa.dignity) + dscore(P[karaka].navamsa.dignity) + benefics7.length - malefics7.length;
  if (l7 === karaka) {
    t += `For marital happiness, the 7th lord, who is also ${karakaLabel} is ${DIG[P[l7].navamsa.dignity]} in ${P[l7].navamsa.sign} in the navamsa`;
  } else {
    t += `For marital happiness, the 7th lord ${l7} is ${DIG[P[l7].navamsa.dignity]} in ${P[l7].navamsa.sign} in the navamsa, and ${karakaLabel} is ${DIG[P[karaka].navamsa.dignity]} in ${P[karaka].navamsa.sign}`;
  }
  if (d9SeventhPlanets.length) t += `; the 7th house of the navamsa holds ${join(d9SeventhPlanets)}`;
  t += '. ';
  if (mScore >= 2) t += 'These are indications of harmony in married life, a supportive partner and a happy household. ';
  else if (mScore >= 0) t += 'Married life will generally be satisfying; dialogue and patience will keep the bond sweet. ';
  else t += 'Differences in married life are possible, so decide on marriage only after horoscope matching and in an auspicious muhurta, and perform remedies for the 7th lord. ';

  t += `The atmakaraka ${k.atmakaraka.planet} occupies ${k.atmakaraka.karakamsa} in the navamsa (the karakamsa), and ${KARAKAMSA_THEME[k.atmakaraka.karakamsa]}`;
  return { key: 'navamsa', title: 'Navamsa (D9) Reading', text: say(t.trim()) };
}

function dashaSection(k) {
  const D = k.dasha.current;
  const P = k.planets;
  const md = P[D.mahadasha.lord];
  const ad = P[D.antardasha.lord];
  let t = `you are currently passing through the mahadasha of ${D.mahadasha.lord} (${fmtDate(D.mahadasha.start)} to ${fmtDate(D.mahadasha.end)}) and the antardasha of ${D.antardasha.lord} (${fmtDate(D.antardasha.start)} to ${fmtDate(D.antardasha.end)}). `;
  t += DASHA_LORD_EFFECT[D.mahadasha.lord] + ' ';
  t += `The dasha lord ${D.mahadasha.lord} sits in the ${ORD[md.house]} house of your chart, ${DIG[md.dignity]}`;
  if (md.strength >= 70) t += `, so this dasha is progressive for you, with favourable results especially in ${HOUSE_THEME[md.house]}. `;
  else if (md.strength >= 50) t += `, so this dasha gives mixed results; effort in matters of ${HOUSE_THEME[md.house]} will be rewarded step by step. `;
  else t += `, so patience and care are needed in matters of ${HOUSE_THEME[md.house]} during this dasha; remedies for the dasha lord will help. `;
  if (D.mahadasha.lord !== D.antardasha.lord) {
    const relation = md.house === ad.house ? 'is placed together with the dasha lord' : `is in the ${ORD[ad.house]} house, ${DIG[ad.dignity]}`;
    t += `The antardasha lord ${D.antardasha.lord} ${relation}, so matters of ${HOUSE_THEME[ad.house]} will be ${ad.strength >= 60 ? 'especially favourable' : 'worth attention'} in this period. `;
  }
  if (D.upcomingAntardashas.length) {
    t += `After this, the antardasha of ${D.upcomingAntardashas[0].lord} begins (from ${fmtDate(D.upcomingAntardashas[0].start)}).`;
  }
  return { key: 'dasha', title: 'Dasha Reading', text: say(t.trim()) };
}

function remedyReasonEn(k, planet, reasonHi) {
  if (REASON_EN[reasonHi]) return REASON_EN[reasonHi];
  const pl = k.planets[planet];
  if (reasonHi.startsWith('दशानाथ')) return `rules the current dasha yet is ${DIG[pl.dignity]}`;
  if (reasonHi.startsWith('लग्नेश')) return `is the lagna lord yet is ${DIG[pl.dignity]}`;
  return `is ${DIG[pl.dignity]}`;
}

function upaySection(k, remedyPick, yogas) {
  const { planet, reason } = remedyPick;
  const r = REMEDY[planet];
  const isLord = planet === k.dasha.current.mahadasha.lord;
  let t = `in your chart ${planet} ${remedyReasonEn(k, planet, reason)}${isLord && !reason.includes('दशानाथ') ? ' and also rules the current dasha' : ''}, so pacifying and strengthening ${planet} is the first remedy to undertake. `;
  t += `On ${r.day}, chanting the mantra ${r.mantra} 108 times, donating ${r.dana}, and ${r.extra} will be especially beneficial. `;
  const dosha = yogas.find((y) => y.type === 'dosha' && y.weight >= 5);
  if (dosha) t += `A proper shanti for ${dosha.name} performed by a qualified acharya is advisable. `;
  t += 'Wear any gemstone only after showing your chart to an astrologer; regular worship of your chosen deity, service to parents and good deeds remain the greatest remedy.';
  return { key: 'upay', title: 'Remedies', text: say(t) };
}

function shortSummary(k, yogas, remedyPick, name) {
  const P = k.planets;
  const D = k.dasha.current;
  const md = P[D.mahadasha.lord];
  const who = name ? `${String(name).trim()} ji, ` : '';
  let t = `${who}your lagna is ${k.lagna.sign}, your Moon sign is ${k.rashi.sign} and your birth nakshatra is ${k.nakshatra.name} (pada ${k.nakshatra.pada}). `;
  const seven = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const strong = seven.filter((p) => isStrong(P[p]));
  if (yogas.length && yogas[0].type === 'yoga') t += `Your chart forms ${yogas[0].name}, which ${strong.length ? `with the strength of ${join(strong)} ` : ''}will bring you ${yogas[0].name.includes('Dhana') ? 'wealth and prosperity' : 'honour and advancement'}. `;
  else if (strong.length) t += `${join(strong)} ${plural(strong, 'is', 'are')} strong, reinforcing ${themes(strong, P)}. `;
  else t += 'The planets are in fair balance and steady progress comes through effort. ';
  const dosha = yogas.find((y) => y.type === 'dosha' && y.weight >= 5);
  if (dosha) t += `${dosha.name} calls for caution and remedies in certain matters. `;
  const varg = seven.filter((p) => P[p].navamsa.vargottama);
  t += `The navamsa lagna is ${k.navamsa.lagna.sign}${varg.length ? `, and ${join(varg)} ${plural(varg, 'is', 'are')} vargottama, delivering ${plural(varg, 'its', 'their')} results with firmness` : `; the lagna lord ${k.lagna.lord} is ${DIG[P[k.lagna.lord].navamsa.dignity]} in the navamsa`}. `;
  t += `The current ${D.mahadasha.lord}-${D.antardasha.lord} dasha is ${md.strength >= 70 ? 'progressive' : md.strength >= 50 ? 'mixed in its results' : 'a test of patience'}, especially in ${HOUSE_THEME[md.house]}. `;
  t += `The remedy for ${remedyPick.planet}, chanting ${REMEDY[remedyPick.planet].mantra} on ${REMEDY[remedyPick.planet].day}, will be especially beneficial for you.`;
  return say(t);
}

/**
 * Build the English reading from an already computed kundli.
 * @param {object} kundli  output of computeKundli
 * @param {Array}  yogas   output of detectYogas (with weight + descriptionEn)
 * @param {object} remedyPick output of chooseRemedyPlanet
 * @param {object} opts    { name, gender }
 */
function buildEnglishPhal(kundli, yogas, remedyPick, opts = {}) {
  const gender = String(opts.gender || '').toLowerCase();
  const sections = [
    lagnaSection(kundli),
    chandraSection(kundli),
    grahaYogaSection(kundli, yogas),
    navamsaSection(kundli, gender),
    dashaSection(kundli),
    upaySection(kundli, remedyPick, yogas)
  ];
  const grahaSthiti = Object.values(kundli.planets).map((p) => ({
    planet: p.name,
    sign: p.sign,
    degree: p.degreeFormatted,
    house: p.house,
    nakshatra: `${p.nakshatra.name} (${p.nakshatra.pada})`,
    status: DIG_SHORT[p.dignity] + (p.retrograde && !['Rahu', 'Ketu'].includes(p.name) ? ', retrograde' : '') + (p.combust ? ', combust' : ''),
    navamsaSign: p.navamsa.sign,
    vargottama: p.navamsa.vargottama
  }));
  return {
    prefix: PREFIX_EN,
    shortSummary: shortSummary(kundli, yogas, remedyPick, opts.name),
    sections,
    fullText: sections.map((s) => `[${s.title}]\n${s.text}`).join('\n\n'),
    yogas: yogas.map((y) => ({ name: y.name, nameHindi: y.nameHindi, type: y.type, description: y.descriptionEn })),
    grahaSthiti
  };
}

module.exports = { buildEnglishPhal, PREFIX_EN };
