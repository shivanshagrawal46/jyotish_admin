/**
 * Test script for Saved Kundli API endpoints
 * Run this with: node test_saved_kundli.js
 * Make sure your server is running on http://localhost:5000
 */

const BASE_URL = 'http://localhost:5000/api/saved-kundli';

// Test data
const testKundli = {
  userId: 'test_user_123',
  name: 'Test User',
  dateOfBirth: '1990-08-15',
  timeOfBirth: '14:30',
  place: 'New Delhi, India',
  gender: 'male'
};

let createdKundliId = null;

// Helper function to make API calls
async function apiCall(method, endpoint, data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

// Test functions
async function testSaveKundli() {
  console.log('\n1. Testing POST / - Save a new kundli');
  const result = await apiCall('POST', '/', testKundli);
  
  if (result.status === 201 && result.data.success) {
    console.log('✅ PASS: Kundli saved successfully');
    createdKundliId = result.data.data._id;
    console.log('   Created ID:', createdKundliId);
    return true;
  } else {
    console.log('❌ FAIL:', result.data?.message || result.error);
    return false;
  }
}

async function testSaveKundliInvalid() {
  console.log('\n2. Testing POST / - Save with missing fields (should fail)');
  const invalidData = { ...testKundli };
  delete invalidData.name;
  
  const result = await apiCall('POST', '/', invalidData);
  
  if (result.status === 400 && !result.data.success) {
    console.log('✅ PASS: Correctly rejected invalid data');
    return true;
  } else {
    console.log('❌ FAIL: Should have rejected invalid data');
    return false;
  }
}

async function testGetUserKundlis() {
  console.log('\n3. Testing GET /user/:userId - Get kundlis for user');
  const result = await apiCall('GET', `/user/${testKundli.userId}`);
  
  if (result.status === 200 && result.data.success) {
    console.log('✅ PASS: Retrieved kundlis for user');
    console.log('   Count:', result.data.count);
    return true;
  } else {
    console.log('❌ FAIL:', result.data?.message || result.error);
    return false;
  }
}

async function testGetAllKundlis() {
  console.log('\n4. Testing GET /all - Get all kundlis');
  const result = await apiCall('GET', '/all?page=1&limit=10');
  
  if (result.status === 200 && result.data.success) {
    console.log('✅ PASS: Retrieved all kundlis');
    console.log('   Total:', result.data.pagination.totalKundlis);
    return true;
  } else {
    console.log('❌ FAIL:', result.data?.message || result.error);
    return false;
  }
}

async function testGetKundliById() {
  if (!createdKundliId) {
    console.log('\n5. Testing GET /:id - Skipped (no ID available)');
    return false;
  }
  
  console.log('\n5. Testing GET /:id - Get kundli by ID');
  const result = await apiCall('GET', `/${createdKundliId}`);
  
  if (result.status === 200 && result.data.success) {
    console.log('✅ PASS: Retrieved kundli by ID');
    console.log('   Name:', result.data.data.name);
    return true;
  } else {
    console.log('❌ FAIL:', result.data?.message || result.error);
    return false;
  }
}

async function testUpdateKundli() {
  if (!createdKundliId) {
    console.log('\n6. Testing PUT /:id - Skipped (no ID available)');
    return false;
  }
  
  console.log('\n6. Testing PUT /:id - Update kundli');
  const updateData = {
    name: 'Updated Test User',
    timeOfBirth: '15:00'
  };
  
  const result = await apiCall('PUT', `/${createdKundliId}`, updateData);
  
  if (result.status === 200 && result.data.success) {
    console.log('✅ PASS: Updated kundli successfully');
    console.log('   Updated name:', result.data.data.name);
    return true;
  } else {
    console.log('❌ FAIL:', result.data?.message || result.error);
    return false;
  }
}

async function testDeleteKundli() {
  if (!createdKundliId) {
    console.log('\n7. Testing DELETE /:id - Skipped (no ID available)');
    return false;
  }
  
  console.log('\n7. Testing DELETE /:id - Delete kundli');
  const result = await apiCall('DELETE', `/${createdKundliId}`);
  
  if (result.status === 200 && result.data.success) {
    console.log('✅ PASS: Deleted kundli successfully');
    return true;
  } else {
    console.log('❌ FAIL:', result.data?.message || result.error);
    return false;
  }
}

async function testGetNonExistentKundli() {
  console.log('\n8. Testing GET /:id - Get non-existent kundli (should fail)');
  const fakeId = '507f1f77bcf86cd799439999';
  const result = await apiCall('GET', `/${fakeId}`);
  
  if (result.status === 404 && !result.data.success) {
    console.log('✅ PASS: Correctly returned 404 for non-existent kundli');
    return true;
  } else {
    console.log('❌ FAIL: Should have returned 404');
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('='.repeat(60));
  console.log('Saved Kundli API Test Suite');
  console.log('='.repeat(60));
  
  const results = [];
  
  // Run tests in sequence
  results.push(await testSaveKundli());
  results.push(await testSaveKundliInvalid());
  results.push(await testGetUserKundlis());
  results.push(await testGetAllKundlis());
  results.push(await testGetKundliById());
  results.push(await testUpdateKundli());
  results.push(await testGetNonExistentKundli());
  results.push(await testDeleteKundli());
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('Error: This script requires Node.js 18+ or install node-fetch');
  console.error('Run: npm install node-fetch');
  process.exit(1);
}

// Run tests
runTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});

