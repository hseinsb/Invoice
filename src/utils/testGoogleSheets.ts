import googleSheetsService from '../services/googleSheets';

export const testGoogleSheetsConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing Google Sheets connection...');
    
    // Test data to append
    const testData = {
      date: new Date().toISOString().split('T')[0],
      customerInsuranceType: 'Customer' as const,
      customerName: 'Test Customer',
      paymentType: 'Cash' as const,
      paymentAmount: 100.00,
      whosPaying: 'Customer Walk In' as const,
      notes: 'Test payment from invoice system'
    };

    const result = await googleSheetsService.addPaymentRecord(testData);
    
    if (result) {
      console.log('✅ Google Sheets connection successful!');
      return true;
    } else {
      console.log('❌ Google Sheets connection failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Google Sheets test error:', error);
    return false;
  }
};
