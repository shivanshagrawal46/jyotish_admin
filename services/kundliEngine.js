'use strict';

/**
 * Kundli Engine
 * ------------------------------------------------------------------
 * Real (not random) sidereal astronomy for the kundli calculators.
 *
 *  - Geocentric ecliptic longitudes of Sun, Moon, Mars, Mercury, Jupiter,
 *    Venus, Saturn (low-precision Keplerian model with the classic
 *    lunar / Jupiter–Saturn perturbation terms; accuracy is a few arc-minutes,
 *    which is more than enough for rashi / bhava / navamsa placement).
 *  - Rahu (mean lunar node) and Ketu.
 *  - Lahiri (Chitrapaksha) ayanamsa -> sidereal (nirayana) zodiac.
 *  - Lagna (ascendant) from local sidereal time and latitude.
 *  - Whole-sign bhavas counted from the lagna (North-Indian kundli style).
 *  - Nakshatra + pada, Navamsa (D9) chart, Vimshottari dasha.
 *  - Dignity (exaltation / own / friend / enemy / debilitation), combustion,
 *    retrogression, vargottama and a numeric strength score.
 *
 * Everything is pure and dependency-free.
 */

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

const SIGNS_EN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const SIGNS_HI = ['मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या',
  'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन'];

const PLANETS_EN = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const PLANETS_HI = {
  Sun: 'सूर्य', Moon: 'चन्द्र', Mars: 'मंगल', Mercury: 'बुध', Jupiter: 'गुरु',
  Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु'
};

const NAKSHATRAS_EN = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu',
  'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati',
  'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana',
  'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'];
const NAKSHATRAS_HI = ['अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा', 'पुनर्वसु',
  'पुष्य', 'आश्लेषा', 'मघा', 'पूर्वा फाल्गुनी', 'उत्तरा फाल्गुनी', 'हस्त', 'चित्रा', 'स्वाति',
  'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूल', 'पूर्वाषाढ़ा', 'उत्तराषाढ़ा', 'श्रवण',
  'धनिष्ठा', 'शतभिषा', 'पूर्वा भाद्रपद', 'उत्तरा भाद्रपद', 'रेवती'];

// Vimshottari sequence starting from Ashwini
const DASHA_SEQUENCE = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
const DASHA_YEARS = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };

const SIGN_LORD = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
  'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];

const EXALTATION = { Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6, Rahu: 1, Ketu: 7 };
const OWN_SIGNS = {
  Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5], Jupiter: [8, 11],
  Venus: [1, 6], Saturn: [9, 10], Rahu: [10], Ketu: [7]
};
const FRIENDS = {
  Sun: ['Moon', 'Mars', 'Jupiter'], Moon: ['Sun', 'Mercury'], Mars: ['Sun', 'Moon', 'Jupiter'],
  Mercury: ['Sun', 'Venus'], Jupiter: ['Sun', 'Moon', 'Mars'], Venus: ['Mercury', 'Saturn'],
  Saturn: ['Mercury', 'Venus'], Rahu: ['Venus', 'Saturn', 'Mercury'], Ketu: ['Mars', 'Venus', 'Saturn']
};
const ENEMIES = {
  Sun: ['Venus', 'Saturn'], Moon: [], Mars: ['Mercury'], Mercury: ['Moon'],
  Jupiter: ['Mercury', 'Venus'], Venus: ['Sun', 'Moon'], Saturn: ['Sun', 'Moon', 'Mars'],
  Rahu: ['Sun', 'Moon', 'Mars'], Ketu: ['Sun', 'Moon']
};
const COMBUST_ORB = { Moon: 12, Mars: 17, Mercury: 14, Jupiter: 11, Venus: 10, Saturn: 15 };

const NATURAL_BENEFICS = ['Jupiter', 'Venus', 'Mercury', 'Moon'];

// ------------------------------------------------------------------
// Basic math helpers
// ------------------------------------------------------------------
const norm360 = (x) => ((x % 360) + 360) % 360;
const sinD = (x) => Math.sin(x * DEG);
const cosD = (x) => Math.cos(x * DEG);
const tanD = (x) => Math.tan(x * DEG);
const atan2D = (y, x) => norm360(Math.atan2(y, x) * RAD);

/**
 * Convert local birth date/time to Julian Day (UT).
 * @param {string} dateStr YYYY-MM-DD
 * @param {string} timeStr HH:MM or HH:MM:SS (24h, local)
 * @param {number} tzOffsetHours e.g. 5.5 for IST
 */
function toJulianDay(dateStr, timeStr, tzOffsetHours) {
  const [y, m, d] = String(dateStr).split('-').map(Number);
  const parts = String(timeStr || '12:00').split(':').map(Number);
  const hh = parts[0] || 0;
  const mm = parts[1] || 0;
  const ss = parts[2] || 0;
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) {
    throw new Error('Invalid date or time of birth.');
  }
  const utHours = hh + mm / 60 + ss / 3600 - tzOffsetHours;
  // Gregorian calendar JD at 0h
  let Y = y;
  let M = m;
  if (M <= 2) { Y -= 1; M += 12; }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const jd0 = Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + d + B - 1524.5;
  return jd0 + utHours / 24;
}

function julianDayToDate(jd) {
  return new Date((jd - 2440587.5) * 86400000);
}

/** Lahiri ayanamsa (degrees) for a Julian day. */
function lahiriAyanamsa(jd) {
  const yearsFromJ2000 = (jd - 2451545.0) / 365.25;
  return 23.85 + 0.0139694 * yearsFromJ2000;
}

function solveKepler(M, e) {
  // M in degrees, e eccentricity. Returns eccentric anomaly in degrees.
  let E = M + e * RAD * sinD(M) * (1 + e * cosD(M));
  for (let i = 0; i < 10; i++) {
    const dE = (E - e * RAD * sinD(E) - M) / (1 - e * cosD(E));
    E -= dE;
    if (Math.abs(dE) < 1e-7) break;
  }
  return E;
}

// ------------------------------------------------------------------
// Tropical geocentric longitudes (Schlyter's low precision model)
// ------------------------------------------------------------------
function sunPosition(d) {
  const w = 282.9404 + 4.70935e-5 * d;
  const e = 0.016709 - 1.151e-9 * d;
  const M = norm360(356.0470 + 0.9856002585 * d);
  const E = M + e * RAD * sinD(M) * (1 + e * cosD(M));
  const xv = cosD(E) - e;
  const yv = Math.sqrt(1 - e * e) * sinD(E);
  const v = atan2D(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);
  const lon = norm360(v + w);
  return { lon, r, xs: r * cosD(lon), ys: r * sinD(lon), M, w };
}

function moonPosition(d, sun) {
  const N = norm360(125.1228 - 0.0529538083 * d);
  const i = 5.1454;
  const w = norm360(318.0634 + 0.1643573223 * d);
  const a = 60.2666;
  const e = 0.054900;
  const M = norm360(115.3654 + 13.0649929509 * d);
  const E = solveKepler(M, e);
  const xv = a * (cosD(E) - e);
  const yv = a * Math.sqrt(1 - e * e) * sinD(E);
  const v = atan2D(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);
  const vw = v + w;
  const xh = r * (cosD(N) * cosD(vw) - sinD(N) * sinD(vw) * cosD(i));
  const yh = r * (sinD(N) * cosD(vw) + cosD(N) * sinD(vw) * cosD(i));
  const zh = r * sinD(vw) * sinD(i);
  let lon = atan2D(yh, xh);
  let lat = Math.atan2(zh, Math.sqrt(xh * xh + yh * yh)) * RAD;

  // Perturbations
  const Ms = sun.M;
  const Mm = M;
  const Ls = norm360(sun.M + sun.w);
  const Lm = norm360(Mm + w + N);
  const D = Lm - Ls;
  const F = Lm - N;
  lon += -1.274 * sinD(Mm - 2 * D)
    + 0.658 * sinD(2 * D)
    - 0.186 * sinD(Ms)
    - 0.059 * sinD(2 * Mm - 2 * D)
    - 0.057 * sinD(Mm - 2 * D + Ms)
    + 0.053 * sinD(Mm + 2 * D)
    + 0.046 * sinD(2 * D - Ms)
    + 0.041 * sinD(Mm - Ms)
    - 0.035 * sinD(D)
    - 0.031 * sinD(Mm + Ms)
    - 0.015 * sinD(2 * F - 2 * D)
    + 0.011 * sinD(Mm - 4 * D);
  lat += -0.173 * sinD(F - 2 * D)
    - 0.055 * sinD(Mm - F - 2 * D)
    - 0.046 * sinD(Mm + F - 2 * D)
    + 0.033 * sinD(F + 2 * D)
    + 0.017 * sinD(2 * Mm + F);
  return { lon: norm360(lon), lat, node: N };
}

const PLANET_ELEMENTS = {
  Mercury: (d) => ({ N: 48.3313 + 3.24587e-5 * d, i: 7.0047 + 5.0e-8 * d, w: 29.1241 + 1.01444e-5 * d, a: 0.387098, e: 0.205635 + 5.59e-10 * d, M: 168.6562 + 4.0923344368 * d }),
  Venus: (d) => ({ N: 76.6799 + 2.46590e-5 * d, i: 3.3946 + 2.75e-8 * d, w: 54.8910 + 1.38374e-5 * d, a: 0.723330, e: 0.006773 - 1.302e-9 * d, M: 48.0052 + 1.6021302244 * d }),
  Mars: (d) => ({ N: 49.5574 + 2.11081e-5 * d, i: 1.8497 - 1.78e-8 * d, w: 286.5016 + 2.92961e-5 * d, a: 1.523688, e: 0.093405 + 2.516e-9 * d, M: 18.6021 + 0.5240207766 * d }),
  Jupiter: (d) => ({ N: 100.4542 + 2.76854e-5 * d, i: 1.3030 - 1.557e-7 * d, w: 273.8777 + 1.64505e-5 * d, a: 5.20256, e: 0.048498 + 4.469e-9 * d, M: 19.8950 + 0.0830853001 * d }),
  Saturn: (d) => ({ N: 113.6634 + 2.38980e-5 * d, i: 2.4886 - 1.081e-7 * d, w: 339.3939 + 2.97661e-5 * d, a: 9.55475, e: 0.055546 - 9.499e-9 * d, M: 316.9670 + 0.0334442282 * d })
};

function heliocentric(el) {
  const M = norm360(el.M);
  const E = solveKepler(M, el.e);
  const xv = el.a * (cosD(E) - el.e);
  const yv = el.a * Math.sqrt(1 - el.e * el.e) * sinD(E);
  const v = atan2D(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);
  const vw = v + el.w;
  const xh = r * (cosD(el.N) * cosD(vw) - sinD(el.N) * sinD(vw) * cosD(el.i));
  const yh = r * (sinD(el.N) * cosD(vw) + cosD(el.N) * sinD(vw) * cosD(el.i));
  const zh = r * sinD(vw) * sinD(el.i);
  return { lon: atan2D(yh, xh), lat: Math.atan2(zh, Math.sqrt(xh * xh + yh * yh)) * RAD, r, M };
}

function planetPosition(name, d, sun) {
  const el = PLANET_ELEMENTS[name](d);
  const h = heliocentric(el);
  let lon = h.lon;
  let lat = h.lat;
  if (name === 'Jupiter' || name === 'Saturn') {
    const Mj = norm360(19.8950 + 0.0830853001 * d);
    const Ms = norm360(316.9670 + 0.0334442282 * d);
    if (name === 'Jupiter') {
      lon += -0.332 * sinD(2 * Mj - 5 * Ms - 67.6)
        - 0.056 * sinD(2 * Mj - 2 * Ms + 21)
        + 0.042 * sinD(3 * Mj - 5 * Ms + 21)
        - 0.036 * sinD(Mj - 2 * Ms)
        + 0.022 * cosD(Mj - Ms)
        + 0.023 * sinD(2 * Mj - 3 * Ms + 52)
        - 0.016 * sinD(Mj - 5 * Ms - 69);
    } else {
      lon += 0.812 * sinD(2 * Mj - 5 * Ms - 67.6)
        - 0.229 * cosD(2 * Mj - 4 * Ms - 2)
        + 0.119 * sinD(Mj - 2 * Ms - 3)
        + 0.046 * sinD(2 * Mj - 6 * Ms - 69)
        + 0.014 * sinD(Mj - 3 * Ms + 32);
      lat += -0.020 * cosD(2 * Mj - 4 * Ms - 2)
        + 0.018 * sinD(2 * Mj - 6 * Ms - 49);
    }
  }
  const xh = h.r * cosD(lon) * cosD(lat);
  const yh = h.r * sinD(lon) * cosD(lat);
  const xg = xh + sun.xs;
  const yg = yh + sun.ys;
  return { lon: atan2D(yg, xg) };
}

/** Tropical geocentric longitudes of all grahas for Julian day jd. */
function tropicalLongitudes(jd) {
  const d = jd - 2451543.5;
  const sun = sunPosition(d);
  const moon = moonPosition(d, sun);
  const out = { Sun: sun.lon, Moon: moon.lon };
  ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].forEach((p) => {
    out[p] = planetPosition(p, d, sun).lon;
  });
  out.Rahu = norm360(moon.node);
  out.Ketu = norm360(moon.node + 180);
  return out;
}

// ------------------------------------------------------------------
// Lagna
// ------------------------------------------------------------------
function localSiderealTime(jd, longitudeEast) {
  const T = (jd - 2451545.0) / 36525;
  const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - (T * T * T) / 38710000;
  return norm360(gmst + longitudeEast);
}

function tropicalAscendant(jd, latitude, longitude) {
  const d = jd - 2451543.5;
  const eps = 23.4393 - 3.563e-7 * d;
  const ramc = localSiderealTime(jd, longitude);
  const y = cosD(ramc);
  const x = -(sinD(ramc) * cosD(eps) + tanD(latitude) * sinD(eps));
  return { asc: atan2D(y, x), ramc, eps };
}

// ------------------------------------------------------------------
// Zodiac helpers
// ------------------------------------------------------------------
function signInfo(siderealLon) {
  const lon = norm360(siderealLon);
  const signIndex = Math.floor(lon / 30);
  const degree = lon - signIndex * 30;
  return { longitude: lon, signIndex, sign: SIGNS_EN[signIndex], signHindi: SIGNS_HI[signIndex], degree };
}

function nakshatraInfo(siderealLon) {
  const lon = norm360(siderealLon);
  const span = 360 / 27;
  const index = Math.floor(lon / span);
  const within = lon - index * span;
  const pada = Math.floor(within / (span / 4)) + 1;
  return {
    number: index + 1,
    name: NAKSHATRAS_EN[index],
    nameHindi: NAKSHATRAS_HI[index],
    pada,
    lord: DASHA_SEQUENCE[index % 9],
    lordHindi: PLANETS_HI[DASHA_SEQUENCE[index % 9]],
    elapsedFraction: within / span
  };
}

function navamsaSignIndex(siderealLon) {
  const lon = norm360(siderealLon);
  const signIndex = Math.floor(lon / 30);
  const part = Math.floor((lon - signIndex * 30) / (30 / 9));
  return (signIndex * 9 + part) % 12;
}

function houseFrom(signIndex, lagnaSignIndex) {
  return ((signIndex - lagnaSignIndex + 12) % 12) + 1;
}

function formatDegree(deg) {
  const d = Math.floor(deg);
  const mFloat = (deg - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60);
  return `${d}°${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}"`;
}

// ------------------------------------------------------------------
// Dignity
// ------------------------------------------------------------------
function dignityOf(planet, signIndex) {
  if (EXALTATION[planet] === signIndex) return 'exalted';
  if ((EXALTATION[planet] + 6) % 12 === signIndex) return 'debilitated';
  if (OWN_SIGNS[planet].includes(signIndex)) return 'own';
  const lord = SIGN_LORD[signIndex];
  if (lord === planet) return 'own';
  if (FRIENDS[planet].includes(lord)) return 'friend';
  if (ENEMIES[planet].includes(lord)) return 'enemy';
  return 'neutral';
}

const DIGNITY_HI = {
  exalted: 'उच्च', own: 'स्वराशि', friend: 'मित्र राशि', neutral: 'सम राशि', enemy: 'शत्रु राशि', debilitated: 'नीच'
};
const DIGNITY_SCORE = { exalted: 95, own: 85, friend: 70, neutral: 55, enemy: 40, debilitated: 25 };

function angularDistance(a, b) {
  const diff = Math.abs(norm360(a) - norm360(b));
  return diff > 180 ? 360 - diff : diff;
}

// ------------------------------------------------------------------
// Vimshottari dasha
// ------------------------------------------------------------------
function vimshottari(moonSiderealLon, birthJd, nowDate) {
  const nak = nakshatraInfo(moonSiderealLon);
  const startIdx = DASHA_SEQUENCE.indexOf(nak.lord);
  const balanceYears = (1 - nak.elapsedFraction) * DASHA_YEARS[nak.lord];
  const YEAR_DAYS = 365.25;

  const mahadashas = [];
  let cursor = birthJd - nak.elapsedFraction * DASHA_YEARS[nak.lord] * YEAR_DAYS; // notional start of first dasha
  for (let k = 0; k < 9; k++) {
    const lord = DASHA_SEQUENCE[(startIdx + k) % 9];
    const years = DASHA_YEARS[lord];
    const startJd = cursor;
    const endJd = cursor + years * YEAR_DAYS;
    mahadashas.push({ lord, lordHindi: PLANETS_HI[lord], years, startJd, endJd });
    cursor = endJd;
  }
  mahadashas[0].startJd = birthJd;
  mahadashas[0].balanceYears = Number(balanceYears.toFixed(2));

  const nowJd = (nowDate.getTime() / 86400000) + 2440587.5;
  let current = mahadashas.find((m) => nowJd >= m.startJd && nowJd < m.endJd) || mahadashas[mahadashas.length - 1];
  const mahaFullStart = current.endJd - current.years * YEAR_DAYS;

  // Antardashas of the current mahadasha
  const antardashas = [];
  const mIdx = DASHA_SEQUENCE.indexOf(current.lord);
  let aCursor = mahaFullStart;
  for (let k = 0; k < 9; k++) {
    const lord = DASHA_SEQUENCE[(mIdx + k) % 9];
    const days = (current.years * DASHA_YEARS[lord] / 120) * YEAR_DAYS;
    antardashas.push({ lord, lordHindi: PLANETS_HI[lord], startJd: aCursor, endJd: aCursor + days });
    aCursor += days;
  }
  const currentAntar = antardashas.find((a) => nowJd >= a.startJd && nowJd < a.endJd) || antardashas[antardashas.length - 1];

  const fmt = (jd) => julianDayToDate(jd).toISOString().slice(0, 10);
  return {
    birthNakshatra: nak,
    balanceAtBirth: { lord: mahadashas[0].lord, lordHindi: mahadashas[0].lordHindi, years: mahadashas[0].balanceYears },
    mahadashas: mahadashas.map((m) => ({ lord: m.lord, lordHindi: m.lordHindi, years: m.years, start: fmt(m.startJd), end: fmt(m.endJd) })),
    current: {
      mahadasha: { lord: current.lord, lordHindi: current.lordHindi, start: fmt(current.startJd), end: fmt(current.endJd) },
      antardasha: { lord: currentAntar.lord, lordHindi: currentAntar.lordHindi, start: fmt(currentAntar.startJd), end: fmt(currentAntar.endJd) },
      upcomingAntardashas: antardashas.filter((a) => a.startJd > nowJd).slice(0, 3)
        .map((a) => ({ lord: a.lord, lordHindi: a.lordHindi, start: fmt(a.startJd), end: fmt(a.endJd) }))
    }
  };
}

// ------------------------------------------------------------------
// Main chart computation
// ------------------------------------------------------------------
/**
 * @param {object} input
 * @param {string} input.dateOfBirth YYYY-MM-DD
 * @param {string} input.timeOfBirth HH:MM (local)
 * @param {number} input.latitude
 * @param {number} input.longitude east positive
 * @param {number} [input.timezoneOffset=5.5] hours
 * @param {Date}   [input.now]
 */
function computeKundli(input) {
  const tz = typeof input.timezoneOffset === 'number' ? input.timezoneOffset : 5.5;
  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Valid latitude and longitude are required.');
  }
  const jd = toJulianDay(input.dateOfBirth, input.timeOfBirth, tz);
  const ayanamsa = lahiriAyanamsa(jd);
  const now = input.now instanceof Date ? input.now : new Date();

  const trop = tropicalLongitudes(jd);
  const tropNext = tropicalLongitudes(jd + 1); // for retrograde detection

  const ascT = tropicalAscendant(jd, latitude, longitude);
  const lagnaLon = norm360(ascT.asc - ayanamsa);
  const lagna = signInfo(lagnaLon);
  const lagnaNak = nakshatraInfo(lagnaLon);
  const navLagnaIdx = navamsaSignIndex(lagnaLon);

  const sunSid = norm360(trop.Sun - ayanamsa);

  const planets = {};
  PLANETS_EN.forEach((p) => {
    const sid = norm360(trop[p] - ayanamsa);
    const s = signInfo(sid);
    const nak = nakshatraInfo(sid);
    const navIdx = navamsaSignIndex(sid);
    let retrograde = false;
    if (['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].includes(p)) {
      let delta = tropNext[p] - trop[p];
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      retrograde = delta < 0;
    }
    if (p === 'Rahu' || p === 'Ketu') retrograde = true;
    const combust = COMBUST_ORB[p] ? angularDistance(sid, sunSid) <= COMBUST_ORB[p] : false;
    const dignity = dignityOf(p, s.signIndex);
    const navDignity = dignityOf(p, navIdx);
    const vargottama = navIdx === s.signIndex;
    let strength = DIGNITY_SCORE[dignity];
    if (combust) strength -= 12;
    if (vargottama) strength += 6;
    if (navDignity === 'exalted' || navDignity === 'own') strength += 5;
    if (navDignity === 'debilitated') strength -= 6;
    strength = Math.max(10, Math.min(100, strength));

    planets[p] = {
      name: p,
      nameHindi: PLANETS_HI[p],
      longitude: Number(sid.toFixed(4)),
      sign: s.sign,
      signHindi: s.signHindi,
      signIndex: s.signIndex,
      degree: Number(s.degree.toFixed(2)),
      degreeFormatted: formatDegree(s.degree),
      house: houseFrom(s.signIndex, lagna.signIndex),
      nakshatra: { name: nak.name, nameHindi: nak.nameHindi, number: nak.number, pada: nak.pada, lord: nak.lord, lordHindi: nak.lordHindi },
      retrograde,
      combust,
      dignity,
      dignityHindi: DIGNITY_HI[dignity],
      strength,
      navamsa: {
        signIndex: navIdx,
        sign: SIGNS_EN[navIdx],
        signHindi: SIGNS_HI[navIdx],
        house: houseFrom(navIdx, navLagnaIdx),
        dignity: navDignity,
        dignityHindi: DIGNITY_HI[navDignity],
        vargottama
      }
    };
  });

  // Whole-sign houses
  const houses = [];
  for (let h = 1; h <= 12; h++) {
    const idx = (lagna.signIndex + h - 1) % 12;
    houses.push({
      house: h,
      signIndex: idx,
      sign: SIGNS_EN[idx],
      signHindi: SIGNS_HI[idx],
      lord: SIGN_LORD[idx],
      lordHindi: PLANETS_HI[SIGN_LORD[idx]],
      planets: PLANETS_EN.filter((p) => planets[p].house === h)
    });
  }
  const navamsaHouses = [];
  for (let h = 1; h <= 12; h++) {
    const idx = (navLagnaIdx + h - 1) % 12;
    navamsaHouses.push({
      house: h,
      signIndex: idx,
      sign: SIGNS_EN[idx],
      signHindi: SIGNS_HI[idx],
      lord: SIGN_LORD[idx],
      lordHindi: PLANETS_HI[SIGN_LORD[idx]],
      planets: PLANETS_EN.filter((p) => planets[p].navamsa.house === h)
    });
  }

  const moon = planets.Moon;
  const dasha = vimshottari(moon.longitude, jd, now);

  // Atmakaraka: highest degree within sign among the seven planets (+ Rahu reversed)
  const akCandidates = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].map((p) => ({ p, deg: planets[p].degree }));
  akCandidates.push({ p: 'Rahu', deg: 30 - planets.Rahu.degree });
  akCandidates.sort((a, b) => b.deg - a.deg);
  const atmakaraka = akCandidates[0].p;

  return {
    meta: {
      julianDay: Number(jd.toFixed(5)),
      ayanamsa: Number(ayanamsa.toFixed(4)),
      ayanamsaName: 'Lahiri (Chitrapaksha)',
      houseSystem: 'Whole sign (Rashi chakra)',
      timezoneOffset: tz,
      siderealTime: Number((ascT.ramc / 15).toFixed(4))
    },
    lagna: {
      longitude: Number(lagnaLon.toFixed(4)),
      sign: lagna.sign,
      signHindi: lagna.signHindi,
      signIndex: lagna.signIndex,
      degree: Number(lagna.degree.toFixed(2)),
      degreeFormatted: formatDegree(lagna.degree),
      lord: SIGN_LORD[lagna.signIndex],
      lordHindi: PLANETS_HI[SIGN_LORD[lagna.signIndex]],
      nakshatra: { name: lagnaNak.name, nameHindi: lagnaNak.nameHindi, pada: lagnaNak.pada, lord: lagnaNak.lord, lordHindi: lagnaNak.lordHindi }
    },
    rashi: {
      sign: moon.sign, signHindi: moon.signHindi, signIndex: moon.signIndex,
      lord: SIGN_LORD[moon.signIndex], lordHindi: PLANETS_HI[SIGN_LORD[moon.signIndex]]
    },
    nakshatra: moon.nakshatra,
    planets,
    houses,
    navamsa: {
      lagna: {
        signIndex: navLagnaIdx, sign: SIGNS_EN[navLagnaIdx], signHindi: SIGNS_HI[navLagnaIdx],
        lord: SIGN_LORD[navLagnaIdx], lordHindi: PLANETS_HI[SIGN_LORD[navLagnaIdx]],
        vargottama: navLagnaIdx === lagna.signIndex
      },
      houses: navamsaHouses,
      planets: Object.fromEntries(PLANETS_EN.map((p) => [p, {
        name: p, nameHindi: PLANETS_HI[p], ...planets[p].navamsa
      }]))
    },
    dasha,
    atmakaraka: { planet: atmakaraka, planetHindi: PLANETS_HI[atmakaraka], karakamsa: planets[atmakaraka].navamsa.sign, karakamsaHindi: planets[atmakaraka].navamsa.signHindi }
  };
}

module.exports = {
  computeKundli,
  toJulianDay,
  lahiriAyanamsa,
  tropicalLongitudes,
  tropicalAscendant,
  navamsaSignIndex,
  nakshatraInfo,
  dignityOf,
  SIGNS_EN,
  SIGNS_HI,
  PLANETS_EN,
  PLANETS_HI,
  NAKSHATRAS_EN,
  NAKSHATRAS_HI,
  SIGN_LORD,
  NATURAL_BENEFICS,
  DIGNITY_HI
};
