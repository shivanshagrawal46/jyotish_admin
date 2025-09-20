# Frontend Developer Calculator Guide

## 🎯 **Complete Calculator API Documentation**

This is the definitive guide for frontend developers to integrate all calculator APIs with exact parameters, responses, and implementation examples.

---

## 🌐 **Base Configuration**

### **Base URL:**
```javascript
const BASE_URL = 'https://www.jyotishvishwakosh.in/api';
```

### **Headers:**
```javascript
const headers = {
  'Content-Type': 'application/json'
};
```

---

## 📊 **NUMEROLOGY CALCULATORS**

### **1. Bhagyank (Destiny Number) Calculator**

#### **Endpoint:**
```
POST https://www.jyotishvishwakosh.in/api/calculators/numerology/bhagyank
```

#### **Parameters:**
```json
{
  "dateOfBirth": "1990-08-15"
}
```

#### **Response:**
```json
{
  "success": true,
  "bhagyank": 7,
  "description": "Your Bhagyank (Destiny Number) is 7",
  "meaning": "Spirituality, introspection, analysis. You seek deeper understanding.",
  "dateOfBirth": "1990-08-15"
}
```

#### **Frontend Implementation:**
```javascript
// JavaScript/React
const calculateBhagyank = async (dateOfBirth) => {
  try {
    const response = await fetch(`${BASE_URL}/calculators/numerology/bhagyank`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ dateOfBirth })
    });
    
    const data = await response.json();
    if (data.success) {
      return data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Bhagyank calculation error:', error);
    throw error;
  }
};
```

```dart
// Flutter/Dart
class NumerologyService {
  static const String baseUrl = 'https://www.jyotishvishwakosh.in/api/calculators/numerology';
  
  static Future<BhagyankModel> calculateBhagyank(String dateOfBirth) async {
    final response = await http.post(
      Uri.parse('$baseUrl/bhagyank'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'dateOfBirth': dateOfBirth}),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return BhagyankModel.fromJson(data);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['error']);
    }
  }
}
```

### **2. Mulank (Root Number) Calculator**

#### **Endpoint:**
```
POST https://www.jyotishvishwakosh.in/api/calculators/numerology/mulank
```

#### **Parameters:**
```json
{
  "dateOfBirth": "1990-08-15"
}
```

#### **Response:**
```json
{
  "success": true,
  "mulank": 6,
  "description": "Your Mulank (Root Number) is 6",
  "meaning": "Caring, responsible, family-oriented. You naturally nurture others.",
  "dateOfBirth": "1990-08-15"
}
```

### **3. Name Numerology Calculator**

#### **Endpoint:**
```
POST https://www.jyotishvishwakosh.in/api/calculators/numerology/name
```

#### **Parameters:**
```json
{
  "fullName": "Rajesh Kumar Sharma"
}
```

#### **Response:**
```json
{
  "success": true,
  "nameNumber": 8,
  "description": "Your Name Number is 8",
  "meaning": "You project success and authority. Others see you as powerful.",
  "fullName": "Rajesh Kumar Sharma"
}
```

### **4. Lo Shu Grid Calculator**

#### **Endpoint:**
```
POST https://www.jyotishvishwakosh.in/api/calculators/numerology/loshu-grid
```

#### **Parameters:**
```json
{
  "dateOfBirth": "1990-08-15"
}
```

#### **Response:**
```json
{
  "success": true,
  "grid": {
    "1": 1, "2": 0, "3": 0,
    "4": 0, "5": 1, "6": 0,
    "7": 0, "8": 1, "9": 2
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
    ["-", "9", "-"],
    ["-", "5", "-"], 
    ["8", "1", "-"]
  ]
}
```

### **5. Complete Numerology Report (ENHANCED)**

#### **Endpoint:**
```
POST https://www.jyotishvishwakosh.in/api/calculators/numerology/complete-report
```

#### **Parameters:**
```json
{
  "fullName": "Rajesh Kumar Sharma",
  "dateOfBirth": "1990-08-15"
}
```

#### **Enhanced Response:**
```json
{
  "success": true,
  "personalDetails": {
    "fullName": "Rajesh Kumar Sharma",
    "dateOfBirth": "1990-08-15",
    "age": 34
  },
  "numerologyReport": {
    "bhagyank": {
      "number": 7,
      "meaning": "Spirituality, introspection, analysis...",
      "lifeImpact": "Your path leads to spiritual wisdom..."
    },
    "mulank": {
      "number": 6,
      "meaning": "Caring, responsible, family-oriented...",
      "personalityGifts": "Your nurturing heart..."
    },
    "nameNumber": {
      "number": 8,
      "meaning": "You project success and authority...",
      "publicImage": "Your name projects success..."
    },
    "loShuGrid": {
      "grid": {...},
      "analysis": {...},
      "hiddenTalents": [...],
      "strengthAreas": [...]
    }
  },
  "enhancedInsights": {
    "personalityProfile": {
      "coreEssence": "You possess deep spiritual wisdom...",
      "uniqueGifts": [...],
      "naturalMagnetism": "Your name projects success...",
      "specialQualities": [...]
    },
    "careerInsights": {
      "naturalCareerPath": "Your analytical and spiritual gifts...",
      "hiddenTalents": [...],
      "careerBreakthroughs": [
        "Between ages 31 and 34, a major opportunity will transform your career trajectory"
      ],
      "leadershipStyle": "Your thoughtful, analytical leadership...",
      "businessPotential": "Your numerological combination shows..."
    },
    "relationshipInsights": {
      "loveStyle": "You love with depth and understanding...",
      "idealPartner": {
        "numbers": [7],
        "characteristics": ["wise, spiritual, and intellectually deep"],
        "compatibility": "Your ideal partner will be..."
      },
      "marriageHappiness": "Your marriage will be blessed...",
      "relationshipTiming": {
        "bestAges": ["28-35 years"],
        "meetingCircumstances": "Through intellectual or spiritual connections"
      }
    },
    "amazingPredictions": [
      "Your 7 life path is leading you toward extraordinary achievements...",
      "Your natural 6 personality will attract a career opportunity...",
      "The first letter 'R' of your name carries special vibrations..."
    ]
  },
  "compatibility": {
    "isHarmonious": true,
    "compatibilityScore": 85,
    "analysis": "Your numbers are in perfect harmony...",
    "positiveOutlook": "This number combination is specially designed..."
  }
}
```

---

## 🔮 **JYOTISH CALCULATORS**

### **1. Location Search (NEW REQUIREMENT)**

#### **Search Cities:**
```
GET https://www.jyotishvishwakosh.in/api/locations/search?query=mumbai&limit=10
```

#### **Response:**
```json
{
  "success": true,
  "results": [
    {
      "id": 1,
      "name": "Mumbai",
      "state": "Maharashtra",
      "displayName": "Mumbai, Maharashtra",
      "coordinates": {
        "latitude": 19.0760,
        "longitude": 72.8777
      },
      "timezone": "Asia/Kolkata"
    }
  ],
  "count": 1,
  "query": "mumbai"
}
```

#### **Popular Cities:**
```
GET https://www.jyotishvishwakosh.in/api/locations/popular
```

#### **Frontend Implementation:**
```javascript
// JavaScript/React
const searchCities = async (query) => {
  const response = await fetch(`${BASE_URL}/locations/search?query=${query}&limit=10`);
  const data = await response.json();
  return data.results;
};

const getPopularCities = async () => {
  const response = await fetch(`${BASE_URL}/locations/popular`);
  const data = await response.json();
  return data.cities;
};
```

```dart
// Flutter/Dart
class LocationService {
  static const String baseUrl = 'https://www.jyotishvishwakosh.in/api/locations';
  
  static Future<List<LocationModel>> searchCities(String query) async {
    final response = await http.get(
      Uri.parse('$baseUrl/search?query=$query&limit=10'),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return (data['results'] as List)
          .map((city) => LocationModel.fromJson(city))
          .toList();
    }
    throw Exception('Failed to search cities');
  }
}
```

### **2. Comprehensive Jyotish Chart (ENHANCED)**

#### **Endpoint:**
```
POST https://www.jyotishvishwakosh.in/api/calculators/jyotish/comprehensive-chart
```

#### **Parameters:**
```json
{
  "dateOfBirth": "1990-08-15",
  "timeOfBirth": "14:30",
  "locationId": 1,
  "fullName": "Rajesh Kumar Sharma"
}
```

#### **Enhanced Response Structure:**
```json
{
  "success": true,
  "birthDetails": {
    "date": "1990-08-15",
    "time": "14:30",
    "coordinates": {
      "latitude": 19.0760,
      "longitude": 72.8777
    },
    "name": "Rajesh Kumar Sharma"
  },
  "location": {
    "id": 1,
    "name": "Mumbai",
    "state": "Maharashtra",
    "displayName": "Mumbai, Maharashtra"
  },
  "ascendant": {
    "sign": "Sagittarius",
    "degree": "15.45"
  },
  "planets": {
    "Sun": {
      "longitude": 148.25,
      "sign": "Leo",
      "degree": "28.25",
      "nakshatra": {
        "name": "Uttara Phalguni",
        "number": 12,
        "pada": 4
      },
      "house": 9,
      "strength": 85,
      "retrograde": false,
      "aspects": [...],
      "conjunctions": [...]
    }
    // ... all 9 planets with complete data
  },
  "houseAnalysis": {
    "1": {
      "name": "Tanu Bhava (Self)",
      "significator": "Sun",
      "bodyParts": ["Head", "Brain", "Face"],
      "lifeAreas": ["Personality", "Physical appearance", "Health"],
      "planets": [...],
      "analysis": {
        "summary": "Jupiter in 1st house brings wisdom and optimistic personality",
        "details": [...],
        "recommendations": [...]
      },
      "predictions": {
        "immediate": [...],
        "shortTerm": [...],
        "longTerm": [...]
      },
      "strength": 78,
      "isEmpty": false
    }
    // ... all 12 houses with complete analysis
  },
  "predictions": {
    "careerAnalysis": {
      "overallCareerProfile": "Your soul's deepest career calling is revealed through Jupiter as your Atmakaraka...",
      "naturalTalents": [...],
      "careerFields": {
        "primary": ["Education & Teaching", "Legal Practice", "Banking & Finance"],
        "secondary": ["Financial Advisory", "Judicial Services"]
      },
      "careerBreakthroughs": [
        "Between ages 31 and 34, a major opportunity will transform your career trajectory"
      ],
      "leadershipStyle": "Your thoughtful, analytical leadership provides deep insights...",
      "businessPotential": "Your chart shows potential for both paths...",
      "specificPredictions": [
        "You're destined for a position where you'll be recognized as an authority figure",
        "Your career will involve teaching, guiding, or advising others"
      ]
    },
    "marriageAnalysis": {
      "marriageProspects": {
        "likelihood": "Excellent (88%) - Marriage is highly likely with exceptional happiness",
        "timing": {
          "bestPeriods": [...],
          "ageRange": "25-32 years",
          "specificYears": [
            {
              "year": 2025,
              "probability": 75,
              "reason": "Jupiter favorable year for partnerships"
            }
          ]
        },
        "meetingStory": "Your destined meeting will unfold at an educational or spiritual setting..."
      },
      "spouseCharacteristics": {
        "physicalAppearance": {
          "height": "Above average to tall height with impressive presence",
          "complexion": "Fair to wheatish complexion with healthy glow",
          "features": "Very attractive facial features with charming smile",
          "attractiveness": "Highly attractive with natural magnetism and charm"
        },
        "personality": {
          "nature": "Wise, spiritual, and generous with philosophical nature",
          "intelligence": "Highly intelligent with excellent analytical skills",
          "interests": ["Spirituality and philosophy", "Education and learning"],
          "strengths": ["Wisdom and good judgment", "Generous and kind-hearted nature"]
        },
        "background": {
          "family": "Well-educated, spiritual family with strong values",
          "education": "Higher education, possibly in philosophy, law, or teaching",
          "profession": ["Education", "Law", "Counseling", "Spiritual services"]
        }
      },
      "amazingPredictions": [
        "Your life partner will enter your life when you least expect it",
        "The person you'll marry will have a significant impact on your career",
        "Your marriage will be blessed with genuine love and romance"
      ]
    }
  },
  "nameAnalysis": {
    "nameNumber": 8,
    "overallScore": 85,
    "nakshatraCompatibility": {
      "isCompatible": true,
      "analysis": "Your name resonates well with your birth star"
    },
    "recommendations": [
      "Your name is in perfect harmony with your birth chart"
    ]
  },
  "remedies": {
    "gemstones": ["Yellow Sapphire", "Pearl"],
    "mantras": [...],
    "colors": ["Yellow", "White", "Cream"],
    "charitable": [...]
  }
}
```

#### **Frontend Implementation:**
```javascript
// JavaScript/React
const getJyotishChart = async (formData) => {
  try {
    const response = await fetch(`${BASE_URL}/calculators/jyotish/comprehensive-chart`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        dateOfBirth: formData.dateOfBirth,
        timeOfBirth: formData.timeOfBirth,
        locationId: formData.selectedLocation.id,  // ✅ Use location ID
        fullName: formData.fullName
      })
    });
    
    const data = await response.json();
    if (data.success) {
      return data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Jyotish chart error:', error);
    throw error;
  }
};
```

```dart
// Flutter/Dart
static Future<JyotishChartModel> getComprehensiveChart({
  required String dateOfBirth,
  required String timeOfBirth,
  required int locationId,  // ✅ Location ID required
  String? fullName,
}) async {
  final response = await http.post(
    Uri.parse('$baseUrl/jyotish/comprehensive-chart'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'dateOfBirth': dateOfBirth,
      'timeOfBirth': timeOfBirth,
      'locationId': locationId,
      'fullName': fullName,
    }),
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return JyotishChartModel.fromJson(data);
  } else {
    final error = jsonDecode(response.body);
    throw Exception(error['error']);
  }
}
```

---

## 🏠 **VASTU CALCULATORS**

### **1. Comprehensive Vastu Analysis**

#### **Endpoint:**
```
POST https://www.jyotishvishwakosh.in/api/calculators/vastu/comprehensive-analysis
```

#### **Parameters:**
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

#### **Response:**
```json
{
  "success": true,
  "overallScore": 85,
  "compliance": "Excellent",
  "recommendations": [
    "✓ Main entrance in Northeast is ideal for North facing property",
    "✓ Kitchen in Southeast is well-placed according to Vastu"
  ],
  "propertySpecificGuidance": [...],
  "vastuTips": [...]
}
```

### **2. Room-Specific Guidance**

#### **Endpoint:**
```
POST https://www.jyotishvishwakosh.in/api/calculators/vastu/room-specific-guidance
```

#### **Parameters:**
```json
{
  "roomType": "kitchen"
}
```

#### **Response:**
```json
{
  "success": true,
  "roomGuidance": {
    "idealDirection": "Southeast",
    "colors": ["Yellow", "Orange", "Red"],
    "avoid": ["Kitchen above/below bedroom"],
    "enhance": ["Good ventilation", "Bright lighting"],
    "tips": [...]
  }
}
```

---

## 📱 **Complete Frontend Integration Examples**

### **React.js Complete Example:**

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = 'https://www.jyotishvishwakosh.in/api';

// Location Search Component
const LocationSearch = ({ onLocationSelect }) => {
  const [query, setQuery] = useState('');
  const [cities, setCities] = useState([]);
  const [popularCities, setPopularCities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPopularCities();
  }, []);

  const loadPopularCities = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/locations/popular`);
      setPopularCities(response.data.cities);
    } catch (error) {
      console.error('Error loading popular cities:', error);
    }
  };

  const searchCities = async (searchQuery) => {
    if (searchQuery.length < 2) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/locations/search?query=${searchQuery}&limit=10`);
      setCities(response.data.results);
    } catch (error) {
      console.error('Error searching cities:', error);
    }
    setLoading(false);
  };

  return (
    <div className="location-search">
      <label>Birth Place *</label>
      <input
        type="text"
        placeholder="Search for your birth city..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          searchCities(e.target.value);
        }}
      />
      
      {loading && <div>Searching...</div>}
      
      {query.length >= 2 && cities.length > 0 && (
        <div className="search-results">
          {cities.map(city => (
            <div 
              key={city.id} 
              className="city-item"
              onClick={() => onLocationSelect(city)}
            >
              {city.displayName}
            </div>
          ))}
        </div>
      )}
      
      {query.length === 0 && (
        <div className="popular-cities">
          <h4>Popular Cities:</h4>
          <div className="city-chips">
            {popularCities.slice(0, 8).map(city => (
              <button 
                key={city.id}
                className="city-chip"
                onClick={() => onLocationSelect(city)}
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Main Jyotish Calculator Component
const JyotishCalculator = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    timeOfBirth: '',
    selectedLocation: null
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateChart = async () => {
    if (!formData.dateOfBirth || !formData.timeOfBirth || !formData.selectedLocation) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/calculators/jyotish/comprehensive-chart`, {
        dateOfBirth: formData.dateOfBirth,
        timeOfBirth: formData.timeOfBirth,
        locationId: formData.selectedLocation.id,
        fullName: formData.fullName || null
      });

      setResult(response.data);
    } catch (error) {
      console.error('Error generating chart:', error);
      alert(`Error: ${error.response?.data?.error || error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="jyotish-calculator">
      <h2>Enhanced Jyotish Calculator</h2>
      
      <form onSubmit={(e) => { e.preventDefault(); generateChart(); }}>
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            placeholder="Enter your full name"
          />
        </div>

        <div className="form-group">
          <label>Date of Birth *</label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>Time of Birth *</label>
          <input
            type="time"
            value={formData.timeOfBirth}
            onChange={(e) => setFormData({...formData, timeOfBirth: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <LocationSearch 
            onLocationSelect={(location) => 
              setFormData({...formData, selectedLocation: location})
            }
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Generating Amazing Chart...' : 'Get Comprehensive Analysis'}
        </button>
      </form>

      {result && (
        <div className="chart-results">
          <h3>Your Jyotish Analysis</h3>
          
          {/* Birth Details */}
          <div className="birth-details">
            <h4>Birth Information</h4>
            <p><strong>Name:</strong> {result.birthDetails.name}</p>
            <p><strong>Date:</strong> {result.birthDetails.date}</p>
            <p><strong>Time:</strong> {result.birthDetails.time}</p>
            <p><strong>Place:</strong> {result.location.displayName}</p>
            <p><strong>Ascendant:</strong> {result.ascendant.sign} ({result.ascendant.degree}°)</p>
          </div>

          {/* Career Analysis */}
          <div className="career-analysis">
            <h4>Career Destiny</h4>
            <p>{result.predictions.careerAnalysis.overallCareerProfile}</p>
            
            <h5>Natural Talents:</h5>
            <ul>
              {result.predictions.careerAnalysis.naturalTalents.map((talent, index) => (
                <li key={index}>{talent}</li>
              ))}
            </ul>
            
            <h5>Career Breakthroughs:</h5>
            <ul>
              {result.predictions.careerAnalysis.careerBreakthroughs.map((breakthrough, index) => (
                <li key={index}>{breakthrough}</li>
              ))}
            </ul>
          </div>

          {/* Marriage Analysis */}
          <div className="marriage-analysis">
            <h4>Marriage & Life Partner</h4>
            <p><strong>Marriage Likelihood:</strong> {result.predictions.marriageAnalysis.marriageProspects.likelihood}</p>
            <p><strong>Meeting Story:</strong> {result.predictions.marriageAnalysis.marriageProspects.meetingStory}</p>
            
            <h5>Spouse Characteristics:</h5>
            <p><strong>Appearance:</strong> {result.predictions.marriageAnalysis.spouseCharacteristics.physicalAppearance.height}</p>
            <p><strong>Personality:</strong> {result.predictions.marriageAnalysis.spouseCharacteristics.personality.nature}</p>
            
            <h5>Amazing Predictions:</h5>
            <ul>
              {result.predictions.marriageAnalysis.amazingPredictions.map((prediction, index) => (
                <li key={index}>{prediction}</li>
              ))}
            </ul>
          </div>

          {/* House Analysis */}
          <div className="house-analysis">
            <h4>Planetary Houses</h4>
            {Object.entries(result.houseAnalysis).map(([houseNum, house]) => (
              <div key={houseNum} className="house-item">
                <h5>{houseNum}. {house.name}</h5>
                <p><strong>Life Areas:</strong> {house.lifeAreas.join(', ')}</p>
                {house.planets.length > 0 && (
                  <div>
                    <p><strong>Planets:</strong> {house.planets.map(p => `${p.name} in ${p.sign}`).join(', ')}</p>
                    <p><strong>Analysis:</strong> {house.analysis.summary}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Name Analysis */}
          {result.nameAnalysis && (
            <div className="name-analysis">
              <h4>Name Compatibility</h4>
              <p><strong>Name Number:</strong> {result.nameAnalysis.nameNumber}</p>
              <p><strong>Compatibility Score:</strong> {result.nameAnalysis.overallScore}%</p>
              <p><strong>Analysis:</strong> {result.nameAnalysis.nakshatraCompatibility.analysis}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JyotishCalculator;
```

### **Flutter Complete Example:**

```dart
class JyotishCalculatorPage extends StatefulWidget {
  @override
  _JyotishCalculatorPageState createState() => _JyotishCalculatorPageState();
}

class _JyotishCalculatorPageState extends State<JyotishCalculatorPage> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _dateController = TextEditingController();
  final TextEditingController _timeController = TextEditingController();
  
  LocationModel? _selectedLocation;
  bool _isLoading = false;
  JyotishChartModel? _chartResult;

  Future<void> _generateChart() async {
    if (!_formKey.currentState!.validate() || _selectedLocation == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please fill all required fields and select birth place')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final result = await JyotishService.getComprehensiveChart(
        dateOfBirth: _dateController.text,
        timeOfBirth: _timeController.text,
        locationId: _selectedLocation!.id,
        fullName: _nameController.text.isNotEmpty ? _nameController.text : null,
      );

      setState(() {
        _chartResult = result;
        _isLoading = false;
      });

      // Navigate to results
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => JyotishResultsPage(chartData: result),
        ),
      );
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Jyotish Calculator'),
        backgroundColor: Colors.orange,
      ),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Name field
                TextFormField(
                  controller: _nameController,
                  decoration: InputDecoration(
                    labelText: 'Full Name',
                    hintText: 'Enter your full name',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.person),
                  ),
                ),
                
                SizedBox(height: 16),
                
                // Date field
                TextFormField(
                  controller: _dateController,
                  decoration: InputDecoration(
                    labelText: 'Date of Birth *',
                    hintText: 'YYYY-MM-DD',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.calendar_today),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Date of birth is required';
                    }
                    return null;
                  },
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: DateTime.now().subtract(Duration(days: 365 * 25)),
                      firstDate: DateTime(1900),
                      lastDate: DateTime.now(),
                    );
                    if (date != null) {
                      _dateController.text = 
                          '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
                    }
                  },
                ),
                
                SizedBox(height: 16),
                
                // Time field
                TextFormField(
                  controller: _timeController,
                  decoration: InputDecoration(
                    labelText: 'Time of Birth *',
                    hintText: 'HH:MM (24-hour format)',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.access_time),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Time of birth is required';
                    }
                    return null;
                  },
                  onTap: () async {
                    final time = await showTimePicker(
                      context: context,
                      initialTime: TimeOfDay(hour: 12, minute: 0),
                    );
                    if (time != null) {
                      _timeController.text = 
                          '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
                    }
                  },
                ),
                
                SizedBox(height: 16),
                
                // Location search
                LocationSearchWidget(
                  onLocationSelected: (location) {
                    setState(() {
                      _selectedLocation = location;
                    });
                  },
                ),
                
                SizedBox(height: 24),
                
                // Generate button
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _generateChart,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                    ),
                    child: _isLoading 
                        ? Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              ),
                              SizedBox(width: 10),
                              Text('Generating Amazing Analysis...'),
                            ],
                          )
                        : Text(
                            'Get Comprehensive Chart Analysis',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

### **Vue.js Complete Example:**

```vue
<template>
  <div class="jyotish-calculator">
    <h2>Enhanced Jyotish Calculator</h2>
    
    <form @submit.prevent="generateChart">
      <!-- Name input -->
      <div class="form-group">
        <label>Full Name</label>
        <input 
          v-model="formData.fullName" 
          type="text" 
          placeholder="Enter your full name"
        />
      </div>

      <!-- Date input -->
      <div class="form-group">
        <label>Date of Birth *</label>
        <input 
          v-model="formData.dateOfBirth" 
          type="date" 
          required
        />
      </div>

      <!-- Time input -->
      <div class="form-group">
        <label>Time of Birth *</label>
        <input 
          v-model="formData.timeOfBirth" 
          type="time" 
          required
        />
      </div>

      <!-- Location search -->
      <div class="form-group">
        <label>Birth Place *</label>
        <input 
          v-model="searchQuery"
          @input="searchCities"
          type="text" 
          placeholder="Search for your birth city..."
        />
        
        <!-- Search results -->
        <div v-if="searchResults.length > 0" class="search-results">
          <div 
            v-for="city in searchResults" 
            :key="city.id"
            @click="selectLocation(city)"
            class="city-item"
          >
            {{ city.displayName }}
          </div>
        </div>
        
        <!-- Selected location -->
        <div v-if="formData.selectedLocation" class="selected-location">
          <span>📍 {{ formData.selectedLocation.displayName }}</span>
          <button @click="clearLocation" type="button">✕</button>
        </div>
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Generating Amazing Analysis...' : 'Get Comprehensive Chart' }}
      </button>
    </form>

    <!-- Results -->
    <div v-if="chartResult" class="results">
      <h3>Your Jyotish Destiny</h3>
      
      <!-- Career Analysis -->
      <div class="career-section">
        <h4>🎯 Career Destiny</h4>
        <p>{{ chartResult.predictions.careerAnalysis.overallCareerProfile }}</p>
        
        <h5>Natural Talents:</h5>
        <ul>
          <li v-for="talent in chartResult.predictions.careerAnalysis.naturalTalents" :key="talent">
            {{ talent }}
          </li>
        </ul>
        
        <h5>Career Breakthroughs:</h5>
        <ul>
          <li v-for="breakthrough in chartResult.predictions.careerAnalysis.careerBreakthroughs" :key="breakthrough">
            🌟 {{ breakthrough }}
          </li>
        </ul>
      </div>

      <!-- Marriage Analysis -->
      <div class="marriage-section">
        <h4>💕 Marriage & Life Partner</h4>
        <p><strong>Marriage Likelihood:</strong> {{ chartResult.predictions.marriageAnalysis.marriageProspects.likelihood }}</p>
        <p><strong>Meeting Story:</strong> {{ chartResult.predictions.marriageAnalysis.marriageProspects.meetingStory }}</p>
        
        <h5>Spouse Characteristics:</h5>
        <p><strong>Appearance:</strong> {{ chartResult.predictions.marriageAnalysis.spouseCharacteristics.physicalAppearance.height }}</p>
        <p><strong>Personality:</strong> {{ chartResult.predictions.marriageAnalysis.spouseCharacteristics.personality.nature }}</p>
        
        <h5>Amazing Predictions:</h5>
        <ul>
          <li v-for="prediction in chartResult.predictions.marriageAnalysis.amazingPredictions" :key="prediction">
            ✨ {{ prediction }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      formData: {
        fullName: '',
        dateOfBirth: '',
        timeOfBirth: '',
        selectedLocation: null
      },
      searchQuery: '',
      searchResults: [],
      chartResult: null,
      loading: false
    }
  },
  methods: {
    async searchCities() {
      if (this.searchQuery.length < 2) return;
      
      try {
        const response = await this.$http.get(`/api/locations/search?query=${this.searchQuery}&limit=10`);
        this.searchResults = response.data.results;
      } catch (error) {
        console.error('Search error:', error);
      }
    },
    
    selectLocation(city) {
      this.formData.selectedLocation = city;
      this.searchQuery = '';
      this.searchResults = [];
    },
    
    clearLocation() {
      this.formData.selectedLocation = null;
    },
    
    async generateChart() {
      if (!this.formData.selectedLocation) {
        alert('Please select birth place');
        return;
      }
      
      this.loading = true;
      try {
        const response = await this.$http.post('/api/calculators/jyotish/comprehensive-chart', {
          dateOfBirth: this.formData.dateOfBirth,
          timeOfBirth: this.formData.timeOfBirth,
          locationId: this.formData.selectedLocation.id,
          fullName: this.formData.fullName || null
        });
        
        this.chartResult = response.data;
      } catch (error) {
        console.error('Chart generation error:', error);
        alert(`Error: ${error.response?.data?.error || error.message}`);
      }
      this.loading = false;
    }
  }
}
</script>
```

---

## ⚠️ **Error Handling Guide**

### **Common Errors & Solutions:**

#### **400 Error - Missing Location ID:**
```json
{
  "error": "Date of birth, time of birth, and location ID are required. Use /api/locations/search to find location ID."
}
```
**Solution:** Ensure user selects a location from search results.

#### **400 Error - Invalid Location ID:**
```json
{
  "error": "Invalid location ID. Use /api/locations/search to find valid location IDs."
}
```
**Solution:** Use location ID from the search API response.

#### **Frontend Error Handling:**
```javascript
// JavaScript
try {
  const chart = await getJyotishChart(formData);
  // Handle success
} catch (error) {
  if (error.message.includes('location ID')) {
    // Show location selection error
    showError('Please select a valid birth place from the search results.');
  } else {
    // Show general error
    showError(`Error: ${error.message}`);
  }
}
```

```dart
// Flutter
try {
  final chart = await JyotishService.getComprehensiveChart(...);
  // Handle success
} catch (e) {
  String errorMessage = e.toString();
  if (errorMessage.contains('location ID')) {
    errorMessage = 'Please select a valid birth place from the search results.';
  }
  
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(errorMessage)),
  );
}
```

---

## 🎯 **Quick Migration Checklist**

### **✅ Required Changes:**
- [ ] Update base URL to `https://www.jyotishvishwakosh.in/api`
- [ ] Change endpoint from `basic-chart` to `comprehensive-chart`
- [ ] Replace `placeOfBirth` string with `locationId` integer
- [ ] Add location search functionality using `/api/locations/search`
- [ ] Update response models for enhanced data structure
- [ ] Handle new detailed predictions in UI

### **✅ Optional Enhancements:**
- [ ] Add location caching for better performance
- [ ] Implement location favorites
- [ ] Create beautiful UI for enhanced predictions
- [ ] Add sharing functionality for amazing predictions

---

## 🌟 **Benefits for Frontend**

### **Enhanced User Experience:**
- **Easy Location Selection**: Search and select instead of typing
- **Amazing Predictions**: Deep career and marriage insights
- **Rich Data**: House-by-house planetary analysis
- **Personalized Content**: Name compatibility integration

### **Developer Benefits:**
- **Structured Data**: Well-organized response format
- **Error Handling**: Clear error messages with solutions
- **Scalable**: Easy to add more calculator features
- **Documentation**: Complete examples and guides

This enhanced calculator system will deliver **incredibly accurate and amazing predictions** that will absolutely astound your users! 🚀✨

**Base URL**: `https://www.jyotishvishwakosh.in/api` - Ready for production!
