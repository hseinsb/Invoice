// Google Sheets configuration
const SPREADSHEET_ID = '1mcXXq3LmhL3MbDNkk_CDPXCXLNw_bRrsOwyNylG-Qik';
const SHEET_NAME = 'Sheet1';

// JWT signing helper using Node.js built-in crypto
const crypto = require('crypto');

function createJWT(clientEmail, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };
  
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };
  
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(unsignedToken)
    .sign(privateKey, 'base64url');
  
  return `${unsignedToken}.${signature}`;
}

async function getAccessToken() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (!clientEmail || !privateKey) {
    throw new Error('Missing Google credentials');
  }
  
  const jwt = createJWT(clientEmail, privateKey);
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Failed to get access token: ${JSON.stringify(data)}`);
  }
  
  return data.access_token;
}

async function addToGoogleSheets(values) {
  const accessToken = await getAccessToken();
  
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A:G:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [values]
      })
    }
  );
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Google Sheets API error: ${response.status} ${errorData}`);
  }
  
  return await response.json();
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle GET requests (for testing)
  if (req.method === 'GET') {
    res.status(200).json({ 
      message: 'Google Sheets API endpoint is running',
      timestamp: new Date().toISOString(),
      spreadsheetId: SPREADSHEET_ID,
      sheetName: SHEET_NAME
    });
    return;
  }

  // Only allow POST requests for actual data
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const paymentData = req.body;

    // Validate required fields
    if (!paymentData.date || !paymentData.customerName || !paymentData.paymentAmount) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Prepare the data row
    const values = [
      paymentData.date,
      paymentData.customerInsuranceType,
      paymentData.customerName,
      paymentData.paymentType,
      paymentData.paymentAmount,
      paymentData.whosPaying,
      paymentData.notes
    ];

    // Add the row to the sheet
    const response = await addToGoogleSheets(values);

    console.log('Payment record added to Google Sheets:', response);

    res.status(200).json({
      success: true,
      message: 'Payment record added successfully',
      response: response
    });

  } catch (error) {
    console.error('Error adding payment record to Google Sheets:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};
