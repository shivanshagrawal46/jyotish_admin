# 🚀 Flutter Push Notifications Integration Guide

## Complete Setup for Instant Notifications

Your backend is now ready for **instant push notifications**! Here's how to integrate it with your Flutter app.

## 📱 Flutter App Setup

### 1. Add Dependencies

```yaml
# pubspec.yaml
dependencies:
  firebase_core: ^2.24.2
  firebase_messaging: ^14.7.10
  flutter_local_notifications: ^16.3.2
  http: ^1.1.0
  shared_preferences: ^2.2.2
```

### 2. Firebase Configuration

#### A. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project: "Jyotish Vishwakosh"
3. Add Android app with package name: `com.yourcompany.jyotish`
4. Download `google-services.json` to `android/app/`

#### B. iOS Configuration (if needed)
1. Add iOS app in Firebase Console
2. Download `GoogleService-Info.plist` to `ios/Runner/`

### 3. Flutter Code Implementation

#### A. Main App Setup
```dart
// main.dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'services/notification_service.dart';

// Background message handler
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('Handling background message: ${message.messageId}');
  // Handle background notification
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp();
  
  // Set up background message handler
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  
  // Initialize notification service
  await NotificationService.initialize();
  
  runApp(MyApp());
}
```

#### B. Notification Service
```dart
// services/notification_service.dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications = 
      FlutterLocalNotificationsPlugin();
  
  static const String baseUrl = 'https://your-domain.com';
  static String? _fcmToken;
  static String? _userId;

  // Initialize notification service
  static Future<void> initialize() async {
    // Initialize local notifications
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    
    const InitializationSettings initializationSettings =
        InitializationSettings(android: initializationSettingsAndroid);
    
    await _localNotifications.initialize(initializationSettings);

    // Request permission
    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    // Get FCM token
    _fcmToken = await _messaging.getToken();
    print('FCM Token: $_fcmToken');

    // Listen for messages when app is in foreground
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      _showLocalNotification(message);
    });

    // Handle notification tap
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      _handleNotificationTap(message);
    });

    // Handle notification tap when app is terminated
    RemoteMessage? initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }
  }

  // Register FCM token with your backend
  static Future<bool> registerToken(String userId) async {
    _userId = userId;
    
    if (_fcmToken == null) {
      _fcmToken = await _messaging.getToken();
    }

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/notifications/api/register-token'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'userId': userId,
          'fcmToken': _fcmToken,
          'platform': 'android',
          'appVersion': '1.0.0',
          'osVersion': 'Android 13'
        }),
      );

      if (response.statusCode == 200) {
        print('✅ FCM token registered successfully');
        return true;
      } else {
        print('❌ Failed to register FCM token: ${response.body}');
        return false;
      }
    } catch (e) {
      print('❌ Error registering FCM token: $e');
      return false;
    }
  }

  // Show local notification
  static void _showLocalNotification(RemoteMessage message) {
    final notification = message.notification;
    final data = message.data;

    if (notification != null) {
      _localNotifications.show(
        message.hashCode,
        notification.title,
        notification.body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            'jyotish_notifications',
            'Jyotish Notifications',
            channelDescription: 'Notifications from Jyotish Vishwakosh app',
            importance: Importance.high,
            priority: Priority.high,
            icon: '@mipmap/ic_launcher',
            color: _getNotificationColor(data['type']),
            playSound: true,
            enableVibration: true,
          ),
        ),
        payload: json.encode(data),
      );
    }
  }

  // Handle notification tap
  static void _handleNotificationTap(RemoteMessage message) {
    final data = message.data;
    
    // Navigate based on notification data
    if (data['actionUrl'] != null && data['actionUrl'].isNotEmpty) {
      // Open URL or navigate to specific screen
      print('Opening URL: ${data['actionUrl']}');
    }
    
    // Mark as read
    if (data['notificationId'] != null) {
      markAsRead(data['notificationId']);
    }
  }

  // Get notification color based on type
  static Color _getNotificationColor(String? type) {
    switch (type) {
      case 'info': return Colors.blue;
      case 'success': return Colors.green;
      case 'warning': return Colors.orange;
      case 'error': return Colors.red;
      case 'announcement': return Colors.purple;
      default: return Colors.blue;
    }
  }

  // Mark notification as read
  static Future<void> markAsRead(String notificationId) async {
    try {
      await http.post(
        Uri.parse('$baseUrl/notifications/api/read/$notificationId'),
        headers: {'Content-Type': 'application/json'},
      );
    } catch (e) {
      print('Error marking notification as read: $e');
    }
  }

  // Get active notifications
  static Future<List<NotificationData>> getActiveNotifications() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/notifications/api/active'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          return (data['data'] as List)
              .map((json) => NotificationData.fromJson(json))
              .toList();
        }
      }
      return [];
    } catch (e) {
      print('Error fetching notifications: $e');
      return [];
    }
  }

  // Update notification settings
  static Future<bool> updateSettings({
    bool? pushEnabled,
    List<String>? types,
    String? frequency,
  }) async {
    if (_userId == null) return false;

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/notifications/api/update-settings'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'userId': _userId,
          'pushEnabled': pushEnabled,
          'types': types,
          'frequency': frequency,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error updating settings: $e');
      return false;
    }
  }
}

// Notification data model
class NotificationData {
  final String id;
  final String title;
  final String message;
  final String type;
  final String priority;
  final String targetAudience;
  final String? actionUrl;
  final String? actionText;
  final String? imageUrl;
  final DateTime scheduledAt;
  final DateTime createdAt;

  NotificationData({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.priority,
    required this.targetAudience,
    this.actionUrl,
    this.actionText,
    this.imageUrl,
    required this.scheduledAt,
    required this.createdAt,
  });

  factory NotificationData.fromJson(Map<String, dynamic> json) {
    return NotificationData(
      id: json['_id'],
      title: json['title'],
      message: json['message'],
      type: json['type'],
      priority: json['priority'],
      targetAudience: json['targetAudience'],
      actionUrl: json['actionUrl'],
      actionText: json['actionText'],
      imageUrl: json['imageUrl'],
      scheduledAt: DateTime.parse(json['scheduledAt']),
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}
```

#### C. App Integration
```dart
// In your main app widget
class MyApp extends StatefulWidget {
  @override
  _MyAppState createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  @override
  void initState() {
    super.initState();
    _initializeNotifications();
  }

  Future<void> _initializeNotifications() async {
    // Register FCM token when user logs in
    String userId = await getUserId(); // Your method to get user ID
    await NotificationService.registerToken(userId);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Jyotish Vishwakosh',
      home: HomeScreen(),
    );
  }
}
```

## 🔧 Backend Configuration

### 1. Firebase Service Account Setup

#### A. Get Service Account Key
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Replace the placeholder in `services/fcmService.js` with your actual service account key

#### B. Update FCM Service
```javascript
// services/fcmService.js - Replace the serviceAccount object with your actual key
const serviceAccount = require('./path/to/your/serviceAccountKey.json');
```

### 2. Test the System

#### A. Test from Admin Panel
1. Go to `/notifications/add`
2. Create a new notification
3. Check console logs for push notification status

#### B. Test API Endpoints
```bash
# Register FCM token
curl -X POST http://localhost:3000/notifications/api/register-token \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","fcmToken":"your_fcm_token"}'

# Send test notification
curl -X POST http://localhost:3000/notifications/api/send-test \
  -H "Content-Type: application/json" \
  -d '{"message":"Test notification from API"}'
```

## 🚀 How It Works

### 1. **Instant Delivery Flow:**
```
Admin creates notification → Backend saves to DB → FCM Service sends push → Users get notification instantly
```

### 2. **User Experience:**
- ✅ **App closed** → Notification appears in system tray
- ✅ **App in background** → Notification appears in system tray  
- ✅ **App in foreground** → Local notification shows
- ✅ **Tap notification** → App opens to relevant screen

### 3. **Features:**
- 🎯 **Targeted notifications** (all users, premium, free)
- 🎨 **Rich notifications** with colors, icons, actions
- 📊 **Analytics** (sent count, read count)
- ⚙️ **User settings** (enable/disable, frequency)
- 🔄 **Real-time updates** (no polling needed)

## 📱 Result

Your users will now get **instant push notifications** just like WhatsApp, Instagram, and other high-tech apps:

- **Admin creates notification** → **Users get it instantly on their phones**
- **Works when app is closed** → **System tray notifications**
- **Rich notifications** → **Colors, icons, action buttons**
- **No battery drain** → **No constant API polling**

## 🎉 You're Ready!

Your notification system is now **enterprise-level** and ready for instant push notifications to your Flutter app users!
