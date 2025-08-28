// Serverless API endpoint for Google Sheets integration
const API_ENDPOINT = process.env.NODE_ENV === 'production' 
  ? 'https://invoice-six-liart.vercel.app/api/add-payment'
  : 'http://localhost:3000/api/add-payment'; // For local development

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
      console.log('Adding payment record to Google Sheets via serverless API:', paymentData);

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Payment record added to Google Sheets:', result);
        return true;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Failed to add payment record:', response.statusText, errorData);
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
