import { google } from 'googleapis';
import * as functions from 'firebase-functions';

// Service account credentials (hardcoded for simplicity)
const GOOGLE_CREDENTIALS = {
  type: 'service_account',
  project_id: 'invoice-c762f',
  private_key_id: '2d1d35f27d012e848d32ddfc330613a6e6c83351',
  private_key: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDHs7S39sQNjes7
efBWRhPu4WIVO+IyxyZABMaSLAHULlGwS776HLEdmQfztOruOMxtgOLYKuuvPhbG
yXDVd5dy04on7Chff6fg2M4q5XhEOD+yoBpfqciIXqTmGHhBZ3U8zuwSoOQIyZae
LWE0LteFawXnFzgRLlahuDsvqn/2zFvfSUagSODylKaSrWXyNgUfro7xhyScQdwI
PP7H79F6V0FB1+WViiB0XC+RLNmt2dn5fyMNfzb5zidkk2lX4//zcMsmXHGAD/mb
Ep/Kek64PXkZACeiCMpG12pQFftTZBYcTSqebRFxJuk0VWbDpm0V/CDSRarcw0fG
PuxfQsHbAgMBAAECggEANfz1xuQuBXIQHaCuIkzIt8RzxUTOtqaTRyxjWIIQLoIl
MHGR3EEketlzxmVrO+LcFWCKMyGLXPF+q9gqqnMt3Oumhnt4QLUcuBM0zXEC7gJ8
6fgRmTonzgI0N0Z3QEtNbRaNyM15SIzjLLkc9cQSHO4dhueGj1KFNiw9x/mipaAI
ieSlcjbLFCddhWhgw8Ac77ejvpfD2Jv3hawKjmSiiYRRIlksEuxieh5Iwp6UDUNZ
apnQ8Yk+J5dYOi4e8fHLmLKxmXlVem8TUIQmAkNkVUCOxOGkoUFa/KLq3bo18ClW
NzMYOt9s8XTRt0xP9tMp56NisvWnXTNko5gkYf6QJQKBgQDo0RhP9lKe9d7IxLXz
tTuAI1EDctzz2GaB2JxzMWQ1QcC8NP0W6RwoMUmawmrgcKSn4AdcXP3ixXnXoxwy
ZBoKii1oI5QrKzLUFL6NpZDuQaXFkCbyUurEeDYWwt0D5Xs6bOohgfZ5zKLhf2I3
xsDUNZMv5zEIDu6szqTs1Jh8TwKBgQDblnT/ubcRbpzUvbhcBWFxtMFO+qMTQxU5
z6JkNVKS6A8B93GxKPzZnZsvDVEjkdgc2lvJrOIOEG5LH9z2b8WwOOfOBIY+WDVA
wKUi9s5ruzvtoKs9FYYYY3/gfgOL1F0JewxSLEhbtb4MK30yTyVZm3oQxB775gsU
kfENwBHCtQKBgQCaqMyN0gRwtMSaepKkovAz30IiGFvPYSI3f73uiBEZj+SJImo+
nfymdpd+x0hYcHvxSVGaeevuiWC3bxN8JiNmfQRM+dWkF75cRKuRTTtKCzIkW+6D
a7GpcnH8DNblj7ycw12FhOBHaTmKsyR8CPxv/Gcam2pnAARtp5jH+zKQ4QKBgHyM
VkhF2iQ1DRdNlKf9FUwdLhfR6XUfc4aa0ozsAa35mamP5BiMGv6DemWxs/fs3Rtg
bvdw67b2ctiBdh8BPqu5WyFrR4lNFsdnfULbojFQvakGnJnE/44NwZZfYzuIdEzQ
Uii5nUEHUIgukpBae+DbYtznoHtX+6jrLkKSUoCRAoGAQeF/eq+Lo9zcIW64wNd3
0EwzyAMK8DdMn0aOjNV8NDsQbSsQ+RpAN2sUdD4lo9qOiIeTCMehLfNng7Po4uYW
koGab3EJZpGuNfiysXzEDC10zTfo0X01f/q3exV92ag8nshCftPTTdcg0YIHbjR1
+/OzwQH7knGIuz9355WnK7U=
-----END PRIVATE KEY-----`,
  client_email: 'sheets-integration@invoice-c762f.iam.gserviceaccount.com',
  client_id: '106425926145085542191',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/sheets-integration%40invoice-c762f.iam.gserviceaccount.com',
  universe_domain: 'googleapis.com'
};

// Google Sheets configuration
const SPREADSHEET_ID = '1mcXXq3LmhL3MbDNkk_CDPXCXLNw_bRrsOwyNylG-Qik';
const SHEET_NAME = 'Sheet1';

interface PaymentData {
  date: string;
  customerInsuranceType: string;
  customerName: string;
  paymentType: string;
  paymentAmount: number;
  whosPaying: string;
  notes: string;
}

export const addPaymentToSheet = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const paymentData: PaymentData = req.body;

    // Validate required fields
    if (!paymentData.date || !paymentData.customerName || !paymentData.paymentAmount) {
      res.status(400).json({ error: 'Missing required fields' });
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
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
