# Order API Documentation

This document provides information about the Order API endpoints for the Jyotish ecommerce Flutter app integration.

## Base URL
```
http://your-domain.com/api/order
```

## Endpoints

### 1. Create New Order
**POST** `/create`

Creates a new order from the Flutter app.

#### Request Body
```json
{
  "customerName": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+919876543210",
  "address": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "category": "astroshop",
  "productName": "Pukhraj Stone",
  "totalAmount": 15000,
  "shippingAddress": {
    "address": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "country": "India"
  },
  "notes": "Please deliver in the morning"
}
```

#### Required Fields
- `customerName` (string): Customer's full name
- `email` (string): Customer's email address
- `phoneNumber` (string): Customer's phone number
- `address` (string): Customer's address
- `city` (string): Customer's city
- `state` (string): Customer's state
- `pincode` (string): Customer's pincode
- `category` (string): Must be either "astroshop" or "pooja"
- `productName` (string): Name of the product being ordered
- `totalAmount` (number): Total order amount in INR

#### Optional Fields
- `shippingAddress` (object): Shipping address details
- `notes` (string): Additional notes for the order

#### Response
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "507f1f77bcf86cd799439011",
    "orderDate": "2024-01-15T10:30:00.000Z",
    "status": "pending"
  }
}
```

### 2. Get All Orders (Admin)
**GET** `/all`

Retrieves all orders with pagination and filtering.

#### Query Parameters
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by order status
- `category` (string): Filter by category
- `search` (string): Search by customer name, email, or product name

#### Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "customerName": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "+919876543210",
      "category": "astroshop",
      "productName": "Pukhraj Stone",
      "orderDate": "2024-01-15T10:30:00.000Z",
      "status": "pending",
      "totalAmount": 15000,
      "paymentStatus": "pending",
      "shippingAddress": {
        "address": "123 Main Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001",
        "country": "India"
      },
      "notes": "Please deliver in the morning",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalOrders": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 3. Get Order by ID
**GET** `/:id`

Retrieves a specific order by its ID.

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "customerName": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+919876543210",
    "category": "astroshop",
    "productName": "Pukhraj Stone",
    "orderDate": "2024-01-15T10:30:00.000Z",
    "status": "pending",
    "totalAmount": 15000,
    "paymentStatus": "pending",
    "shippingAddress": {
      "address": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "country": "India"
    },
    "notes": "Please deliver in the morning",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Update Order Status
**PATCH** `/:id/status`

Updates the status of an order.

#### Request Body
```json
{
  "status": "confirmed"
}
```

#### Valid Status Values
- `pending`
- `confirmed`
- `processing`
- `shipped`
- `delivered`
- `cancelled`

#### Response
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "confirmed",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### 5. Update Payment Status
**PATCH** `/:id/payment`

Updates the payment status of an order.

#### Request Body
```json
{
  "paymentStatus": "paid"
}
```

#### Valid Payment Status Values
- `pending`
- `paid`
- `failed`
- `refunded`

#### Response
```json
{
  "success": true,
  "message": "Payment status updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "paymentStatus": "paid",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### 6. Get Order Statistics
**GET** `/stats/summary`

Retrieves order statistics for the admin dashboard.

#### Response
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "pendingOrders": 25,
    "confirmedOrders": 30,
    "deliveredOrders": 80,
    "cancelledOrders": 15,
    "totalRevenue": 2500000,
    "categoryStats": [
      {
        "_id": "astroshop",
        "count": 100
      },
      {
        "_id": "pooja",
        "count": 50
      }
    ]
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Missing required fields"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Order not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details"
}
```

## Flutter App Integration Example

```dart
// Example Flutter code for creating an order
Future<void> createOrder() async {
  final response = await http.post(
    Uri.parse('http://your-domain.com/api/order/create'),
    headers: {
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'customerName': 'John Doe',
      'email': 'john@example.com',
      'phoneNumber': '+919876543210',
      'address': '123 Main Street',
      'city': 'Mumbai',
      'state': 'Maharashtra',
      'pincode': '400001',
      'category': 'astroshop',
      'productName': 'Pukhraj Stone',
      'totalAmount': 15000,
      'shippingAddress': {
        'address': '123 Main Street',
        'city': 'Mumbai',
        'state': 'Maharashtra',
        'pincode': '400001',
        'country': 'India'
      },
      'notes': 'Please deliver in the morning'
    }),
  );

  if (response.statusCode == 201) {
    final data = jsonDecode(response.body);
    print('Order created: ${data['data']['orderId']}');
  } else {
    print('Error creating order: ${response.body}');
  }
}
```

## Admin Panel Access

The admin panel for managing orders is available at:
```
http://your-domain.com/order
```

Features available in the admin panel:
- View all orders with pagination
- Filter orders by status, category, and search
- View detailed order information
- Update order and payment status
- Delete orders
- Export orders (coming soon)
- View order statistics and revenue

## Order Status Flow

1. **Pending** - Order is created but not yet confirmed
2. **Confirmed** - Order is confirmed by admin
3. **Processing** - Order is being prepared
4. **Shipped** - Order has been shipped
5. **Delivered** - Order has been delivered
6. **Cancelled** - Order has been cancelled

## Payment Status Flow

1. **Pending** - Payment is pending
2. **Paid** - Payment has been received
3. **Failed** - Payment failed
4. **Refunded** - Payment has been refunded 