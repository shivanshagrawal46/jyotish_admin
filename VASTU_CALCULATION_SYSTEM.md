# Comprehensive Vastu Calculation System

## What the Vastu Calculator Analyzes

### **Overview**
The Vastu calculator performs comprehensive analysis of properties based on ancient Indian architectural science (Vastu Shastra) to ensure harmony between cosmic energies and living spaces.

---

## **🏠 Input Parameters**

### **Required Inputs:**
- **Property Facing Direction** - North, South, East, West, Northeast, Northwest, Southeast, Southwest
- **Property Type** - Residential, Commercial, Office, Shop, Factory

### **Optional Inputs:**
- **Main Entrance Direction** - For entrance analysis
- **Room Layout** - Kitchen, Bedroom, Living Room, Bathroom, Study, Pooja Room, Store Room locations
- **Plot Details** - Shape, size, slope, surroundings, road direction

---

## **📊 Detailed Calculations & Analysis**

### **1. Property Compliance Analysis**

#### **Main Entrance Analysis:**
```javascript
// Ideal entrance directions for each facing
North Facing: North, Northeast entrances (Best)
South Facing: South, Southeast entrances
East Facing: East, Northeast entrances  
West Facing: West, Northwest entrances
```

**Scoring System:**
- ✅ **Ideal Placement**: +25 points
- ⚠️ **Acceptable**: +10 points  
- ❌ **Needs Correction**: +5 points

#### **Room Placement Analysis:**
```javascript
Ideal Room Placements:
Kitchen: Southeast (Agni corner) or Northwest
Bedroom: Southwest (stability), South, West
Living Room: North, Northeast, East (social energy)
Bathroom: Northwest, West (waste disposal)
Study Room: Northeast, North, East (knowledge)
Pooja Room: Northeast, North, East (divine energy)
Store Room: Southwest, West, South (storage)
```

**Scoring per Room:**
- ✅ **Perfect Placement**: +10 points
- ⚠️ **Needs Improvement**: +3 points

#### **Plot Characteristics Analysis:**
```javascript
Shape Analysis:
Square: +15 points (Most auspicious)
Rectangle: +15 points (Good)
Irregular: +5 points (Needs correction)

Slope Analysis:
Northeast: +15 points (Highly auspicious)
North/East: +10 points (Favorable)
Other directions: +3 points (Needs correction)

Surroundings Impact:
Temple nearby: +10 points (Positive energy)
Water body: +15 points (Prosperity)
Hospital: -5 points (Negative energy)
Cemetery: -15 points (Very negative)
```

### **2. Property-Specific Analysis**

#### **Residential Properties:**
- **Focus Areas**: Family harmony, health, prosperity
- **Key Factors**: Bedroom placement, kitchen direction, entrance
- **Special Considerations**: Children's rooms, elderly care areas

#### **Commercial Properties:**
- **Focus Areas**: Business growth, customer attraction, profit
- **Key Factors**: Reception area, owner's cabin, cash counter
- **Special Considerations**: Display areas, storage, employee areas

#### **Office Spaces:**
- **Focus Areas**: Productivity, leadership, team harmony
- **Key Factors**: Boss seating, meeting rooms, workstations
- **Special Considerations**: Break areas, conference rooms

#### **Shops/Retail:**
- **Focus Areas**: Customer flow, sales, inventory management
- **Key Factors**: Entrance visibility, cash counter, storage
- **Special Considerations**: Product display, customer seating

#### **Factories:**
- **Focus Areas**: Production efficiency, worker safety, quality
- **Key Factors**: Machinery placement, raw material storage
- **Special Considerations**: Worker rest areas, office sections

### **3. Advanced Vastu Calculations**

#### **Color Recommendations by Direction:**
```javascript
Direction-Based Colors:
North: Light Blue, Green, White (Career & opportunities)
South: Red, Orange, Pink (Fame & recognition)  
East: Green, Light Blue, White (Health & new beginnings)
West: White, Yellow, Silver (Stability & gains)
Northeast: White, Light Yellow, Light Blue (Spiritual growth)
Northwest: White, Cream, Light Gray (Relationships)
Southeast: Orange, Red, Pink (Energy & appetite)
Southwest: Yellow, Beige, Brown (Stability & grounding)
```

#### **Auspicious Timing Calculations:**
```javascript
Activity-Based Timing:
Construction Start: Tuesday, Thursday, Sunday
Housewarming: Thursday, Friday, Sunday
Office Opening: Wednesday, Thursday, Friday
Renovation: Tuesday, Saturday
Property Purchase: Thursday, Friday

Favorable Months:
Most Activities: March, April, May, November, December
Avoid: Monsoon months for construction
```

#### **Room-Specific Detailed Guidance:**
```javascript
Bedroom Vastu:
- Ideal Direction: Southwest
- Bed Placement: Head towards South/East
- Colors: Soft Pink, Light Blue, Cream
- Avoid: Mirrors facing bed, electronic devices
- Enhance: Pair decorations, soft lighting

Kitchen Vastu:
- Ideal Direction: Southeast (Agni corner)
- Cooking Direction: Face East while cooking
- Colors: Yellow, Orange, Red
- Avoid: Kitchen above/below bedroom
- Enhance: Good ventilation, bright lighting
```

---

## **🎯 API Endpoints & Features**

### **1. Comprehensive Property Analysis**
```
POST /api/calculators/vastu/comprehensive-analysis
```

**Input:**
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
    "slope": "northeast",
    "surroundings": ["temple", "water body"]
  }
}
```

**Output:**
```json
{
  "success": true,
  "overallScore": 85,
  "compliance": "Excellent",
  "recommendations": [
    "✓ Main entrance in Northeast is ideal for North facing property",
    "✓ Kitchen in Southeast is well-placed according to Vastu",
    "✓ Square plot shape is excellent for Vastu compliance"
  ],
  "detailedAnalysis": {
    "entrance": { "score": 25, "recommendations": [...] },
    "rooms": { "score": 40, "recommendations": [...] },
    "plot": { "score": 20, "recommendations": [...] }
  },
  "propertySpecificGuidance": [
    "Main door should be larger than other doors",
    "Bedroom in southwest brings stability"
  ]
}
```

### **2. Plot Selection Analysis**
```
POST /api/calculators/vastu/plot-analysis
```

**Input:**
```json
{
  "shape": "square",
  "size": "1000 sq ft",
  "roadDirection": "north",
  "surroundings": ["temple", "water body"]
}
```

### **3. Color Recommendations**
```
POST /api/calculators/vastu/color-recommendations
```

**Input:**
```json
{
  "roomType": "bedroom",
  "direction": "southwest"
}
```

### **4. Auspicious Timing**
```
POST /api/calculators/vastu/auspicious-timing
```

**Input:**
```json
{
  "activity": "housewarming",
  "currentDate": "2024-09-19"
}
```

### **5. Room-Specific Guidance**
```
POST /api/calculators/vastu/room-specific-guidance
```

**Input:**
```json
{
  "roomType": "kitchen"
}
```

---

## **🔢 Scoring System**

### **Overall Compliance Score (0-100)**
- **90-100**: Exceptional Vastu compliance
- **80-89**: Excellent compliance  
- **70-79**: Good compliance
- **60-69**: Average compliance
- **50-59**: Needs improvement
- **Below 50**: Significant corrections needed

### **Component Scoring:**
- **Main Entrance**: 0-25 points
- **Room Placements**: 0-70 points (7 rooms × 10 points max)
- **Plot Characteristics**: 0-30 points
- **Bonus Points**: Positive surroundings (+15 max)
- **Penalty Points**: Negative surroundings (-15 max)

---

## **🌟 Advanced Features**

### **1. Property Type Optimization**
Each property type gets customized analysis:

**Residential Focus:**
- Family harmony and health
- Children's education areas
- Elderly comfort zones
- Wealth accumulation areas

**Commercial Focus:**
- Customer attraction zones
- Business growth areas  
- Employee productivity
- Profit maximization

### **2. Directional Energy Analysis**
```javascript
8-Direction Energy Map:
North (Kubera): Wealth, career opportunities
Northeast (Ishaan): Spirituality, knowledge, water
East (Indra): Health, new beginnings, sunrise energy
Southeast (Agni): Fire element, kitchen, energy
South (Yama): Fame, recognition, fire element  
Southwest (Nairitya): Stability, relationships, earth
West (Varuna): Gains, profits, water element
Northwest (Vayu): Air element, movement, support
```

### **3. Remedial Measures**
For each identified issue, the system provides:

**Immediate Remedies:**
- Color corrections
- Furniture rearrangement  
- Lighting improvements
- Plant placements

**Structural Remedies:**
- Room relocations
- Entrance modifications
- Slope corrections
- Boundary adjustments

**Spiritual Remedies:**
- Yantra placements
- Crystal positioning
- Mirror corrections
- Energy cleansing

---

## **📈 Practical Applications**

### **Use Case 1: New Home Purchase**
- **Input**: Plot details, house layout, surroundings
- **Analysis**: Complete compliance check
- **Output**: Purchase recommendation with score

### **Use Case 2: Office Setup**
- **Input**: Office layout, desk positions, meeting rooms
- **Analysis**: Productivity optimization
- **Output**: Arrangement suggestions for success

### **Use Case 3: Business Location**
- **Input**: Shop layout, entrance, display areas
- **Analysis**: Customer flow and sales optimization
- **Output**: Layout recommendations for profit

### **Use Case 4: Renovation Planning**
- **Input**: Current layout issues, desired changes
- **Analysis**: Improvement priorities
- **Output**: Phased renovation plan with timing

---

## **🎯 Unique Features**

### **1. Multi-Property Support**
- Residential homes
- Commercial buildings
- Office spaces  
- Retail shops
- Industrial facilities

### **2. Comprehensive Analysis**
- Entrance optimization
- Room placement scoring
- Plot suitability assessment
- Color recommendations
- Timing calculations

### **3. Practical Remedies**
- Immediate improvements
- Structural modifications
- Spiritual enhancements
- Cost-effective solutions

### **4. Scientific Approach**
- Traditional Vastu principles
- Modern architectural considerations
- Energy flow optimization
- Practical implementation

This comprehensive Vastu system ensures that every aspect of a property is analyzed according to ancient wisdom while providing practical, actionable recommendations for modern living and working spaces.
