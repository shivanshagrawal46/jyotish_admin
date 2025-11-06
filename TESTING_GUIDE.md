# Saved Kundli Feature - Complete Testing Guide

## ✅ Pre-Testing Checklist

All files have been created and verified:
- ✅ `models/SavedKundli.js` - Database model
- ✅ `routes/api/savedKundli.js` - API endpoints
- ✅ `routes/savedKundli.js` - Admin panel routes
- ✅ `views/savedKundli/index.ejs` - List view
- ✅ `views/savedKundli/view.ejs` - Detail view
- ✅ `views/partials/sidebar.ejs` - Updated with menu item
- ✅ `app.js` - Routes registered
- ✅ All JavaScript files have valid syntax

## 🚀 Quick Start Testing

### Step 1: Start Your Server
```bash
npm start
# or
node app.js
```

The server should start without errors. If you see any errors, check:
- MongoDB connection is working
- All dependencies are installed
- Port 5000 (or your configured port) is available

### Step 2: Test API Endpoints

#### Test 1: Save a Kundli
```bash
# Using curl (Windows PowerShell)
curl.exe -X POST http://localhost:5000/api/saved-kundli `
  -H "Content-Type: application/json" `
  -d '{\"userId\":\"test123\",\"name\":\"John Doe\",\"dateOfBirth\":\"1990-08-15\",\"timeOfBirth\":\"14:30\",\"place\":\"New Delhi, India\",\"gender\":\"male\"}'

# Using PowerShell Invoke-RestMethod
$body = @{
    userId = "test123"
    name = "John Doe"
    dateOfBirth = "1990-08-15"
    timeOfBirth = "14:30"
    place = "New Delhi, India"
    gender = "male"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/saved-kundli" -Method POST -Body $body -ContentType "application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Kundli saved successfully",
  "data": {
    "_id": "...",
    "userId": "test123",
    "name": "John Doe",
    ...
  }
}
```

#### Test 2: Get User's Kundlis
```bash
# Replace test123 with the userId you used
Invoke-RestMethod -Uri "http://localhost:5000/api/saved-kundli/user/test123" -Method GET
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Saved kundlis retrieved successfully",
  "data": [...],
  "count": 1
}
```

#### Test 3: Get All Kundlis
```bash
Invoke-RestMethod -Uri "http://localhost:5000/api/saved-kundli/all?page=1&limit=10" -Method GET
```

**Expected Response:**
```json
{
  "success": true,
  "message": "All saved kundlis retrieved successfully",
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalKundlis": 1,
    ...
  }
}
```

#### Test 4: Test Error Handling
```bash
# Test with missing fields (should fail)
$invalidBody = @{
    userId = "test123"
    name = "John Doe"
    # Missing other required fields
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/saved-kundli" -Method POST -Body $invalidBody -ContentType "application/json"
```

**Expected Response:** 400 Bad Request with error message

### Step 3: Test Admin Panel

1. **Login to Admin Panel**
   - Navigate to `http://localhost:5000/login`
   - Login with your admin credentials

2. **Access Saved Kundli Section**
   - Look for "Saved Kundli" in the sidebar
   - Click on it
   - URL should be: `http://localhost:5000/saved-kundli`

3. **Verify List Page**
   - Should show statistics (Total Kundlis, Unique Users, Gender distribution)
   - Should display a table with all saved kundlis
   - Should have search and filter options

4. **Test Search Functionality**
   - Enter a name in the search box
   - Click "Filter"
   - Results should be filtered

5. **Test Filter by User ID**
   - Enter a userId in the User ID filter
   - Click "Filter"
   - Results should be filtered by that userId

6. **View Kundli Details**
   - Click the eye icon on any kundli
   - Should navigate to detail page
   - Should show all kundli information

7. **Test Delete Functionality**
   - Click the delete icon (trash) on any kundli
   - Confirm deletion
   - Kundli should be removed from the list

## 📋 Complete Test Cases

### API Endpoint Tests

| Test Case | Endpoint | Method | Expected Result |
|-----------|----------|--------|----------------|
| Save valid kundli | `/api/saved-kundli` | POST | 201 Created |
| Save with missing fields | `/api/saved-kundli` | POST | 400 Bad Request |
| Save with invalid gender | `/api/saved-kundli` | POST | 400 Bad Request |
| Get user kundlis | `/api/saved-kundli/user/:userId` | GET | 200 OK with array |
| Get all kundlis | `/api/saved-kundli/all` | GET | 200 OK with pagination |
| Get kundli by ID | `/api/saved-kundli/:id` | GET | 200 OK with kundli data |
| Get non-existent kundli | `/api/saved-kundli/:id` | GET | 404 Not Found |
| Update kundli | `/api/saved-kundli/:id` | PUT | 200 OK with updated data |
| Delete kundli | `/api/saved-kundli/:id` | DELETE | 200 OK |

### Admin Panel Tests

| Test Case | Action | Expected Result |
|-----------|--------|----------------|
| Page loads | Navigate to `/saved-kundli` | Page displays with all kundlis |
| Statistics display | View statistics section | Shows correct counts |
| Search works | Enter search term | Filters results correctly |
| Filter by userId | Enter userId | Shows only that user's kundlis |
| View details | Click eye icon | Shows detail page |
| Delete kundli | Click delete icon | Removes kundli from list |
| Pagination | Navigate pages | Shows correct page of results |

## 🐛 Troubleshooting

### Issue: Server won't start
**Solution:** 
- Check MongoDB connection
- Verify all dependencies are installed: `npm install`
- Check if port is already in use

### Issue: API returns 404
**Solution:**
- Verify routes are registered in `app.js`
- Check the endpoint URL is correct
- Ensure server is running

### Issue: Admin panel shows error
**Solution:**
- Check if you're logged in
- Verify session is active
- Check browser console for errors

### Issue: Database errors
**Solution:**
- Verify MongoDB is running
- Check connection string in `.env`
- Ensure database permissions are correct

## 📝 Test Data Examples

### Valid Kundli Data
```json
{
  "userId": "user123",
  "name": "Rajesh Kumar",
  "dateOfBirth": "1990-08-15",
  "timeOfBirth": "14:30",
  "place": "Mumbai, Maharashtra, India",
  "gender": "male"
}
```

### Another Valid Example
```json
{
  "userId": "user456",
  "name": "Priya Sharma",
  "dateOfBirth": "1995-03-22",
  "timeOfBirth": "09:15",
  "place": "Delhi, India",
  "gender": "female"
}
```

## ✅ Success Criteria

All features are working correctly if:
1. ✅ API endpoints return correct status codes
2. ✅ Data is saved to database correctly
3. ✅ Admin panel displays all saved kundlis
4. ✅ Search and filter work correctly
5. ✅ View and delete operations work
6. ✅ No console errors in browser
7. ✅ No server errors in terminal

## 🎯 Next Steps After Testing

1. **If all tests pass:**
   - Feature is ready for production
   - Update frontend to use the API endpoints
   - Document API for frontend team

2. **If tests fail:**
   - Check error messages
   - Review code for issues
   - Fix and retest

3. **Additional Enhancements (Optional):**
   - Add export functionality
   - Add bulk delete
   - Add edit functionality in admin panel
   - Add more filters (by date, gender, etc.)

## 📞 Support

If you encounter any issues:
1. Check the error messages in server console
2. Check browser console for client-side errors
3. Verify all files are in correct locations
4. Ensure database connection is working
5. Review the code for any typos or missing pieces

