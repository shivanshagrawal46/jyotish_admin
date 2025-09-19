# Calculator API Documentation

## Overview
This comprehensive API provides accurate calculations for Numerology, Jyotish (Vedic Astrology), and Vastu Shastra. All endpoints are designed with traditional knowledge and modern accuracy.

## Base URL
```
http://localhost:5000/api/calculators
```

## Authentication
No authentication required for calculator endpoints.

---

## Numerology Calculators

### 1. Calculate Bhagyank (Destiny Number)
**Endpoint:** `POST /numerology/bhagyank`

**Description:** Calculates the Bhagyank (Destiny Number) from birth date, representing life purpose and spiritual journey.

**Request Body:**
```json
{
  "dateOfBirth": "1990-08-15"
}
```

**Response:**
```json
{
  "success": true,
  "bhagyank": 7,
  "description": "Your Bhagyank (Destiny Number) is 7",
  "meaning": "Spirituality, introspection, analysis. You seek deeper understanding.",
  "dateOfBirth": "1990-08-15"
}
```

### 2. Calculate Mulank (Root Number)
**Endpoint:** `POST /numerology/mulank`

**Description:** Calculates the Mulank (Root Number) from birth day, revealing basic personality traits.

**Request Body:**
```json
{
  "dateOfBirth": "1990-08-15"
}
```

**Response:**
```json
{
  "success": true,
  "mulank": 6,
  "description": "Your Mulank (Root Number) is 6",
  "meaning": "Caring, responsible, family-oriented. You naturally nurture others.",
  "dateOfBirth": "1990-08-15"
}
```

### 3. Calculate Name Numerology
**Endpoint:** `POST /numerology/name`

**Description:** Calculates name number using Chaldean system, showing how others perceive you.

**Request Body:**
```json
{
  "fullName": "John Smith"
}
```

**Response:**
```json
{
  "success": true,
  "nameNumber": 8,
  "description": "Your Name Number is 8",
  "meaning": "You project success and authority. Others see you as powerful.",
  "fullName": "John Smith"
}
```

### 4. Calculate Lo Shu Grid
**Endpoint:** `POST /numerology/loshu-grid`

**Description:** Analyzes birth date using ancient Chinese Lo Shu Grid for personality insights.

**Request Body:**
```json
{
  "dateOfBirth": "1990-08-15"
}
```

**Response:**
```json
{
  "success": true,
  "grid": {
    "1": 1,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 1,
    "6": 0,
    "7": 0,
    "8": 1,
    "9": 2
  },
  "analysis": {
    "missingNumbers": [2, 3, 4, 6, 7],
    "repeatedNumbers": [{"number": 9, "count": 2}],
    "planes": {
      "mental": 2,
      "emotional": 1,
      "physical": 2
    },
    "insights": [...]
  },
  "gridVisualization": [
    ["-", 9, "-"],
    ["-", 5, "-"],
    [8, 1, "-"]
  ],
  "description": "Your Lo Shu Grid analysis reveals personality patterns and life insights",
  "dateOfBirth": "1990-08-15"
}
```

### 5. Complete Numerology Report
**Endpoint:** `POST /numerology/complete-report`

**Description:** Comprehensive numerology analysis combining all calculations.

**Request Body:**
```json
{
  "fullName": "John Smith",
  "dateOfBirth": "1990-08-15"
}
```

**Response:**
```json
{
  "success": true,
  "personalDetails": {
    "fullName": "John Smith",
    "dateOfBirth": "1990-08-15"
  },
  "numerologyReport": {
    "bhagyank": {
      "number": 7,
      "meaning": "..."
    },
    "mulank": {
      "number": 6,
      "meaning": "..."
    },
    "nameNumber": {
      "number": 8,
      "meaning": "..."
    },
    "loShuGrid": {...}
  },
  "compatibility": {
    "isHarmonious": true,
    "analysis": "Your numbers are in harmony, indicating a balanced personality.",
    "recommendations": "Continue developing your natural talents and maintain balance."
  },
  "recommendations": [...]
}
```

---

## Jyotish (Vedic Astrology) Calculators

### 1. Comprehensive Jyotish Chart
**Endpoint:** `POST /jyotish/comprehensive-chart`

**Description:** Complete Vedic astrology analysis with predictions and remedies.

**Request Body:**
```json
{
  "dateOfBirth": "1990-08-15",
  "timeOfBirth": "14:30",
  "placeOfBirth": "New Delhi, India"
}
```

**Response:**
```json
{
  "success": true,
  "birthDetails": {
    "date": "1990-08-15",
    "time": "14:30",
    "place": "New Delhi, India"
  },
  "rashi": {
    "name": "Simha (Leo)",
    "number": 5,
    "element": "Fire",
    "characteristics": "Confident, creative, generous, natural leader"
  },
  "nakshatra": {
    "name": "Magha",
    "number": 10,
    "pada": 3,
    "characteristics": "Royal nature, ancestral connections, leadership, pride"
  },
  "lifePathNumber": 7,
  "currentDasha": {
    "planet": "Jupiter",
    "startDate": "2020-08-15",
    "endDate": "2036-08-15",
    "duration": 16,
    "effects": "Wisdom, spirituality, teaching, children, long-distance travel"
  },
  "allDashaPeriods": [...],
  "yogas": [...],
  "predictions": {
    "personality": {...},
    "currentPeriod": {...},
    "strengths": [...],
    "challenges": [...],
    "careerGuidance": {...},
    "relationshipGuidance": {...},
    "healthGuidance": {...},
    "spiritualGuidance": {...}
  },
  "remedies": {
    "gemstones": ["Ruby", "Red Spinel"],
    "mantras": ["Om Hram Hreem Hroum Sah Suryaya Namaha"],
    "colors": ["Gold", "Orange"],
    "donations": ["Yellow clothes", "Gold", "Turmeric"],
    "fasting": "Thursday fasting",
    "general": [...]
  },
  "disclaimer": "This is a comprehensive Jyotish analysis based on traditional Vedic principles."
}
```

### 2. Calculate Nakshatra (Birth Star)
**Endpoint:** `POST /jyotish/nakshatra`

**Request Body:**
```json
{
  "dateOfBirth": "1990-08-15"
}
```

**Response:**
```json
{
  "success": true,
  "nakshatra": {
    "name": "Magha",
    "number": 10,
    "pada": 3,
    "characteristics": "Royal nature, ancestral connections, leadership, pride"
  },
  "description": "Your birth star (Nakshatra) is Magha",
  "meaning": "Pada 3: Royal nature, ancestral connections, leadership, pride"
}
```

### 3. Calculate Rashi (Moon Sign)
**Endpoint:** `POST /jyotish/rashi`

**Request Body:**
```json
{
  "dateOfBirth": "1990-08-15"
}
```

**Response:**
```json
{
  "success": true,
  "rashi": {
    "name": "Simha (Leo)",
    "number": 5,
    "element": "Fire",
    "characteristics": "Confident, creative, generous, natural leader"
  },
  "description": "Your Rashi (Moon Sign) is Simha (Leo)",
  "element": "Fire element",
  "characteristics": "Confident, creative, generous, natural leader"
}
```

### 4. Calculate Dasha Periods
**Endpoint:** `POST /jyotish/dasha-periods`

**Request Body:**
```json
{
  "dateOfBirth": "1990-08-15"
}
```

**Response:**
```json
{
  "success": true,
  "currentDasha": {
    "planet": "Jupiter",
    "startDate": "2020-08-15",
    "endDate": "2036-08-15",
    "duration": 16,
    "effects": "Wisdom, spirituality, teaching, children, long-distance travel"
  },
  "allPeriods": [
    {
      "planet": "Ketu",
      "startDate": "1990-08-15",
      "endDate": "1997-08-15",
      "duration": 7,
      "effects": "Spirituality, detachment, research, past-life karma, moksha"
    },
    ...
  ],
  "description": "Vimshottari Dasha periods showing planetary influences throughout life"
}
```

### 5. Calculate Yogas
**Endpoint:** `POST /jyotish/yogas`

**Request Body:**
```json
{
  "dateOfBirth": "1990-08-15"
}
```

**Response:**
```json
{
  "success": true,
  "yogas": [
    {
      "name": "Guru Yoga",
      "description": "Jupiter energy brings wisdom and spiritual growth",
      "strength": "Medium",
      "effects": "Influences personality and life approach"
    }
  ],
  "description": "Planetary yogas (combinations) present in your birth chart",
  "totalYogas": 1
}
```

### 6. Get Jyotish Remedies
**Endpoint:** `POST /jyotish/remedies`

**Request Body:**
```json
{
  "dateOfBirth": "1990-08-15"
}
```

**Response:**
```json
{
  "success": true,
  "remedies": {
    "gemstones": ["Ruby", "Red Spinel"],
    "mantras": ["Om Hram Hreem Hroum Sah Suryaya Namaha"],
    "colors": ["Gold", "Orange"],
    "donations": ["Yellow clothes", "Gold", "Turmeric"],
    "fasting": "Thursday fasting",
    "general": [
      "Regular meditation and prayer",
      "Practice yoga and pranayama",
      "Maintain positive thoughts and actions"
    ]
  },
  "currentDasha": "Jupiter",
  "description": "Personalized Vedic remedies based on your birth chart and current planetary period"
}
```

---

## Vastu Shastra Calculators

### 1. Comprehensive Vastu Analysis
**Endpoint:** `POST /vastu/comprehensive-analysis`

**Description:** Complete Vastu compliance check for any property type.

**Request Body:**
```json
{
  "propertyType": "residential",
  "facingDirection": "North",
  "mainEntrance": "Northeast",
  "rooms": {
    "kitchen": "Southeast",
    "bedroom": "Southwest",
    "livingRoom": "North",
    "bathroom": "Northwest"
  },
  "plot": {
    "shape": "square",
    "slope": "northeast"
  }
}
```

**Response:**
```json
{
  "success": true,
  "overallScore": 85,
  "compliance": "Excellent",
  "recommendations": [
    "✓ Main entrance in Northeast is ideal for North facing property",
    "✓ kitchen in Southeast is well-placed according to Vastu",
    "✓ bedroom in Southwest is well-placed according to Vastu"
  ],
  "detailedAnalysis": {
    "entrance": {...},
    "rooms": {...},
    "plot": {...}
  },
  "vastuTips": [
    "Keep the northeast corner of your home clean and clutter-free",
    "Place a water feature in the north or northeast direction"
  ],
  "propertySpecificGuidance": [
    "Main door should be larger than other doors",
    "Bedroom in southwest brings stability"
  ],
  "propertyType": "residential",
  "description": "Comprehensive Vastu analysis for residential property"
}
```

### 2. Plot Analysis
**Endpoint:** `POST /vastu/plot-analysis`

**Description:** Vastu analysis for plot selection and suitability.

**Request Body:**
```json
{
  "shape": "square",
  "size": "1000 sq ft",
  "location": "residential area",
  "surroundings": ["temple", "water body"],
  "roadDirection": "north"
}
```

**Response:**
```json
{
  "success": true,
  "plotAnalysis": {
    "score": 80,
    "recommendations": [
      "✓ Square plot is ideal for Vastu compliance",
      "✓ north road direction is very favorable",
      "✓ Temple nearby brings positive energy",
      "✓ Water body enhances prosperity"
    ],
    "suitability": "Highly Suitable"
  },
  "description": "Vastu analysis for plot selection and suitability"
}
```

### 3. Color Recommendations
**Endpoint:** `POST /vastu/color-recommendations`

**Description:** Get Vastu-compliant color recommendations for specific rooms and directions.

**Request Body:**
```json
{
  "roomType": "bedroom",
  "direction": "southwest"
}
```

**Response:**
```json
{
  "success": true,
  "colorRecommendations": {
    "recommendedColors": ["Yellow", "Beige", "Brown"],
    "avoidColors": ["Green", "Blue"],
    "roomSpecificColors": ["Soft Pink", "Light Blue", "Cream"],
    "effects": "Provides stability and grounding",
    "bestChoice": "Beige"
  },
  "description": "Color recommendations for bedroom in southwest direction"
}
```

### 4. Auspicious Timing
**Endpoint:** `POST /vastu/auspicious-timing`

**Description:** Get auspicious dates for construction, housewarming, or other activities.

**Request Body:**
```json
{
  "activity": "housewarming",
  "currentDate": "2024-09-19"
}
```

**Response:**
```json
{
  "success": true,
  "timing": {
    "activity": "housewarming",
    "nextAuspiciousDates": [
      {
        "date": "2024-09-26",
        "day": "Thursday",
        "reason": "Auspicious Thursday in favorable month"
      },
      {
        "date": "2024-09-27",
        "day": "Friday",
        "reason": "Auspicious Friday in favorable month"
      }
    ],
    "generalGuidance": "Best days: Thursday, Friday, Sunday. Favorable months: March, April, May, November, December",
    "avoid": "Avoid Rahu Kaal, eclipse periods, and inauspicious lunar days"
  },
  "description": "Auspicious timing recommendations for housewarming"
}
```

### 5. Room-Specific Guidance
**Endpoint:** `POST /vastu/room-specific-guidance`

**Description:** Get detailed Vastu guidance for specific room types.

**Request Body:**
```json
{
  "roomType": "kitchen"
}
```

**Response:**
```json
{
  "success": true,
  "roomGuidance": {
    "idealDirection": "Southeast",
    "stovePlacement": "Face East while cooking",
    "colors": ["Yellow", "Orange", "Red"],
    "avoid": ["Kitchen above/below bedroom", "Sink next to stove", "Clutter"],
    "enhance": ["Good ventilation", "Bright lighting", "Clean surfaces"],
    "tips": [
      "Keep kitchen always clean",
      "Store grains in southwest",
      "Water source in northeast",
      "Avoid black color"
    ]
  },
  "description": "Specific Vastu guidance for kitchen"
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing required parameters)
- `500` - Internal Server Error

---

## Usage Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Calculate Bhagyank
const response = await axios.post('http://localhost:5000/api/calculators/numerology/bhagyank', {
  dateOfBirth: '1990-08-15'
});

console.log(response.data.bhagyank); // 7
```

### Python
```python
import requests

# Calculate Vastu compliance
response = requests.post('http://localhost:5000/api/calculators/vastu/comprehensive-analysis', {
  'propertyType': 'residential',
  'facingDirection': 'North',
  'mainEntrance': 'Northeast'
})

data = response.json()
print(f"Vastu Score: {data['overallScore']}")
```

### cURL
```bash
# Calculate Jyotish chart
curl -X POST http://localhost:5000/api/calculators/jyotish/comprehensive-chart \
  -H "Content-Type: application/json" \
  -d '{
    "dateOfBirth": "1990-08-15",
    "timeOfBirth": "14:30",
    "placeOfBirth": "New Delhi, India"
  }'
```

---

## Features

### Numerology Features
- ✅ Accurate Bhagyank calculation with master number support
- ✅ Mulank calculation from birth day
- ✅ Name numerology using authentic Chaldean system
- ✅ Comprehensive Lo Shu Grid analysis with missing number insights
- ✅ Complete numerology report with compatibility analysis
- ✅ Detailed interpretations and life guidance

### Jyotish Features
- ✅ Comprehensive birth chart analysis
- ✅ Accurate Nakshatra (27 birth stars) calculation
- ✅ Rashi (12 zodiac signs) with elemental analysis
- ✅ Vimshottari Dasha periods (120-year cycle)
- ✅ Planetary Yoga identification and analysis
- ✅ Personalized remedies (gems, mantras, colors, donations)
- ✅ Career, relationship, health, and spiritual guidance

### Vastu Features
- ✅ Property-specific analysis (residential, commercial, office, shop, factory)
- ✅ Plot selection and suitability analysis
- ✅ Direction-based color recommendations
- ✅ Auspicious timing for various activities
- ✅ Room-specific detailed guidance
- ✅ Comprehensive compliance scoring
- ✅ Practical remedies and enhancements

### Technical Features
- ✅ RESTful API design
- ✅ JSON request/response format
- ✅ Comprehensive error handling
- ✅ Input validation
- ✅ Detailed documentation
- ✅ No authentication required
- ✅ Fast response times
- ✅ Accurate traditional calculations

---

## Support

For technical support or questions about the calculator APIs, please refer to the implementation in `routes/api/calculators.js`.

**Note:** All calculations are based on traditional Vedic knowledge and time-tested methods. For personalized consultations, it's recommended to consult qualified practitioners in respective fields.
