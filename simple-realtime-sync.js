/**
 * SIMPLE Real-Time Firebase to Google Sheets Sync
 * This version is much simpler and more reliable
 */

const FIREBASE_CONFIG = {
  projectId: 'invoice-c762f'
};

const SHEET_NAME = 'Sheet1';

/**
 * Simple sync that always works - fetches recent invoices and syncs payments
 */
function syncPayments() {
  try {
    console.log('Starting simple payment sync...');
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    
    // Get existing payment IDs to avoid duplicates
    const existingPayments = getExistingPaymentIds(sheet);
    console.log('Found', existingPayments.size, 'existing payments in sheet');
    
    // Fetch all invoices from Firebase (simplified approach)
    const invoices = fetchAllInvoices();
    console.log('Fetched', invoices.length, 'invoices from Firebase');
    
    let newPaymentsAdded = 0;
    
    // Process each invoice and its payments
    invoices.forEach(invoice => {
      if (invoice.payments && invoice.payments.length > 0) {
        invoice.payments.forEach(payment => {
          // Create unique payment ID
          const paymentId = createPaymentId(invoice, payment);
          
          // Only add if we haven't seen this payment before
          if (!existingPayments.has(paymentId)) {
            addPaymentToSheet(sheet, invoice, payment, paymentId);
            newPaymentsAdded++;
            console.log('Added new payment:', paymentId);
          }
        });
      }
    });
    
    console.log('Sync completed. Added', newPaymentsAdded, 'new payments');
    return `Sync completed. Added ${newPaymentsAdded} new payments`;
    
  } catch (error) {
    console.error('Error in syncPayments:', error);
    return `Error: ${error.message}`;
  }
}

/**
 * Fetch all invoices from Firebase
 */
function fetchAllInvoices() {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/invoices`;
    
    const response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (response.getResponseCode() !== 200) {
      throw new Error(`Firebase API error: ${response.getResponseCode()}`);
    }
    
    const data = JSON.parse(response.getContentText());
    
    if (!data.documents) {
      return [];
    }
    
    // Parse Firebase documents
    return data.documents.map(doc => {
      const fields = doc.fields || {};
      
      const invoice = {
        id: doc.name.split('/').pop(),
        customerName: fields.customerName?.stringValue || '',
        customerInsuranceType: fields.customerInsuranceType?.stringValue || 'customer',
        paymentType: fields.paymentType?.stringValue || 'cash',
        whosPaying: fields.whosPaying?.stringValue || 'customer_walk_in',
        notes: fields.notes?.stringValue || '',
        dueDate: fields.dueDate?.stringValue || '',
        payments: []
      };
      
      // Parse payments
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
    console.error('Error fetching invoices:', error);
    throw error;
  }
}

/**
 * Get existing payment IDs from sheet
 */
function getExistingPaymentIds(sheet) {
  const existingIds = new Set();
  
  try {
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return existingIds;
    
    // Check if there's a Payment ID column (column H)
    const range = sheet.getRange(2, 8, lastRow - 1, 1); // Column H (Payment ID)
    const values = range.getValues();
    
    values.forEach(row => {
      if (row[0]) {
        existingIds.add(row[0].toString());
      }
    });
    
  } catch (error) {
    console.error('Error getting existing payment IDs:', error);
  }
  
  return existingIds;
}

/**
 * Create unique payment ID
 */
function createPaymentId(invoice, payment) {
  return `${invoice.id}_${payment.date}_${payment.amount}_${payment.method}`;
}

/**
 * Add payment to sheet with unique ID
 */
function addPaymentToSheet(sheet, invoice, payment, paymentId) {
  try {
    const now = new Date();
    const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const timestamp = estTime.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' EST');
    
    const rowData = [
      payment.date || invoice.dueDate || new Date().toISOString().split('T')[0], // A: Date
      formatEnumValue(invoice.customerInsuranceType), // B: Customer/Insurance
      invoice.customerName, // C: Customer Name
      formatEnumValue(payment.method || invoice.paymentType), // D: Payment Type
      payment.amount, // E: Payment Amount
      formatEnumValue(invoice.whosPaying), // F: Who's Paying
      invoice.notes, // G: Notes
      paymentId, // H: Payment ID (for duplicate detection)
      timestamp // I: Sync Timestamp
    ];
    
    sheet.appendRow(rowData);
    
  } catch (error) {
    console.error('Error adding payment to sheet:', error);
    throw error;
  }
}

/**
 * Format enum values
 */
function formatEnumValue(value) {
  if (!value) return '';
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Set up headers with Payment ID column
 */
function setupHeaders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  
  if (sheet.getLastRow() === 0) {
    const headers = [
      'Date',
      'Customer/Insurance',
      'Customer Name',
      'Payment Type',
      'Payment Amount',
      'Who\'s Paying',
      'Notes',
      'Payment ID',
      'Sync Time'
    ];
    
    sheet.appendRow(headers);
    
    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f0f0f0');
    
    console.log('Headers set up successfully');
  }
}

/**
 * Create frequent sync trigger (every 1 minute)
 */
function createFastSyncTrigger() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'syncPayments') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create 1-minute trigger
  ScriptApp.newTrigger('syncPayments')
    .timeBased()
    .everyMinutes(1)
    .create();
    
  console.log('Fast sync trigger created - runs every 1 minute');
}

/**
 * Test function
 */
function testSync() {
  const result = syncPayments();
  console.log('Test result:', result);
  return result;
}

/**
 * Web app endpoints
 */
function doGet(e) {
  try {
    const result = syncPayments();
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: result,
        timestamp: new Date().toLocaleString("en-US", {timeZone: "America/New_York"})
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toLocaleString("en-US", {timeZone: "America/New_York"})
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  return doGet(e);
}
