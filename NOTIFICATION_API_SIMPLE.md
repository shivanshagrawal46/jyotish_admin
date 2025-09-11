# 🔔 **Simple Notification API Documentation**

## **For Flutter App Integration**

### **1. Register Device for Notifications**
**Endpoint:** `POST /notifications/api/register-token`

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

### **2. Get Active Notifications**
**Endpoint:** `GET /notifications/api/active`

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

### **3. Mark Notification as Read**
**Endpoint:** `POST /notifications/api/read/:notificationId`

**Response:**
```json
{
    "success": true,
    "message": "Notification marked as read"
}
```

### **4. Send Test Notification (Admin Only)**
**Endpoint:** `POST /notifications/api/send-test`

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

## **How It Works:**

1. **Flutter app** calls `/api/register-token` with FCM token
2. **Device** gets subscribed to `all_users` topic
3. **Admin** creates notification in admin panel
4. **All devices** receive notification instantly via Firebase topic
5. **No user management** needed in this backend!

## **Flutter Integration:**

```dart
// Register for notifications
await http.post(
  Uri.parse('https://your-backend.com/notifications/api/register-token'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'fcmToken': fcmToken,
    'platform': 'android',
    'appVersion': '1.0.0',
  }),
);
```

**That's it!** Your Flutter app will now receive all notifications sent from the admin panel! 🚀
