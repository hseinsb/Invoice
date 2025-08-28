// Vercel Serverless Function for Google Sheets Integration
// This keeps your service account credentials secure on the server

const { google } = require('googleapis');

// Service account credentials from environment variables
const GOOGLE_CREDENTIALS = {
  type: 'service_account',
  project_id: process.env.GOOGLE_PROJECT_ID,
  private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
  universe_domain: 'googleapis.com'
};

// Google Sheets configuration
const SPREADSHEET_ID = '1mcXXq3LmhL3MbDNkk_CDPXCXLNw_bRrsOwyNylG-Qik';
const SHEET_NAME = 'Sheet1';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
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

    // Validate environment variables
    if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_CLIENT_EMAIL) {
      console.error('Missing Google credentials in environment variables');
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: GOOGLE_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Prepare the data row
    const values = [
      [
        paymentData.date,
        paymentData.customerInsuranceType,
        paymentData.customerName,
        paymentData.paymentType,
        paymentData.paymentAmount,
        paymentData.whosPaying,
        paymentData.notes
      ]
    ];

    // Add the row to the sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:G`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: values
      }
    });

    console.log('Payment record added to Google Sheets:', response.data);

    res.status(200).json({
      success: true,
      message: 'Payment record added successfully',
      range: response.data.updates?.updatedRange
    });

  } catch (error) {
    console.error('Error adding payment record to Google Sheets:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
