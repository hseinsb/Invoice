/**
 * Firebase to Google Sheets Integration
 * This script connects to Firebase Firestore and syncs payment data to Google Sheets
 */

// Configuration - Replace with your actual Firebase config
const FIREBASE_CONFIG = {
  projectId: 'invoice-c762f',
  // We'll use the Firebase REST API (no service account needed for read operations)
};

const SHEET_NAME = 'Sheet1';

/**
 * Main function to sync payments from Firebase to Google Sheets
 */
function syncPaymentsFromFirebase() {
  try {
    console.log('Starting Firebase to Sheets sync...');
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    
    // Get existing data to avoid duplicates
    const existingData = getExistingPaymentIds(sheet);
    console.log('Found', existingData.size, 'existing payment records');
    
    // Fetch invoices from Firebase
    const invoices = fetchInvoicesFromFirebase();
    console.log('Fetched', invoices.length, 'invoices from Firebase');
    
    let newPaymentsAdded = 0;
    
    // Process each invoice and its payments
    invoices.forEach(invoice => {
      if (invoice.payments && invoice.payments.length > 0) {
        invoice.payments.forEach(payment => {
          const paymentId = `${invoice.id}_${payment.date}_${payment.amount}`;
          
          // Skip if we already have this payment
          if (!existingData.has(paymentId)) {
            addPaymentToSheet(sheet, invoice, payment);
            newPaymentsAdded++;
            console.log('Added payment:', paymentId);
          }
        });
      }
    });
    
    console.log('Sync completed. Added', newPaymentsAdded, 'new payments');
    return `Sync completed. Added ${newPaymentsAdded} new payments`;
    
  } catch (error) {
    console.error('Error in syncPaymentsFromFirebase:', error);
    throw error;
  }
}

/**
 * Fetch invoices from Firebase using REST API
 */
function fetchInvoicesFromFirebase() {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/invoices`;
    
    const response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (response.getResponseCode() !== 200) {
      throw new Error(`Firebase API error: ${response.getResponseCode()} - ${response.getContentText()}`);
    }
    
    const data = JSON.parse(response.getContentText());
    
    if (!data.documents) {
      console.log('No invoices found in Firebase');
      return [];
    }
    
    // Parse Firebase document format
    return data.documents.map(doc => {
      const fields = doc.fields || {};
      const invoice = {
        id: doc.name.split('/').pop(), // Extract document ID from path
        customerName: fields.customerName?.stringValue || '',
        customerInsuranceType: fields.customerInsuranceType?.stringValue || 'customer',
        paymentType: fields.paymentType?.stringValue || 'cash',
        whosPaying: fields.whosPaying?.stringValue || 'customer_walk_in',
        notes: fields.notes?.stringValue || '',
        dueDate: fields.dueDate?.stringValue || '',
        payments: []
      };
      
      // Parse payments array
      if (fields.payments?.arrayValue?.values) {
        invoice.payments = fields.payments.arrayValue.values.map(paymentValue => {
          const paymentFields = paymentValue.mapValue?.fields || {};
          return {
            amount: parseFloat(paymentFields.amount?.doubleValue || paymentFields.amount?.integerValue || 0),
            date: paymentFields.date?.stringValue || '',
            method: paymentFields.method?.stringValue || 'cash'
          };
        });
      }
      
      return invoice;
    });
    
  } catch (error) {
    console.error('Error fetching from Firebase:', error);
    throw error;
  }
}

/**
 * Get existing payment IDs from the sheet to avoid duplicates
 */
function getExistingPaymentIds(sheet) {
  const existingIds = new Set();
  
  try {
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return existingIds; // Only header row
    
    // Get all data except header
    const data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
    
    data.forEach(row => {
      const [date, , customerName, , paymentAmount] = row;
      if (date && customerName && paymentAmount) {
        // Create a unique ID from the data
        const id = `${customerName}_${date}_${paymentAmount}`.replace(/\s+/g, '_');
        existingIds.add(id);
      }
    });
    
  } catch (error) {
    console.error('Error getting existing payment IDs:', error);
  }
  
  return existingIds;
}

/**
 * Add a payment record to the Google Sheet
 */
function addPaymentToSheet(sheet, invoice, payment) {
  try {
    // Format the data for the sheet
    const rowData = [
      payment.date || invoice.dueDate || new Date().toISOString().split('T')[0], // Date
      formatEnumValue(invoice.customerInsuranceType), // Customer/Insurance
      invoice.customerName, // Customer Name
      formatEnumValue(payment.method || invoice.paymentType), // Payment Type
      payment.amount, // Payment Amount
      formatEnumValue(invoice.whosPaying), // Who's Paying
      invoice.notes, // Notes
      new Date().toISOString() // Sync timestamp
    ];
    
    sheet.appendRow(rowData);
    
  } catch (error) {
    console.error('Error adding payment to sheet:', error);
    throw error;
  }
}

/**
 * Format enum values for display (convert snake_case to Title Case)
 */
function formatEnumValue(value) {
  if (!value) return '';
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Set up the sheet headers
 */
function setupHeaders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  
  // Check if headers already exist
  if (sheet.getLastRow() === 0) {
    const headers = [
      'Date',
      'Customer/Insurance',
      'Customer Name',
      'Payment Type',
      'Payment Amount',
      'Who\'s Paying',
      'Notes',
      'Sync Timestamp'
    ];
    
    sheet.appendRow(headers);
    
    // Format the header row
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f0f0f0');
    
    console.log('Headers added successfully');
  } else {
    console.log('Headers already exist');
  }
}

/**
 * Create a time-based trigger to run sync automatically
 */
function createSyncTrigger() {
  // Delete existing triggers first
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'syncPaymentsFromFirebase') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new trigger to run every 10 minutes
  ScriptApp.newTrigger('syncPaymentsFromFirebase')
    .timeBased()
    .everyMinutes(10)
    .create();
    
  console.log('Sync trigger created - will run every 10 minutes');
}

/**
 * Manual test function
 */
function testSync() {
  try {
    const result = syncPaymentsFromFirebase();
    console.log('Test sync result:', result);
    return result;
  } catch (error) {
    console.error('Test sync failed:', error);
    return `Error: ${error.message}`;
  }
}

/**
 * Web app endpoints for testing
 */
function doGet(e) {
  try {
    const result = syncPaymentsFromFirebase();
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: result,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  // Trigger manual sync via POST
  return doGet(e);
}
