/**
 * Google Apps Script for Whittico Collision Invoice System
 * Paste this code into your Google Sheet's Apps Script editor
 */

function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Get the active spreadsheet and first sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
    
    // Prepare the row data in the correct order
    const rowData = [
      data.date,                    // Date
      data.customerInsuranceType,   // Customer/Insurance
      data.customerName,            // Customer name
      data.paymentType,             // Payment type
      data.paymentAmount,           // Payment Amount
      data.whosPaying,              // Who's Paying
      data.notes                    // Notes
    ];
    
    // Add the row to the sheet
    sheet.appendRow(rowData);
    
    // Log for debugging
    console.log('Payment record added:', rowData);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Payment record added successfully',
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Log error for debugging
    console.error('Error in doPost:', error);
    
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Test endpoint to verify the script is working
  return ContentService
    .createTextOutput(JSON.stringify({
      message: 'Google Apps Script is running',
      timestamp: new Date().toISOString(),
      sheetName: SpreadsheetApp.getActiveSpreadsheet().getName()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Optional: Function to set up the header row
 * Run this once to add column headers
 */
function setupHeaders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
  
  // Check if headers already exist
  if (sheet.getLastRow() === 0) {
    const headers = [
      'Date',
      'Customer/Insurance', 
      'Customer Name',
      'Payment Type',
      'Payment Amount',
      'Who\'s Paying',
      'Notes'
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
