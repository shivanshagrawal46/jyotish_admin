# Push Notification Setup for Flutter App

## Current Status: ❌ Not Implemented
Your backend currently only provides REST API endpoints. For instant notifications, you need push notification infrastructure.

## Required Implementation:

### 1. Backend Changes Needed

#### A. Install Firebase Admin SDK
```bash
npm install firebase-admin
```

#### B. Add FCM Service
```javascript
// services/fcmService.js
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./path/to/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

class FCMService {
  // Send notification to all users
  static async sendToAll(notification) {
    const message = {
      notification: {
        title: notification.title,
        body: notification.message
      },
      data: {
        type: notification.type,
        priority: notification.priority,
        actionUrl: notification.actionUrl || '',
        actionText: notification.actionText || ''
      },
      topic: 'all_users' // or specific user groups
    };

    try {
      const response = await admin.messaging().send(message);
      console.log('Successfully sent message:', response);
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Send to specific user
  static async sendToUser(userToken, notification) {
    const message = {
      token: userToken,
      notification: {
        title: notification.title,
        body: notification.message
      },
      data: {
        type: notification.type,
        priority: notification.priority
      }
    };

    return await admin.messaging().send(message);
  }
}

module.exports = FCMService;
```

#### C. Update Notification Routes
```javascript
// routes/notifications.js
const FCMService = require('../services/fcmService');

// Create new notification
router.post('/add', requireAuth, async (req, res) => {
    try {
        // ... existing code ...
        
        await notification.save();
        
        // Send push notification immediately
        await FCMService.sendToAll(notification);
        
        res.redirect('/notifications?success=Notification created and sent successfully');
    } catch (err) {
        // ... error handling ...
    }
});
```

### 2. Flutter App Changes Needed

#### A. Add Firebase to Flutter
```yaml
# pubspec.yaml
dependencies:
  firebase_core: ^2.24.2
  firebase_messaging: ^14.7.10
  flutter_local_notifications: ^16.3.2
```

#### B. Initialize Firebase
```dart
// main.dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // Request permission for notifications
  await FirebaseMessaging.instance.requestPermission();
  
  runApp(MyApp());
}
```

#### C. Handle Push Notifications
```dart
// services/notification_service.dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications = 
      FlutterLocalNotificationsPlugin();

  static Future<void> initialize() async {
    // Initialize local notifications
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    
    const InitializationSettings initializationSettings =
        InitializationSettings(android: initializationSettingsAndroid);
    
    await _localNotifications.initialize(initializationSettings);

    // Listen for messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      _showLocalNotification(message);
    });

    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  }

  static void _showLocalNotification(RemoteMessage message) {
    _localNotifications.show(
      message.hashCode,
      message.notification?.title,
      message.notification?.body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'channel_id',
          'channel_name',
          importance: Importance.high,
        ),
      ),
    );
  }
}

// Background message handler
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  // Handle background notification
}
```

### 3. Database Changes Needed

#### A. Add User Token Storage
```javascript
// models/User.js - Add FCM token field
const userSchema = new mongoose.Schema({
    // ... existing fields ...
    fcmToken: {
        type: String,
        default: null
    },
    notificationSettings: {
        pushEnabled: { type: Boolean, default: true },
        types: [String], // ['info', 'success', 'warning', 'error', 'announcement']
        frequency: { type: String, enum: ['instant', 'daily', 'weekly'], default: 'instant' }
    }
});
```

#### B. API Endpoint for Token Registration
```javascript
// routes/api/notifications.js
router.post('/register-token', async (req, res) => {
    try {
        const { userId, fcmToken } = req.body;
        
        await User.findByIdAndUpdate(userId, { fcmToken });
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

## Alternative: Server-Sent Events (SSE)

If you don't want to use push notifications, you can implement Server-Sent Events:

### Backend SSE Implementation
```javascript
// routes/api/notifications.js
const clients = new Set();

router.get('/stream', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    clients.add(res);

    req.on('close', () => {
        clients.delete(res);
    });
});

// Function to broadcast to all connected clients
function broadcastNotification(notification) {
    const data = `data: ${JSON.stringify(notification)}\n\n`;
    clients.forEach(client => {
        client.write(data);
    });
}
```

### Flutter SSE Implementation
```dart
// services/sse_service.dart
import 'dart:async';
import 'dart:convert';

class SSEService {
  static StreamController<Map<String, dynamic>> _notificationController = 
      StreamController.broadcast();
  
  static Stream<Map<String, dynamic>> get notificationStream => 
      _notificationController.stream;

  static void connect() {
    // Connect to SSE endpoint
    // Parse incoming events
    // Add to stream controller
  }
}
```

## Recommendation

**For instant notifications, implement Push Notifications (FCM) because:**

1. ✅ **Works when app is closed** - Users get notifications even when not using the app
2. ✅ **Battery efficient** - No constant polling
3. ✅ **Native experience** - Uses device notification system
4. ✅ **Reliable delivery** - Google/Apple handle delivery
5. ✅ **Rich notifications** - Support for images, actions, etc.

## Current Status Summary

| Feature | Status | Notes |
|---------|--------|-------|
| REST API | ✅ Ready | Can fetch notifications |
| Real-time Updates | ❌ Missing | Need FCM or SSE |
| Push Notifications | ❌ Missing | Need Firebase setup |
| Background Sync | ❌ Missing | Need FCM implementation |
| Instant Delivery | ❌ Missing | Need push notification system |

**Your backend is good for basic notification management, but needs push notification infrastructure for instant delivery to Flutter app users.**
