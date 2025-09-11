# 🔔 **Notification API Documentation - Complete Guide**

## **🚀 Overview**
This backend provides **instant push notifications** to all Flutter devices. **No user management, no authentication required** - just register your device and receive notifications!

---

## **📱 API Endpoints (All Public)**

### **1. Register Device for Notifications**
**Endpoint:** `POST /notifications/api/register-token`

**Purpose:** Subscribe device to receive all notifications

**Request Body:**
```json
{
    "fcmToken": "your_fcm_token_here",
    "platform": "android",
    "appVersion": "1.0.0",
    "osVersion": "Android 13"
}
```

**Response:**
```json
{
    "success": true,
    "message": "FCM token registered successfully - device will receive all notifications",
    "deviceInfo": {
        "platform": "android",
        "appVersion": "1.0.0",
        "osVersion": "Android 13"
    }
}
```

**Error Response:**
```json
{
    "success": false,
    "error": "fcmToken is required"
}
```

---

### **2. Get Active Notifications**
**Endpoint:** `GET /notifications/api/active`

**Purpose:** Fetch all active notifications for display in app

**Response:**
```json
{
    "success": true,
    "notifications": [
        {
            "id": "notification_id",
            "title": "Notification Title",
            "message": "Notification message",
            "type": "info",
            "priority": "medium",
            "actionUrl": "https://example.com",
            "actionText": "View Details",
            "imageUrl": "https://example.com/image.jpg",
            "createdAt": "2024-01-15T10:30:00Z"
        }
    ]
}
```

---

### **3. Mark Notification as Read**
**Endpoint:** `POST /notifications/api/read/:notificationId`

**Purpose:** Mark a specific notification as read

**Response:**
```json
{
    "success": true,
    "message": "Notification marked as read"
}
```

---

### **4. Send Test Notification**
**Endpoint:** `POST /notifications/api/send-test`

**Purpose:** Send a test notification to all devices (for testing)

**Request Body:**
```json
{
    "message": "Custom test message"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Test notification sent to all users successfully"
}
```

---

## **🔧 How It Works**

### **Architecture:**
```
Admin Panel → Create Notification → Firebase Topic → ALL Devices
     ↓              ↓                    ↓              ↓
  (Auth)      (No User ID)        (all_users)    (Instant Push)
```

### **Flow:**
1. **Flutter app** calls `/api/register-token` with FCM token
2. **Device** gets subscribed to `all_users` topic
3. **Admin** creates notification in admin panel
4. **All devices** receive notification instantly via Firebase topic
5. **No user management** needed in this backend!

---

## **📱 Flutter Integration**

### **1. Register for Notifications (Call once when app starts):**
```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<void> registerForNotifications(String fcmToken) async {
  try {
    final response = await http.post(
      Uri.parse('https://your-backend.com/notifications/api/register-token'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'fcmToken': fcmToken,
        'platform': 'android',
        'appVersion': '1.0.0',
      }),
    );
    
    if (response.statusCode == 200) {
      print('✅ Device registered for notifications');
    }
  } catch (e) {
    print('❌ Error registering: $e');
  }
}
```

### **2. Get Active Notifications:**
```dart
Future<List<Map<String, dynamic>>> getActiveNotifications() async {
  try {
    final response = await http.get(
      Uri.parse('https://your-backend.com/notifications/api/active'),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return List<Map<String, dynamic>>.from(data['notifications']);
    }
  } catch (e) {
    print('❌ Error fetching notifications: $e');
  }
  return [];
}
```

### **3. Mark as Read:**
```dart
Future<void> markAsRead(String notificationId) async {
  try {
    await http.post(
      Uri.parse('https://your-backend.com/notifications/api/read/$notificationId'),
    );
  } catch (e) {
    print('❌ Error marking as read: $e');
  }
}
```

### **4. Send Test Notification:**
```dart
Future<void> sendTestNotification(String message) async {
  try {
    final response = await http.post(
      Uri.parse('https://your-backend.com/notifications/api/send-test'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'message': message}),
    );
    
    if (response.statusCode == 200) {
      print('✅ Test notification sent');
    }
  } catch (e) {
    print('❌ Error sending test: $e');
  }
}
```

---

## **✅ Key Features**

- **🚀 Instant Delivery:** Notifications sent immediately when admin creates them
- **📱 Works When Closed:** Notifications work even when app is closed
- **🔓 No Authentication:** No user login or auth required
- **🌐 Topic-Based:** All devices subscribe to same topic
- **⚡ High Performance:** Firebase handles delivery efficiently
- **🛡️ Secure:** Only your app can receive notifications

---

## **🧪 Testing**

### **Test Registration:**
```bash
curl -X POST http://localhost:3000/notifications/api/register-token \
  -H "Content-Type: application/json" \
  -d '{"fcmToken": "test_token", "platform": "android"}'
```

### **Test Notification:**
```bash
curl -X POST http://localhost:3000/notifications/api/send-test \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from test!"}'
```

### **Get Active Notifications:**
```bash
curl http://localhost:3000/notifications/api/active
```

---

## **🎯 That's It!**

Your Flutter app will now receive **all notifications** sent from the admin panel **instantly**! No user management, no complex setup - just register and receive! 🚀
