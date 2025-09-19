# Flutter App API Changes Guide - Jyotish Calculator

## 🚨 **IMPORTANT: API Changes Required in Flutter App**

I've enhanced the Jyotish calculator with amazing new features, but this requires some changes in your Flutter frontend code.

---

## 📱 **Base URL Update**

### **New Base URL:**
```dart
static const String baseUrl = 'https://www.jyotishvishwakosh.in/api';
```

---

## 🔄 **API Endpoint Changes**

### **BEFORE (Old API):**
```dart
// Old endpoint - may not work with enhanced features
POST /api/calculators/jyotish/basic-chart

// Old parameters
{
  "dateOfBirth": "1990-08-15",
  "timeOfBirth": "14:30", 
  "placeOfBirth": "Mumbai, India",  // ❌ String place
  "fullName": "Rajesh Kumar"
}
```

### **AFTER (New Enhanced API):**
```dart
// New enhanced endpoint with amazing predictions
POST /api/calculators/jyotish/comprehensive-chart

// New parameters - LOCATION ID REQUIRED
{
  "dateOfBirth": "1990-08-15",
  "timeOfBirth": "14:30",
  "locationId": 1,                  // ✅ Location ID from search
  "fullName": "Rajesh Kumar"
}
```

---

## 🏙️ **Location Selection Flow (NEW REQUIREMENT)**

### **Step 1: Add Location Search in Flutter**

#### **Location Search API:**
```dart
class LocationService {
  static const String baseUrl = 'https://www.jyotishvishwakosh.in/api/locations';
  
  // Search cities
  static Future<List<LocationModel>> searchCities(String query) async {
    final response = await http.get(
      Uri.parse('$baseUrl/search?query=$query&limit=10'),
      headers: {'Content-Type': 'application/json'},
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return (data['results'] as List)
          .map((city) => LocationModel.fromJson(city))
          .toList();
    }
    throw Exception('Failed to search cities');
  }
  
  // Get popular cities
  static Future<List<LocationModel>> getPopularCities() async {
    final response = await http.get(
      Uri.parse('$baseUrl/popular'),
      headers: {'Content-Type': 'application/json'},
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return (data['cities'] as List)
          .map((city) => LocationModel.fromJson(city))
          .toList();
    }
    throw Exception('Failed to get popular cities');
  }
}
```

#### **Location Model:**
```dart
class LocationModel {
  final int id;
  final String name;
  final String state;
  final String displayName;
  final double latitude;
  final double longitude;
  final String timezone;
  
  LocationModel({
    required this.id,
    required this.name,
    required this.state,
    required this.displayName,
    required this.latitude,
    required this.longitude,
    required this.timezone,
  });
  
  factory LocationModel.fromJson(Map<String, dynamic> json) {
    return LocationModel(
      id: json['id'],
      name: json['name'],
      state: json['state'],
      displayName: json['displayName'],
      latitude: json['coordinates']['latitude'],
      longitude: json['coordinates']['longitude'],
      timezone: json['timezone'],
    );
  }
}
```

### **Step 2: Update Jyotish Service**

#### **OLD Jyotish Service:**
```dart
// ❌ OLD - Remove this
class JyotishService {
  static Future<Map<String, dynamic>> getBasicChart({
    required String dateOfBirth,
    required String timeOfBirth,
    required String placeOfBirth,  // String place
    String? fullName,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/calculators/jyotish/basic-chart'),  // Old endpoint
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'dateOfBirth': dateOfBirth,
        'timeOfBirth': timeOfBirth,
        'placeOfBirth': placeOfBirth,
        'fullName': fullName,
      }),
    );
    
    return jsonDecode(response.body);
  }
}
```

#### **NEW Enhanced Jyotish Service:**
```dart
// ✅ NEW - Use this enhanced version
class JyotishService {
  static const String baseUrl = 'https://www.jyotishvishwakosh.in/api/calculators';
  
  static Future<Map<String, dynamic>> getComprehensiveChart({
    required String dateOfBirth,
    required String timeOfBirth,
    required int locationId,        // ✅ Location ID instead of string
    String? fullName,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/jyotish/comprehensive-chart'),  // ✅ New enhanced endpoint
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'dateOfBirth': dateOfBirth,
        'timeOfBirth': timeOfBirth,
        'locationId': locationId,    // ✅ Send location ID
        'fullName': fullName,
      }),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Failed to generate chart');
    }
  }
}
```

---

## 📱 **Flutter UI Changes Required**

### **Step 1: Add Location Search Widget**

```dart
class LocationSearchWidget extends StatefulWidget {
  final Function(LocationModel) onLocationSelected;
  
  const LocationSearchWidget({Key? key, required this.onLocationSelected}) : super(key: key);
  
  @override
  _LocationSearchWidgetState createState() => _LocationSearchWidgetState();
}

class _LocationSearchWidgetState extends State<LocationSearchWidget> {
  final TextEditingController _searchController = TextEditingController();
  List<LocationModel> _searchResults = [];
  List<LocationModel> _popularCities = [];
  bool _isLoading = false;
  LocationModel? _selectedLocation;
  
  @override
  void initState() {
    super.initState();
    _loadPopularCities();
  }
  
  _loadPopularCities() async {
    try {
      final cities = await LocationService.getPopularCities();
      setState(() {
        _popularCities = cities;
      });
    } catch (e) {
      print('Error loading popular cities: $e');
    }
  }
  
  _searchCities(String query) async {
    if (query.length < 2) return;
    
    setState(() {
      _isLoading = true;
    });
    
    try {
      final results = await LocationService.searchCities(query);
      setState(() {
        _searchResults = results;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      print('Error searching cities: $e');
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Birth Place *', style: TextStyle(fontWeight: FontWeight.bold)),
        SizedBox(height: 8),
        
        // Search field
        TextField(
          controller: _searchController,
          decoration: InputDecoration(
            hintText: 'Search for your birth city...',
            prefixIcon: Icon(Icons.search),
            border: OutlineInputBorder(),
          ),
          onChanged: _searchCities,
        ),
        
        SizedBox(height: 8),
        
        // Selected location display
        if (_selectedLocation != null)
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.green.shade50,
              border: Border.all(color: Colors.green),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(Icons.location_on, color: Colors.green),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _selectedLocation!.displayName,
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.clear),
                  onPressed: () {
                    setState(() {
                      _selectedLocation = null;
                    });
                  },
                ),
              ],
            ),
          ),
        
        SizedBox(height: 8),
        
        // Search results or popular cities
        if (_isLoading)
          Center(child: CircularProgressIndicator())
        else if (_searchController.text.isNotEmpty && _searchResults.isNotEmpty)
          Container(
            height: 200,
            child: ListView.builder(
              itemCount: _searchResults.length,
              itemBuilder: (context, index) {
                final city = _searchResults[index];
                return ListTile(
                  title: Text(city.name),
                  subtitle: Text(city.state),
                  onTap: () {
                    setState(() {
                      _selectedLocation = city;
                      _searchController.clear();
                      _searchResults.clear();
                    });
                    widget.onLocationSelected(city);
                  },
                );
              },
            ),
          )
        else if (_searchController.text.isEmpty && _popularCities.isNotEmpty)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Popular Cities:', style: TextStyle(fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: _popularCities.take(8).map((city) => 
                  ActionChip(
                    label: Text(city.name),
                    onPressed: () {
                      setState(() {
                        _selectedLocation = city;
                      });
                      widget.onLocationSelected(city);
                    },
                  ),
                ).toList(),
              ),
            ],
          ),
      ],
    );
  }
}
```

### **Step 2: Update Jyotish Form**

```dart
class JyotishFormWidget extends StatefulWidget {
  @override
  _JyotishFormWidgetState createState() => _JyotishFormWidgetState();
}

class _JyotishFormWidgetState extends State<JyotishFormWidget> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _dateController = TextEditingController();
  final TextEditingController _timeController = TextEditingController();
  
  LocationModel? _selectedLocation;  // ✅ NEW - Store selected location
  bool _isLoading = false;
  Map<String, dynamic>? _chartResult;
  
  _generateChart() async {
    if (!_formKey.currentState!.validate() || _selectedLocation == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please fill all fields and select birth place')),
      );
      return;
    }
    
    setState(() {
      _isLoading = true;
    });
    
    try {
      // ✅ NEW API CALL with locationId
      final result = await JyotishService.getComprehensiveChart(
        dateOfBirth: _dateController.text,
        timeOfBirth: _timeController.text,
        locationId: _selectedLocation!.id,  // ✅ Use location ID
        fullName: _nameController.text.isNotEmpty ? _nameController.text : null,
      );
      
      setState(() {
        _chartResult = result;
        _isLoading = false;
      });
      
      // Navigate to results page
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
    return Form(
      key: _formKey,
      child: Column(
        children: [
          // Name field
          TextFormField(
            controller: _nameController,
            decoration: InputDecoration(
              labelText: 'Full Name',
              hintText: 'Enter your full name',
              border: OutlineInputBorder(),
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
              suffixIcon: Icon(Icons.calendar_today),
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
                _dateController.text = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
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
              suffixIcon: Icon(Icons.access_time),
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
                _timeController.text = '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
              }
            },
          ),
          
          SizedBox(height: 16),
          
          // ✅ NEW - Location search widget
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
              child: _isLoading 
                ? CircularProgressIndicator(color: Colors.white)
                : Text('Generate Amazing Chart Analysis'),
            ),
          ),
        ],
      ),
    );
  }
}
```

---

## 📊 **Response Structure Changes**

### **BEFORE (Old Response):**
```dart
// Old simple response
{
  "success": true,
  "sunSign": "Leo",
  "lifePathNumber": 7,
  "basicPredictions": {...}
}
```

### **AFTER (New Enhanced Response):**
```dart
// ✅ NEW - Much more detailed response
{
  "success": true,
  "birthDetails": {
    "date": "1990-08-15",
    "time": "14:30",
    "coordinates": {
      "latitude": 19.0760,
      "longitude": 72.8777
    },
    "name": "Rajesh Kumar"
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
      "sign": "Leo",
      "degree": "28.25",
      "house": 9,
      "strength": 85,
      "nakshatra": {
        "name": "Uttara Phalguni",
        "pada": 4
      }
    }
    // ... all 9 planets with detailed info
  },
  "houseAnalysis": {
    "1": {
      "name": "Tanu Bhava (Self)",
      "planets": [...],
      "analysis": {
        "summary": "Jupiter in 1st house brings wisdom...",
        "details": [...],
        "recommendations": [...]
      },
      "predictions": {
        "immediate": [...],
        "shortTerm": [...], 
        "longTerm": [...]
      }
    }
    // ... all 12 houses with detailed analysis
  },
  "predictions": {
    "careerAnalysis": {
      "overallCareerProfile": "Your soul's deepest career calling...",
      "naturalTalents": [...],
      "careerFields": {
        "primary": [...],
        "secondary": [...]
      },
      "careerBreakthroughs": [...],
      "businessVsJob": {...},
      "specificPredictions": [...]
    },
    "marriageAnalysis": {
      "marriageProspects": {
        "likelihood": "Excellent (88%)",
        "timing": {
          "bestPeriods": [...],
          "ageRange": "25-32 years",
          "specificYears": [...]
        },
        "meetingStory": "Your destined meeting will unfold..."
      },
      "spouseCharacteristics": {
        "physicalAppearance": {
          "height": "Above average to tall...",
          "complexion": "Fair to wheatish...",
          "features": "Very attractive facial features..."
        },
        "personality": {
          "nature": "Wise, spiritual, and generous...",
          "intelligence": "Highly intelligent...",
          "interests": [...]
        }
      },
      "amazingPredictions": [...]
    }
  },
  "nameAnalysis": {
    "nameNumber": 8,
    "overallScore": 85,
    "nakshatraCompatibility": {...},
    "recommendations": [...]
  }
}
```

---

## 🔄 **Required Flutter Code Updates**

### **1. Update API Service Class:**

```dart
// ✅ NEW - Complete updated service
class JyotishApiService {
  static const String baseUrl = 'https://www.jyotishvishwakosh.in/api';
  
  // Location services
  static Future<List<LocationModel>> searchCities(String query) async {
    final response = await http.get(
      Uri.parse('$baseUrl/locations/search?query=$query&limit=10'),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return (data['results'] as List)
          .map((city) => LocationModel.fromJson(city))
          .toList();
    }
    throw Exception('Failed to search cities');
  }
  
  static Future<List<LocationModel>> getPopularCities() async {
    final response = await http.get(
      Uri.parse('$baseUrl/locations/popular'),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return (data['cities'] as List)
          .map((city) => LocationModel.fromJson(city))
          .toList();
    }
    throw Exception('Failed to get popular cities');
  }
  
  // Enhanced Jyotish service
  static Future<JyotishChartModel> getComprehensiveChart({
    required String dateOfBirth,
    required String timeOfBirth,
    required int locationId,
    String? fullName,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/calculators/jyotish/comprehensive-chart'),
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
      throw Exception(error['error'] ?? 'Failed to generate chart');
    }
  }
}
```

### **2. Create Enhanced Chart Model:**

```dart
class JyotishChartModel {
  final bool success;
  final BirthDetails birthDetails;
  final LocationModel location;
  final AscendantModel ascendant;
  final Map<String, PlanetModel> planets;
  final Map<String, HouseAnalysis> houseAnalysis;
  final PredictionsModel predictions;
  final NameAnalysisModel? nameAnalysis;
  
  JyotishChartModel({
    required this.success,
    required this.birthDetails,
    required this.location,
    required this.ascendant,
    required this.planets,
    required this.houseAnalysis,
    required this.predictions,
    this.nameAnalysis,
  });
  
  factory JyotishChartModel.fromJson(Map<String, dynamic> json) {
    return JyotishChartModel(
      success: json['success'] ?? false,
      birthDetails: BirthDetails.fromJson(json['birthDetails']),
      location: LocationModel.fromJson(json['location']),
      ascendant: AscendantModel.fromJson(json['ascendant']),
      planets: (json['planets'] as Map<String, dynamic>).map(
        (key, value) => MapEntry(key, PlanetModel.fromJson(value)),
      ),
      houseAnalysis: (json['houseAnalysis'] as Map<String, dynamic>).map(
        (key, value) => MapEntry(key, HouseAnalysis.fromJson(value)),
      ),
      predictions: PredictionsModel.fromJson(json['predictions']),
      nameAnalysis: json['nameAnalysis'] != null 
          ? NameAnalysisModel.fromJson(json['nameAnalysis'])
          : null,
    );
  }
}

class PredictionsModel {
  final CareerAnalysisModel careerAnalysis;
  final MarriageAnalysisModel marriageAnalysis;
  
  PredictionsModel({
    required this.careerAnalysis,
    required this.marriageAnalysis,
  });
  
  factory PredictionsModel.fromJson(Map<String, dynamic> json) {
    return PredictionsModel(
      careerAnalysis: CareerAnalysisModel.fromJson(json['careerAnalysis']),
      marriageAnalysis: MarriageAnalysisModel.fromJson(json['marriageAnalysis']),
    );
  }
}

class CareerAnalysisModel {
  final String overallCareerProfile;
  final List<String> naturalTalents;
  final CareerFields careerFields;
  final List<String> careerBreakthroughs;
  final String leadershipStyle;
  final String businessPotential;
  final List<String> specificPredictions;
  
  CareerAnalysisModel({
    required this.overallCareerProfile,
    required this.naturalTalents,
    required this.careerFields,
    required this.careerBreakthroughs,
    required this.leadershipStyle,
    required this.businessPotential,
    required this.specificPredictions,
  });
  
  factory CareerAnalysisModel.fromJson(Map<String, dynamic> json) {
    return CareerAnalysisModel(
      overallCareerProfile: json['overallCareerProfile'] ?? '',
      naturalTalents: List<String>.from(json['naturalTalents'] ?? []),
      careerFields: CareerFields.fromJson(json['careerFields'] ?? {}),
      careerBreakthroughs: List<String>.from(json['careerBreakthroughs'] ?? []),
      leadershipStyle: json['leadershipStyle'] ?? '',
      businessPotential: json['businessPotential'] ?? '',
      specificPredictions: List<String>.from(json['specificPredictions'] ?? []),
    );
  }
}

class MarriageAnalysisModel {
  final MarriageProspects marriageProspects;
  final SpouseCharacteristics spouseCharacteristics;
  final List<String> amazingPredictions;
  
  MarriageAnalysisModel({
    required this.marriageProspects,
    required this.spouseCharacteristics,
    required this.amazingPredictions,
  });
  
  factory MarriageAnalysisModel.fromJson(Map<String, dynamic> json) {
    return MarriageAnalysisModel(
      marriageProspects: MarriageProspects.fromJson(json['marriageProspects'] ?? {}),
      spouseCharacteristics: SpouseCharacteristics.fromJson(json['spouseCharacteristics'] ?? {}),
      amazingPredictions: List<String>.from(json['amazingPredictions'] ?? []),
    );
  }
}
```

---

## 🎯 **Key Changes Summary**

### **1. API Endpoint Change:**
```dart
// ❌ OLD
POST /api/calculators/jyotish/basic-chart

// ✅ NEW  
POST /api/calculators/jyotish/comprehensive-chart
```

### **2. Parameter Changes:**
```dart
// ❌ OLD
"placeOfBirth": "Mumbai, India"  // String

// ✅ NEW
"locationId": 1                  // Integer ID
```

### **3. New Location Flow:**
```dart
// ✅ REQUIRED - Add this flow
1. User searches for city: /api/locations/search?query=mumbai
2. User selects city from results
3. Use city.id as locationId in Jyotish API
4. Get enhanced chart analysis with amazing predictions
```

### **4. Enhanced Response Handling:**
```dart
// ✅ NEW - Much richer response structure
- birthDetails with coordinates
- location information  
- detailed planetary positions
- house-by-house analysis
- deep career predictions
- amazing marriage analysis
- name compatibility
- personalized remedies
```

---

## 🚀 **Migration Steps for Flutter App**

### **Step 1: Update Dependencies**
```yaml
# pubspec.yaml - ensure you have http package
dependencies:
  http: ^0.13.5
```

### **Step 2: Replace Old Service**
- Remove old `JyotishService` class
- Add new `JyotishApiService` class with location support

### **Step 3: Add Location Search**
- Add `LocationSearchWidget` 
- Add `LocationModel` class
- Update form to include location selection

### **Step 4: Update Models**
- Add enhanced response models
- Update result display widgets

### **Step 5: Test New API**
```dart
// Test call
final chart = await JyotishApiService.getComprehensiveChart(
  dateOfBirth: '1990-08-15',
  timeOfBirth: '14:30',
  locationId: 1,  // Mumbai
  fullName: 'Rajesh Kumar',
);
```

---

## 📋 **Quick Checklist for Flutter Developer**

### **✅ Must Do:**
- [ ] Update base URL to `https://www.jyotishvishwakosh.in/api`
- [ ] Change endpoint from `basic-chart` to `comprehensive-chart`
- [ ] Replace `placeOfBirth` string with `locationId` integer
- [ ] Add location search functionality
- [ ] Update response models for enhanced data
- [ ] Test with new API structure

### **✅ Optional Enhancements:**
- [ ] Add location caching for better UX
- [ ] Implement location favorites
- [ ] Add GPS-based location suggestion
- [ ] Create beautiful UI for enhanced predictions

---

## 🌟 **Benefits of New API**

### **For Users:**
- **More Accurate**: Location coordinates for precise calculations
- **Amazing Predictions**: Deep career and marriage insights
- **Better UX**: Easy city search and selection
- **Comprehensive Analysis**: House-by-house detailed predictions

### **For Developers:**
- **Richer Data**: Much more detailed response structure
- **Better Error Handling**: Clear error messages with solutions
- **Enhanced Features**: Name compatibility and remedies
- **Future-Proof**: Scalable architecture for more features

The new enhanced Jyotish API will deliver **incredibly accurate and amazing predictions** that will absolutely astound your users! 🚀✨

**Base URL**: `https://www.jyotishvishwakosh.in/api` - Ready to use!
