// Google Apps Script Web App URL
// You'll replace this with your actual Apps Script web app URL after deployment
const APPS_SCRIPT_URL = process.env.VITE_APPS_SCRIPT_URL || 'YOUR_APPS_SCRIPT_URL_HERE';

export interface PaymentSheetData {
  date: string; // Due date from invoice
  customerInsuranceType: 'Customer' | 'Insurance' | 'Other';
  customerName: string;
  paymentType: 'Cash' | 'Check' | 'Zelle' | 'ACH' | 'Credit' | 'Debit';
  paymentAmount: number;
  whosPaying: 'Deductible' | 'DRP Payment' | 'Customer Walk In' | 'Dealer Repair' | 'Other';
  notes: string;
}

class GoogleSheetsService {
  constructor() {
    // Simple constructor - serverless function handles all the complexity
  }

  async addPaymentRecord(paymentData: PaymentSheetData): Promise<boolean> {
    try {
      console.log('Adding payment record to Google Sheets via Apps Script:', paymentData);

      // Check if Apps Script URL is configured
      if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
        console.error('❌ Apps Script URL not configured. Please set VITE_APPS_SCRIPT_URL environment variable.');
        return false;
      }

      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
        mode: 'cors' // Apps Script supports CORS
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Payment record added to Google Sheets:', result);
        return result.success !== false; // Apps Script returns success field
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('❌ Failed to add payment record:', response.statusText, errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ Error adding payment record to Google Sheets:', error);
      return false;
    }
  }

  // Helper method to format enum values for display
  private formatEnumValue(value: string): string {
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Method to format payment data from invoice
  formatPaymentData(invoice: any, paymentAmount: number): PaymentSheetData {
    return {
      date: invoice.dueDate,
      customerInsuranceType: this.formatEnumValue(invoice.customerInsuranceType),
      customerName: invoice.customerName,
      paymentType: this.formatEnumValue(invoice.paymentType),
      paymentAmount: paymentAmount,
      whosPaying: this.formatEnumValue(invoice.whosPaying),
      notes: invoice.notes || ''
    };
  }
}

export const googleSheetsService = new GoogleSheetsService();
export default googleSheetsService;
