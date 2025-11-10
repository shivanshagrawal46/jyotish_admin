# Saved Kundli API Documentation

This document provides information about the Saved Kundli API endpoints for saving and retrieving kundli data.

## Base URL
```
http://jyotishvishwakosh.in/api/saved-kundli
```

## Endpoints

### 1. Save a New Kundli
**POST** `/`

Saves a new kundli for a user.

#### Request Body
```json
{
  "userId": "user123",
  "name": "John Doe",
  "dateOfBirth": "1990-08-15",
  "timeOfBirth": "14:30",
  "place": "New Delhi, India",
  "gender": "male"
}
```

#### Required Fields
- `userId` (string): User ID of the user saving the kundli
- `name` (string): Name of the person
- `dateOfBirth` (string/date): Date of birth (ISO format: YYYY-MM-DD)
- `timeOfBirth` (string): Time of birth (format: HH:MM)
- `place` (string): Place of birth
- `gender` (string): Must be one of: "male", "female", "other"

#### Response
```json
{
  "success": true,
  "message": "Kundli saved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "user123",
    "name": "John Doe",
    "dateOfBirth": "1990-08-15T00:00:00.000Z",
    "timeOfBirth": "14:30",
    "place": "New Delhi, India",
    "gender": "male",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. Get All Saved Kundlis for a User
**GET** `/user/:userId`

Retrieves all saved kundlis for a specific user.

#### URL Parameters
- `userId` (string): User ID

#### Response
```json
{
  "success": true,
  "message": "Saved kundlis retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "user123",
      "name": "John Doe",
      "dateOfBirth": "1990-08-15T00:00:00.000Z",
      "timeOfBirth": "14:30",
      "place": "New Delhi, India",
      "gender": "male",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 3. Get All Saved Kundlis (Admin)
**GET** `/all`

Retrieves all saved kundlis with pagination and filtering (for admin use).

#### Query Parameters
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `userId` (string, optional): Filter by user ID
- `search` (string, optional): Search by name or place

#### Example Request
```
GET /api/saved-kundli/all?page=1&limit=20&userId=user123&search=John
```

#### Response
```json
{
  "success": true,
  "message": "All saved kundlis retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "user123",
      "name": "John Doe",
      "dateOfBirth": "1990-08-15T00:00:00.000Z",
      "timeOfBirth": "14:30",
      "place": "New Delhi, India",
      "gender": "male",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalKundlis": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### 4. Get a Specific Saved Kundli by ID
**GET** `/:id`

Retrieves a specific saved kundli by its ID.

#### URL Parameters
- `id` (string): Kundli ID

#### Response
```json
{
  "success": true,
  "message": "Saved kundli retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "user123",
    "name": "John Doe",
    "dateOfBirth": "1990-08-15T00:00:00.000Z",
    "timeOfBirth": "14:30",
    "place": "New Delhi, India",
    "gender": "male",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 5. Update a Saved Kundli
**PUT** `/:id`

Updates an existing saved kundli.

#### Request Body (all fields optional)
```json
{
  "name": "John Smith",
  "dateOfBirth": "1990-08-15",
  "timeOfBirth": "15:00",
  "place": "Mumbai, India",
  "gender": "male"
}
```

#### Response
```json
{
  "success": true,
  "message": "Saved kundli updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "user123",
    "name": "John Smith",
    "dateOfBirth": "1990-08-15T00:00:00.000Z",
    "timeOfBirth": "15:00",
    "place": "Mumbai, India",
    "gender": "male",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

### 6. Delete a Saved Kundli
**DELETE** `/:id`

Deletes a saved kundli.

#### URL Parameters
- `id` (string): Kundli ID

#### Response
```json
{
  "success": true,
  "message": "Saved kundli deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Missing required fields. Please provide: userId, name, dateOfBirth, timeOfBirth, place, and gender"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Saved kundli not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error message details"
}
```

---

## Admin Panel

The saved kundlis can also be viewed and managed through the admin panel at:
- **List View**: `/saved-kundli`
- **Detail View**: `/saved-kundli/:id`

The admin panel provides:
- Statistics dashboard (total kundlis, unique users, gender distribution)
- Search and filter functionality
- Pagination
- View and delete operations

---

## Example Usage

### Save a Kundli (Frontend)
```javascript
const saveKundli = async (kundliData) => {
  const response = await fetch('http://jyotishvishwakosh.in/api/saved-kundli', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: 'user123',
      name: 'John Doe',
      dateOfBirth: '1990-08-15',
      timeOfBirth: '14:30',
      place: 'New Delhi, India',
      gender: 'male'
    })
  });
  
  const result = await response.json();
  return result;
};
```

### Get All Kundlis for a User (Frontend)
```javascript
const getUserKundlis = async (userId) => {
  const response = await fetch(`http://jyotishvishwakosh.in/api/saved-kundli/user/${userId}`);
  const result = await response.json();
  return result.data;
};
```

