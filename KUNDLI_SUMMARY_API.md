# Kundli Summary API (कुण्डली फल)

Both endpoints compute a real **sidereal (Lahiri ayanamsa)** chart: lagna from local sidereal time and latitude, all nine grahas, whole-sign bhavas, nakshatra + pada, **Navamsa (D9)**, Vimshottari dasha, dignity (उच्च / स्वराशि / मित्र / सम / शत्रु / नीच), combustion, retrogression, vargottama and yogas/doshas.

The reading is produced in **Hindi and English**. Every reading paragraph and the short summary begin with:

> Hindi: ज्योतिषविश्वकोश संहिता में पं. अवधनरेश जी कहते हैं कि
> English: In the Jyotish Vishwakosh Samhita, Pt. Avadh Naresh Ji says that

Implementation: `services/kundliEngine.js` (astronomy), `services/kundliPhal.js` (Hindi reading + yoga detection) and `services/kundliPhalEn.js` (English reading). Routes live in `routes/api/calculators.js`.

---

## 1. `POST /api/calculators/jyotish/kundli-summary`

Compact reading for the kundli result screen.

### Request
```json
{
  "dateOfBirth": "1990-08-15",
  "timeOfBirth": "14:30",
  "locationId": 1,
  "fullName": "Rajesh Kumar Sharma",
  "gender": "male"
}
```
- `locationId` from `/api/locations/search`, **or** send `latitude` + `longitude` (+ optional `placeName`).
- `timezoneOffset` (hours, default `5.5`) only if the birth place is outside IST.
- `gender` (`male` / `female`) picks the spouse karaka (शुक्र / गुरु) in the D9 reading. Optional.
- `language`: `"hi"` (default) or `"en"`. Chooses which reading fills the top-level `prefix`, `shortSummary`, `sections`, `fullText`, `yogas` and `grahaSthiti`. **Both** readings are always returned under `hindi` and `english`, so the app can offer a language toggle without a second request.

### Response
```json
{
  "success": true,
  "language": "hi",
  "prefix": "ज्योतिषविश्वकोश संहिता में पं. अवधनरेश जी कहते हैं कि",
  "shortSummary": "ज्योतिषविश्वकोश संहिता में पं. अवधनरेश जी कहते हैं कि Rajesh Kumar Sharma जी, आपका लग्न वृश्चिक, चन्द्र राशि वृषभ ...",
  "sections": [
    { "key": "lagna",      "title": "लग्न एवं व्यक्तित्व",       "text": "ज्योतिषविश्वकोश संहिता में ... " },
    { "key": "chandra",    "title": "चन्द्र राशि एवं नक्षत्र",    "text": "..." },
    { "key": "graha_yoga", "title": "ग्रह स्थिति एवं योग",        "text": "..." },
    { "key": "navamsa",    "title": "नवांश कुण्डली (D9) फल",      "text": "..." },
    { "key": "dasha",      "title": "दशा फल",                     "text": "..." },
    { "key": "upay",       "title": "उपाय",                       "text": "..." }
  ],
  "fullText": "【लग्न एवं व्यक्तित्व】\n... (all sections joined)",
  "hindi":   { "language": "hi", "prefix": "...", "shortSummary": "...", "sections": [...], "fullText": "...", "yogas": [...], "grahaSthiti": [...] },
  "english": {
    "language": "en",
    "prefix": "In the Jyotish Vishwakosh Samhita, Pt. Avadh Naresh Ji says that",
    "shortSummary": "In the Jyotish Vishwakosh Samhita, Pt. Avadh Naresh Ji says that Rajesh Kumar Sharma ji, your lagna is Scorpio, your Moon sign is Taurus ...",
    "sections": [
      { "key": "lagna",      "title": "Lagna and Personality",          "text": "In the Jyotish Vishwakosh Samhita, ... " },
      { "key": "chandra",    "title": "Moon Sign and Nakshatra",        "text": "..." },
      { "key": "graha_yoga", "title": "Planetary Positions and Yogas",  "text": "..." },
      { "key": "navamsa",    "title": "Navamsa (D9) Reading",           "text": "..." },
      { "key": "dasha",      "title": "Dasha Reading",                  "text": "..." },
      { "key": "upay",       "title": "Remedies",                       "text": "..." }
    ],
    "fullText": "[Lagna and Personality]\n...",
    "yogas": [ { "name": "Raja Yoga", "nameHindi": "राजयोग", "type": "yoga", "description": "The kendra lord Venus and the trikona lord Jupiter ..." } ],
    "grahaSthiti": [ { "planet": "Moon", "sign": "Taurus", "degree": "21°15'42\"", "house": 7, "nakshatra": "Rohini (4)", "status": "exalted", "navamsaSign": "Cancer", "vargottama": false } ]
  },
  "lagna":   { "sign": "Scorpio", "signHindi": "वृश्चिक", "degree": "20°44'24\"", "lord": "Mars", "lordHindi": "मंगल" },
  "rashi":   { "sign": "Taurus", "signHindi": "वृषभ" },
  "nakshatra": { "name": "Rohini", "nameHindi": "रोहिणी", "number": 4, "pada": 4, "lord": "Moon", "lordHindi": "चन्द्र" },
  "navamsaLagna": { "sign": "Capricorn", "signHindi": "मकर", "lord": "Saturn", "lordHindi": "शनि", "vargottama": false },
  "grahaSthiti": [
    { "graha": "चन्द्र", "planet": "Moon", "rashi": "वृषभ", "sign": "Taurus", "ansh": "21°15'42\"", "bhav": 7,
      "nakshatra": "रोहिणी (4)", "avastha": "उच्च", "navamsaRashi": "कर्क", "vargottama": false }
  ],
  "navamsaChart": [ { "house": 1, "sign": "Capricorn", "signHindi": "मकर", "lord": "Saturn", "lordHindi": "शनि", "planets": ["Rahu"] } ],
  "yogas": [ { "name": "Raja Yoga", "nameHindi": "राजयोग", "type": "yoga", "description": "केन्द्रेश शुक्र और त्रिकोणेश गुरु की युति ..." } ],
  "dasha": {
    "mahadasha":  { "lord": "Jupiter", "lordHindi": "गुरु", "start": "2017-03-05", "end": "2033-03-05" },
    "antardasha": { "lord": "Venus",   "lordHindi": "शुक्र", "start": "2025-01-15", "end": "2027-09-16" },
    "upcomingAntardashas": [ ... ]
  },
  "calculation": { "ayanamsa": 23.719, "ayanamsaName": "Lahiri (Chitrapaksha)", "houseSystem": "Whole sign (Rashi chakra)", "timezoneOffset": 5.5 }
}
```

Suggested screen layout: `shortSummary` as the headline card, then one card per entry in `sections` (title + text), `grahaSthiti` as the planet table, `navamsaChart` for the D9 chart drawing.

`yogas[].type` is `"yoga"` (शुभ) or `"dosha"` (मंगल दोष, कालसर्प, केमद्रुम).

---

## 2. `POST /api/calculators/jyotish/comprehensive-chart` (updated)

Same request body. The response keeps all the old keys the app already reads (`ascendant`, `planets`, `houseAnalysis`, `predictions`, `nameAnalysis`, `yogas`, `remedies`) but they are now filled from the real chart, and these keys were added:

| Key | Content |
|-----|---------|
| `kundliPhal` | Hindi reading: `{ language: "hi", prefix, shortSummary, sections, fullText, yogas, grahaSthiti }` |
| `kundliPhalEnglish` | English reading, same shape with `language: "en"` |
| `lagna` | lagna sign, degree, lord, nakshatra |
| `houses` | 12 whole-sign bhavas with sign, lord and planets |
| `navamsa` | `{ lagna, houses, planets }` D9 chart |
| `dasha` | full Vimshottari mahadasha list + current maha/antar |
| `atmakaraka` | Jaimini atmakaraka and karakamsa |
| `calculation` | ayanamsa, house system, timezone used |

`planets.<Graha>` now also carries `signHindi`, `degreeFormatted`, `combust`, `dignity`, `dignityHindi` and `navamsa` (sign, house, dignity, vargottama).
