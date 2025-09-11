# Notification Types Explanation

## What are Notification Types?

Notification types are visual and functional categories that help users understand the nature and importance of notifications in your Flutter app. They provide context and help users prioritize which notifications to read first.

## Available Notification Types

### 1. **Info** (Default)
- **Purpose**: General information and updates
- **Use Cases**: 
  - App updates and new features
  - General announcements
  - Educational content
  - Tips and tricks
- **Visual Style**: Blue color scheme
- **Priority**: Normal

### 2. **Success**
- **Purpose**: Positive feedback and confirmations
- **Use Cases**:
  - Successful actions completed
  - Achievements unlocked
  - Payment confirmations
  - Account setup completed
- **Visual Style**: Green color scheme
- **Priority**: Normal

### 3. **Warning**
- **Purpose**: Important notices that require attention
- **Use Cases**:
  - Maintenance notifications
  - Feature deprecations
  - Account issues
  - Important reminders
- **Visual Style**: Orange/Yellow color scheme
- **Priority**: Medium-High

### 4. **Error**
- **Purpose**: Critical issues and problems
- **Use Cases**:
  - System errors
  - Payment failures
  - Account security issues
  - Service disruptions
- **Visual Style**: Red color scheme
- **Priority**: High

### 5. **Announcement**
- **Purpose**: Important news and major updates
- **Use Cases**:
  - Major app updates
  - New feature launches
  - Company news
  - Special events
- **Visual Style**: Purple/Accent color scheme
- **Priority**: High

## How Types Work in Your Flutter App

### Visual Representation
Each notification type can be displayed with:
- **Color coding** for quick identification
- **Icons** to represent the type
- **Different styling** to draw attention

### User Experience
- **Info**: Users can read at their convenience
- **Success**: Users feel positive about completed actions
- **Warning**: Users know to pay attention but not panic
- **Error**: Users know immediate action may be required
- **Announcement**: Users know this is important news

### Priority Order
When multiple notifications are shown, they can be ordered by:
1. **Priority level** (urgent, high, medium, low)
2. **Type importance** (error > warning > announcement > success > info)
3. **Creation date** (newest first)

## Best Practices for Using Types

### Choose the Right Type
- **Don't overuse "Error"** - Reserve for actual problems
- **Use "Warning" sparingly** - Only for important notices
- **"Info" is your default** - For most general updates
- **"Success" for positive feedback** - Makes users feel good
- **"Announcement" for big news** - Major updates and features

### Examples for Jyotish App

#### Info
- "New horoscope readings available for today"
- "Learn about Vedic astrology in our new section"
- "Check out our updated user interface"

#### Success
- "Your horoscope has been generated successfully"
- "Payment completed - Premium features unlocked"
- "Profile updated successfully"

#### Warning
- "App will be under maintenance tonight 2-4 AM"
- "Your subscription expires in 3 days"
- "Some features may be temporarily unavailable"

#### Error
- "Failed to generate horoscope - Please try again"
- "Payment failed - Please check your card details"
- "Unable to connect to server"

#### Announcement
- "New AI-powered predictions now available!"
- "Major app update with 50+ new features"
- "Special festival horoscopes coming this week"

## Technical Implementation

### In Admin Panel
- Select type when creating notifications
- Preview shows how it will look
- Types are stored in database

### In Flutter App
- Fetch type from API
- Apply appropriate styling
- Sort by type priority
- Show type-specific icons

### API Response
```json
{
  "type": "info",
  "title": "New Feature Available",
  "message": "Check out our latest astrology tools"
}
```

## Summary

Notification types help create a better user experience by:
- **Providing visual context** for the notification's importance
- **Helping users prioritize** which notifications to read
- **Creating consistent patterns** that users learn to recognize
- **Improving communication** between admin and users

Choose types thoughtfully to ensure users understand the importance and context of each notification in your Jyotish app.
