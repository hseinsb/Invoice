export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role?: 'owner' | 'staff';
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  insuranceCompany?: string;
  policyNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  createdByUid: string;
}

export interface Vehicle {
  year?: string;
  make?: string;
  model?: string;
  vin?: string;
  licensePlate?: string;
  color?: string;
}

export interface Claim {
  claimNumber?: string;
  insuranceCompany?: string;
  adjusterName?: string;
  adjusterPhone?: string;
  dateOfLoss?: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxable: boolean;
}

export interface Payment {
  amount: number;
  method: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'insurance';
  date: string;
  notes?: string;
  recordedAt: Date;
  recordedByUid: string;
}

export interface InvoiceTotals {
  subtotal: number;
  taxableAmount: number;
  taxAmount: number;
  taxRate: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNo?: string;
  date: string;
  dueDate: string;
  status: 'draft' | 'finalized' | 'partial' | 'paid' | 'void';
  customerId: string;
  customerName: string;
  customer?: Customer; // Populated for UI
  vehicle?: Vehicle; // Optional since we removed it
  claim?: Claim; // Optional since we removed it
  lineItems: LineItem[];
  totals?: InvoiceTotals;
  payments: Payment[];
  balance: number;
  notes?: string;
  pdfUrl?: string;
  // Google Sheets integration fields
  customerInsuranceType: 'customer' | 'insurance' | 'other';
  paymentType: 'cash' | 'check' | 'zelle' | 'ach' | 'credit' | 'debit';
  whosPaying: 'deductible' | 'drp_payment' | 'customer_walk_in' | 'dealer_repair' | 'other';
  createdAt: Date;
  updatedAt: Date;
  createdByUid: string;
}

export interface CompanySettings {
  legalName: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phone: string;
  email: string;
  ein?: string;
  logoUrl?: string;
  invoicePrefix: string;
  nextInvoiceSeq: number;
  defaultTaxRateParts: number;
  terms: string;
  updatedAt: Date;
}
