// Google Apps Script Web App URL - constructed from environment variables
function getAppsScriptUrl(): string {
  // Option 1: Check for split URL parts
  const base = process.env.VITE_APPS_SCRIPT_BASE;
  const id = process.env.VITE_APPS_SCRIPT_ID;
  
  if (base && id) {
    return `${base}${id}/exec`;
  }
  
  // Option 2: Check for encoded URL
  const encoded = process.env.VITE_APPS_SCRIPT_ENCODED;
  if (encoded) {
    try {
      return atob(encoded);
    } catch (e) {
      console.error('Failed to decode Apps Script URL:', e);
    }
  }
  
  // Option 3: Fallback to direct URL (if Vercel allows it)
  const directUrl = process.env.VITE_APPS_SCRIPT_URL;
  if (directUrl && directUrl !== 'YOUR_APPS_SCRIPT_URL_HERE') {
    return directUrl;
  }
  
  return 'YOUR_APPS_SCRIPT_URL_HERE';
}

const APPS_SCRIPT_URL = getAppsScriptUrl();

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
      console.log('Apps Script URL:', APPS_SCRIPT_URL);

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
