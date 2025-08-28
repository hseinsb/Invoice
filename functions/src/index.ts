import {onCall, HttpsError} from 'firebase-functions/v2/https';
import {onDocumentCreated} from 'firebase-functions/v2/firestore';
import {initializeApp} from 'firebase-admin/app';
import {getFirestore, FieldValue} from 'firebase-admin/firestore';

// Export Google Sheets function
export {addPaymentToSheet} from './googleSheets';

initializeApp();
const db = getFirestore();

interface FinalizeInvoiceData {
  invoiceId: string;
}

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxable: boolean;
}

interface Invoice {
  customerId: string;
  date: string;
  dueDate: string;
  status: string;
  vehicle: {
    year?: string;
    make?: string;
    model?: string;
    vin?: string;
  };
  claim: {
    claimNumber?: string;
    insuranceCompany?: string;
  };
  lineItems: InvoiceLineItem[];
  notes?: string;
  createdByUid: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

// Callable function to finalize an invoice with proper numbering
export const finalizeInvoice = onCall(async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const data = request.data as FinalizeInvoiceData;
  const {invoiceId} = data;

  if (!invoiceId) {
    throw new HttpsError('invalid-argument', 'Invoice ID is required');
  }

  try {
    // Use a transaction to ensure atomicity
    const result = await db.runTransaction(async (transaction) => {
      // Get the company settings
      const companyRef = db.doc('settings/company');
      const companyDoc = await transaction.get(companyRef);
      
      if (!companyDoc.exists) {
        throw new HttpsError('not-found', 'Company settings not found');
      }

      const companyData = companyDoc.data()!;
      const invoicePrefix = companyData.invoicePrefix || 'WC';
      const nextSeq = companyData.nextInvoiceSeq || 1;

      // Get the invoice
      const invoiceRef = db.doc(`invoices/${invoiceId}`);
      const invoiceDoc = await transaction.get(invoiceRef);
      
      if (!invoiceDoc.exists) {
        throw new HttpsError('not-found', 'Invoice not found');
      }

      const invoiceData = invoiceDoc.data() as Invoice;

      // Check if already finalized
      if (invoiceData.status === 'finalized' || invoiceData.status === 'paid') {
        throw new HttpsError('failed-precondition', 'Invoice is already finalized');
      }

      // Generate invoice number
      const currentYear = new Date().getFullYear();
      const paddedSeq = nextSeq.toString().padStart(5, '0');
      const invoiceNo = `${invoicePrefix}-${currentYear}-${paddedSeq}`;

      // Calculate totals
      const lineItems = invoiceData.lineItems || [];
      let subtotal = 0;
      let taxableAmount = 0;

      lineItems.forEach((item: InvoiceLineItem) => {
        const lineTotal = item.quantity * item.unitPrice;
        subtotal += lineTotal;
        if (item.taxable) {
          taxableAmount += lineTotal;
        }
      });

      const taxRate = companyData.defaultTaxRateParts || 0.06; // 6% Michigan sales tax
      const taxAmount = taxableAmount * taxRate;
      const total = subtotal + taxAmount;

      const totals = {
        subtotal,
        taxableAmount,
        taxAmount,
        taxRate,
        total
      };

      // Update the invoice
      transaction.update(invoiceRef, {
        invoiceNo,
        status: 'finalized',
        totals,
        balance: total,
        payments: [],
        updatedAt: FieldValue.serverTimestamp()
      });

      // Increment the sequence number
      transaction.update(companyRef, {
        nextInvoiceSeq: nextSeq + 1,
        updatedAt: FieldValue.serverTimestamp()
      });

      return {invoiceNo, totals};
    });

    return result;
  } catch (error: any) {
    console.error('Error finalizing invoice:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to finalize invoice');
  }
});

// Function to automatically calculate totals when line items are updated
export const onInvoiceUpdate = onDocumentCreated('invoices/{invoiceId}', async (event) => {
  const invoiceData = event.data?.data();
  
  if (!invoiceData || invoiceData.status === 'finalized' || invoiceData.status === 'paid') {
    return;
  }

  try {
    // Get company settings for tax rate
    const companyDoc = await db.doc('settings/company').get();
    const companyData = companyDoc.data();
    const taxRate = companyData?.defaultTaxRateParts || 0.06;

    const lineItems = invoiceData.lineItems || [];
    let subtotal = 0;
    let taxableAmount = 0;

    lineItems.forEach((item: InvoiceLineItem) => {
      const lineTotal = item.quantity * item.unitPrice;
      subtotal += lineTotal;
      if (item.taxable) {
        taxableAmount += lineTotal;
      }
    });

    const taxAmount = taxableAmount * taxRate;
    const total = subtotal + taxAmount;

    const totals = {
      subtotal,
      taxableAmount,
      taxAmount,
      taxRate,
      total
    };

    // Update the invoice with calculated totals
    await event.data?.ref.update({
      totals,
      balance: total,
      updatedAt: FieldValue.serverTimestamp()
    });

  } catch (error) {
    console.error('Error calculating invoice totals:', error);
  }
});

// Callable function to record a payment
export const recordPayment = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const {invoiceId, amount, method, date, notes} = request.data;

  if (!invoiceId || !amount || !method) {
    throw new HttpsError('invalid-argument', 'Invoice ID, amount, and method are required');
  }

  try {
    const result = await db.runTransaction(async (transaction) => {
      const invoiceRef = db.doc(`invoices/${invoiceId}`);
      const invoiceDoc = await transaction.get(invoiceRef);
      
      if (!invoiceDoc.exists) {
        throw new HttpsError('not-found', 'Invoice not found');
      }

      const invoiceData = invoiceDoc.data()!;
      const currentBalance = invoiceData.balance || 0;
      const payments = invoiceData.payments || [];

      // Add new payment
      const newPayment = {
        amount: parseFloat(amount),
        method,
        date: date || new Date().toISOString().split('T')[0],
        notes: notes || '',
        recordedAt: FieldValue.serverTimestamp(),
        recordedByUid: request.auth!.uid
      };

      payments.push(newPayment);

      // Calculate new balance
      const newBalance = Math.max(0, currentBalance - parseFloat(amount));
      
      // Determine new status
      let newStatus = invoiceData.status;
      if (newBalance === 0) {
        newStatus = 'paid';
      } else if (newBalance < currentBalance) {
        newStatus = 'partial';
      }

      // Update invoice
      transaction.update(invoiceRef, {
        payments,
        balance: newBalance,
        status: newStatus,
        updatedAt: FieldValue.serverTimestamp()
      });

      return {newBalance, newStatus};
    });

    return result;
  } catch (error: any) {
    console.error('Error recording payment:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to record payment');
  }
});
