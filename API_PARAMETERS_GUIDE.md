# Calculator API Parameters Guide

## 🚨 **How to Fix 400 Errors**

The 400 error means you're missing required parameters. Here are the **exact parameters** for each endpoint:

---

## 📊 **NUMEROLOGY ENDPOINTS**

### 1. **Bhagyank Calculator**
```
POST /api/calculators/numerology/bhagyank
```
**Required Parameters:**
```json
{
  "dateOfBirth": "1990-08-15"
}
```

### 2. **Mulank Calculator**
```
POST /api/calculators/numerology/mulank
```
**Required Parameters:**
```json
{
  "dateOfBirth": "1990-08-15"
}
```

### 3. **Name Numerology**
```
POST /api/calculators/numerology/name
```
**Required Parameters:**
```json
{
  "fullName": "John Smith"
}
```

### 4. **Lo Shu Grid**
```
POST /api/calculators/numerology/loshu-grid
```
**Required Parameters:**
```json
{
  "dateOfBirth": "1990-08-15"
}
```

### 5. **Complete Numerology Report**
```
POST /api/calculators/numerology/complete-report
```
**Required Parameters:**
```json
{
  "fullName": "John Smith",
  "dateOfBirth": "1990-08-15"
}
```

---

## 🔮 **JYOTISH ENDPOINTS**

### 1. **Comprehensive Jyotish Chart**
```
POST /api/calculators/jyotish/comprehensive-chart
```
**Required Parameters:**
```json
{
  "dateOfBirth": "1990-08-15",
  "timeOfBirth": "14:30",
  "placeOfBirth": "New Delhi, India"
}
```
**Optional Parameters:**
```json
{
  "fullName": "Rajesh Kumar"
}
```

### 2. **Personalized Predictions (NEW)**
```
POST /api/calculators/jyotish/personalized-predictions
```
**Required Parameters:**
```json
{
  "dateOfBirth": "1990-08-15",
  "fullName": "Rajesh Kumar"
}
```
**Optional Parameters:**
```json
{
  "timeOfBirth": "14:30",
  "placeOfBirth": "Mumbai, India"
}
```

### 3. **Nakshatra Calculator**
```
POST /api/calculators/jyotish/nakshatra
```
**Required Parameters:**
```json
{
  "dateOfBirth": "1990-08-15"
}
```

### 4. **Rashi Calculator**
```
POST /api/calculators/jyotish/rashi
```
**Required Parameters:**
```json
{
  "dateOfBirth": "1990-08-15"
}
```

### 5. **Dasha Periods**
```
POST /api/calculators/jyotish/dasha-periods
```
**Required Parameters:**
```json
{
  "dateOfBirth": "1990-08-15"
}
```

### 6. **Yogas Calculator**
```
POST /api/calculators/jyotish/yogas
```
**Required Parameters:**
```json
{
  "dateOfBirth": "1990-08-15"
}
```

### 7. **Jyotish Remedies**
```
POST /api/calculators/jyotish/remedies
```
**Required Parameters:**
```json
{
  "dateOfBirth": "1990-08-15"
}
```

---

## 🏠 **VASTU ENDPOINTS**

### 1. **Comprehensive Vastu Analysis**
```
POST /api/calculators/vastu/comprehensive-analysis
```
**Required Parameters:**
```json
{
  "facingDirection": "North"
}
```
**Optional Parameters:**
```json
{
  "propertyType": "residential",
  "mainEntrance": "Northeast",
  "rooms": {
    "kitchen": "Southeast",
    "bedroom": "Southwest",
    "livingRoom": "North",
    "bathroom": "Northwest"
  },
  "plot": {
    "shape": "square",
    "slope": "northeast",
    "surroundings": ["temple", "water body"]
  }
}
```

### 2. **Plot Analysis**
```
POST /api/calculators/vastu/plot-analysis
```
**Required Parameters:**
```json
{
  "shape": "square"
}
```
**Optional Parameters:**
```json
{
  "size": "1000 sq ft",
  "location": "residential area",
  "surroundings": ["temple", "water body"],
  "roadDirection": "north"
}
```

### 3. **Color Recommendations**
```
POST /api/calculators/vastu/color-recommendations
```
**Required Parameters:**
```json
{
  "roomType": "bedroom",
  "direction": "southwest"
}
```

### 4. **Auspicious Timing**
```
POST /api/calculators/vastu/auspicious-timing
```
**Required Parameters:**
```json
{
  "activity": "housewarming"
}
```
**Optional Parameters:**
```json
{
  "currentDate": "2024-09-19"
}
```

### 5. **Room-Specific Guidance**
```
POST /api/calculators/vastu/room-specific-guidance
```
**Required Parameters:**
```json
{
  "roomType": "kitchen"
}
```

---

## 🛠️ **TESTING EXAMPLES**

### **Using cURL:**

#### Test Bhagyank:
```bash
curl -X POST https://www.jyotishvishwakosh.in/api/calculators/numerology/bhagyank \
  -H "Content-Type: application/json" \
  -d '{"dateOfBirth": "1990-08-15"}'
```

#### Test Jyotish Chart:
```bash
curl -X POST https://www.jyotishvishwakosh.in/api/calculators/jyotish/comprehensive-chart \
  -H "Content-Type: application/json" \
  -d '{
    "dateOfBirth": "1990-08-15",
    "timeOfBirth": "14:30",
    "placeOfBirth": "New Delhi, India",
    "fullName": "Rajesh Kumar"
  }'
```

#### Test Vastu Analysis:
```bash
curl -X POST https://www.jyotishvishwakosh.in/api/calculators/vastu/comprehensive-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "facingDirection": "North",
    "propertyType": "residential",
    "mainEntrance": "Northeast"
  }'
```

### **Using JavaScript/Axios:**

```javascript
// Numerology Example
const numerologyResponse = await axios.post('https://www.jyotishvishwakosh.in/api/calculators/numerology/bhagyank', {
  dateOfBirth: '1990-08-15'
});

// Jyotish Example
const jyotishResponse = await axios.post('https://www.jyotishvishwakosh.in/api/calculators/jyotish/comprehensive-chart', {
  dateOfBirth: '1990-08-15',
  timeOfBirth: '14:30',
  placeOfBirth: 'New Delhi, India',
  fullName: 'Rajesh Kumar'
});

// Vastu Example
const vastuResponse = await axios.post('https://www.jyotishvishwakosh.in/api/calculators/vastu/comprehensive-analysis', {
  facingDirection: 'North',
  propertyType: 'residential'
});
```

---

## ⚠️ **COMMON MISTAKES THAT CAUSE 400 ERRORS**

### 1. **Missing Required Fields:**
```json
// ❌ WRONG - Missing required dateOfBirth
{
  "name": "John"
}

// ✅ CORRECT
{
  "dateOfBirth": "1990-08-15"
}
```

### 2. **Wrong Field Names:**
```json
// ❌ WRONG - Field name is incorrect
{
  "dob": "1990-08-15"
}

// ✅ CORRECT
{
  "dateOfBirth": "1990-08-15"
}
```

### 3. **Wrong Date Format:**
```json
// ❌ WRONG - Wrong date format
{
  "dateOfBirth": "15/08/1990"
}

// ✅ CORRECT - Use YYYY-MM-DD format
{
  "dateOfBirth": "1990-08-15"
}
```

### 4. **Missing Content-Type Header:**
```bash
# ❌ WRONG - Missing Content-Type
curl -X POST https://www.jyotishvishwakosh.in/api/calculators/numerology/bhagyank \
  -d '{"dateOfBirth": "1990-08-15"}'

# ✅ CORRECT - Include Content-Type
curl -X POST https://www.jyotishvishwakosh.in/api/calculators/numerology/bhagyank \
  -H "Content-Type: application/json" \
  -d '{"dateOfBirth": "1990-08-15"}'
```

---

## 📋 **PARAMETER VALIDATION RULES**

### **Date Format:**
- **Format**: `YYYY-MM-DD`
- **Example**: `"1990-08-15"`

### **Time Format:**
- **Format**: `HH:MM` (24-hour)
- **Example**: `"14:30"`

### **Property Facing Directions:**
- `"North"`, `"South"`, `"East"`, `"West"`
- `"Northeast"`, `"Northwest"`, `"Southeast"`, `"Southwest"`

### **Property Types:**
- `"residential"`, `"commercial"`, `"office"`, `"shop"`, `"factory"`

### **Room Types:**
- `"kitchen"`, `"bedroom"`, `"livingRoom"`, `"bathroom"`, `"studyRoom"`, `"poojaRoom"`, `"storeRoom"`

### **Plot Shapes:**
- `"square"`, `"rectangle"`, `"triangular"`, `"irregular"`

### **Activities (for timing):**
- `"construction_start"`, `"housewarming"`, `"office_opening"`, `"renovation"`, `"property_purchase"`

---

## 🔧 **DEBUGGING TIPS**

1. **Check the exact endpoint URL**
2. **Ensure Content-Type: application/json header**
3. **Verify all required parameters are present**
4. **Use correct parameter names (case-sensitive)**
5. **Use proper date format (YYYY-MM-DD)**
6. **Check server logs for detailed error messages**

---

## ✅ **QUICK TEST**

Try this simple test to verify your setup:

```bash
curl -X POST https://www.jyotishvishwakosh.in/api/calculators/numerology/bhagyank \
  -H "Content-Type: application/json" \
  -d '{"dateOfBirth": "1990-08-15"}'
```

**Expected Response:**
```json
{
  "success": true,
  "bhagyank": 7,
  "description": "Your Bhagyank (Destiny Number) is 7",
  "meaning": "Spirituality, introspection, analysis. You seek deeper understanding.",
  "dateOfBirth": "1990-08-15"
}
```

If you're still getting 400 errors, please share:
1. The exact endpoint you're calling
2. The exact JSON you're sending
3. The error message you're receiving

This will help me identify the specific issue! 🚀
