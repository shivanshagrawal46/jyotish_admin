# Notification API Documentation

This document describes the API endpoints for the notification system that can be integrated with your Flutter app.

## Base URL
```
https://your-domain.com
```

## Authentication
The notification API endpoints do not require authentication for fetching notifications, but you may want to implement user-specific filtering based on your app's requirements.

## API Endpoints

### 1. Get Active Notifications

**Endpoint:** `GET /notifications/api/active`

**Description:** Fetches all active notifications that should be displayed to users.

**Query Parameters:**
- `targetAudience` (optional): Filter by target audience (`all`, `premium`, `free`, `specific`)
- `limit` (optional): Maximum number of notifications to return (default: 50)

**Example Request:**
```http
GET /notifications/api/active?targetAudience=all&limit=20
```

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "notification_id",
      "title": "Welcome to Jyotish Vishwakosh",
      "message": "Discover the ancient wisdom of Vedic astrology...",
      "type": "info",
      "priority": "medium",
      "targetAudience": "all",
      "actionUrl": "https://example.com/learn-more",
      "actionText": "Learn More",
      "imageUrl": "https://example.com/notification-image.jpg",
      "scheduledAt": "2024-01-15T10:00:00.000Z",
      "createdAt": "2024-01-15T09:30:00.000Z"
    }
  ],
  "count": 1
}
```

**Notification Types:**
- `info`: General information
- `success`: Success messages
- `warning`: Warning messages
- `error`: Error messages
- `announcement`: Important announcements

**Priority Levels:**
- `low`: Low priority
- `medium`: Medium priority
- `high`: High priority
- `urgent`: Urgent priority

**Target Audiences:**
- `all`: All users
- `premium`: Premium users only
- `free`: Free users only
- `specific`: Specific users (you can implement custom logic)

### 2. Mark Notification as Read

**Endpoint:** `POST /notifications/api/read/:id`

**Description:** Marks a notification as read for analytics purposes.

**Path Parameters:**
- `id`: Notification ID

**Example Request:**
```http
POST /notifications/api/read/notification_id
```

**Response Format:**
```json
{
  "success": true
}
```

## Flutter Integration Example

Here's a basic example of how to integrate these APIs in your Flutter app:

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class NotificationService {
  static const String baseUrl = 'https://your-domain.com';
  
  // Fetch active notifications
  static Future<List<Notification>> getActiveNotifications({
    String targetAudience = 'all',
    int limit = 50,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/notifications/api/active?targetAudience=$targetAudience&limit=$limit'),
        headers: {'Content-Type': 'application/json'},
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          return (data['data'] as List)
              .map((json) => Notification.fromJson(json))
              .toList();
        }
      }
      return [];
    } catch (e) {
      print('Error fetching notifications: $e');
      return [];
    }
  }
  
  // Mark notification as read
  static Future<bool> markAsRead(String notificationId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/notifications/api/read/$notificationId'),
        headers: {'Content-Type': 'application/json'},
      );
      
      return response.statusCode == 200 && json.decode(response.body)['success'] == true;
    } catch (e) {
      print('Error marking notification as read: $e');
      return false;
    }
  }
}

class Notification {
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
  
  Notification({
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
  
  factory Notification.fromJson(Map<String, dynamic> json) {
    return Notification(
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

## Admin Panel Features

The admin panel provides the following features for managing notifications:

1. **Create Notifications**: Add new notifications with title, message, type, priority, and target audience
2. **Edit Notifications**: Modify existing notifications
3. **Delete Notifications**: Remove notifications
4. **Toggle Status**: Activate/deactivate notifications
5. **Scheduling**: Set when notifications should be displayed
6. **Expiration**: Set when notifications should stop being displayed
7. **Action Buttons**: Add optional action buttons with custom URLs and text
8. **Images**: Add optional images to notifications
9. **Analytics**: Track read counts for notifications

## Notification Display Logic

The API automatically filters notifications based on:
- Active status (`isActive: true`)
- Scheduled time (notifications scheduled for future are not returned)
- Expiration time (expired notifications are not returned)
- Target audience (if specified)

## Error Handling

All API endpoints return appropriate HTTP status codes:
- `200`: Success
- `500`: Server error

Error responses include a `success: false` field with an error message.

## Rate Limiting

Consider implementing rate limiting in your Flutter app to avoid excessive API calls. A reasonable approach would be to:
- Fetch notifications on app startup
- Refresh notifications every 5-10 minutes
- Implement pull-to-refresh functionality
- Cache notifications locally for offline viewing
