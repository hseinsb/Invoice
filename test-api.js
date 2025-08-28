// Test script for the Google Sheets API
// Run with: node test-api.js

const testData = {
  date: '2024-01-15',
  customerInsuranceType: 'Customer',
  customerName: 'Test Customer',
  paymentType: 'Cash',
  paymentAmount: 100.00,
  whosPaying: 'Customer Walk In',
  notes: 'Test payment from API script'
};

// Test against local development server
const LOCAL_URL = 'http://localhost:3000/api/add-payment';

// Test against production (replace with your actual Vercel URL)
const PROD_URL = 'https://your-app.vercel.app/api/add-payment';

async function testAPI(url, label) {
  console.log(`\n🧪 Testing ${label}...`);
  console.log(`URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Success:', result);
    } else {
      const error = await response.text();
      console.log('❌ Failed:', response.status, error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Google Sheets API Test Script');
  console.log('Test data:', testData);

  // Test production endpoint (replace URL with your actual deployment)
  await testAPI(PROD_URL, 'Production API');
  
  // Uncomment to test local development server
  // await testAPI(LOCAL_URL, 'Local Development API');
}

// Run if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testAPI, testData };
