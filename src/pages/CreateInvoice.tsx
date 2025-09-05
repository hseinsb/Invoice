import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { LineItem } from '../types';
import toast from 'react-hot-toast';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const CreateInvoice: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [customerName, setCustomerName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    // Set due date to today's date
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  
  // Additional fields for Google Sheets integration
  const [customerInsuranceType, setCustomerInsuranceType] = useState<'customer' | 'insurance' | 'other'>('customer');
  const [paymentType, setPaymentType] = useState<'cash' | 'check' | 'zelle' | 'ach' | 'credit' | 'debit'>('cash');
  const [whosPaying, setWhosPaying] = useState<'deductible' | 'drp_payment' | 'customer_walk_in' | 'dealer_repair' | 'other'>('customer_walk_in');
  
  // Line items state
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unitPrice: 0, taxable: false }
  ]);

  // Helper functions for line items
  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0, taxable: false }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setLineItems(updatedItems);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let taxableAmount = 0;

    lineItems.forEach((item) => {
      const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
      subtotal += lineTotal;
      if (item.taxable) {
        taxableAmount += lineTotal;
      }
    });

    const taxRate = 0.06; // 6% Michigan sales tax
    const taxAmount = taxableAmount * taxRate;
    const total = subtotal + taxAmount;

    return { subtotal, taxableAmount, taxAmount, total, taxRate };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    if (!customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }

    setLoading(true);
    try {
      console.log('Creating invoice with totals:', totals);

      // Create invoice document
      const invoiceData = {
        customerName: customerName.trim(),
        customerId: customerName.trim(),
        date,
        dueDate,
        lineItems,
        notes: notes.trim(),
        status: 'draft',
        balance: totals.total,
        payments: [],
        totals,
        // Additional fields for Google Sheets integration
        customerInsuranceType,
        paymentType,
        whosPaying,
        createdByUid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('Saving invoice data:', invoiceData);

      const docRef = await addDoc(collection(db, 'invoices'), invoiceData);
      
      console.log('Invoice saved with ID:', docRef.id);
      
      // Store invoice data in session storage as backup
      const completeInvoiceData = {
        id: docRef.id,
        ...invoiceData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      sessionStorage.setItem(`invoice_${docRef.id}`, JSON.stringify(completeInvoiceData));
      console.log('Invoice data also stored in session storage');
      
      toast.success('Invoice created successfully');
      
      // Navigate to the invoice detail page
      navigate(`/invoices/${docRef.id}`);
      
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast.error(`Failed to create invoice: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">User not authenticated</p>
          <button onClick={() => window.location.reload()} className="mt-4 btn-primary">
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/invoices')}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                Create New Invoice
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Fill out the details below to create a new invoice
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="card p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="label">Customer Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="input"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="label">Invoice Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Due Date *</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Customer/Insurance Type *</label>
                  <select
                    value={customerInsuranceType}
                    onChange={(e) => setCustomerInsuranceType(e.target.value as any)}
                    className="input"
                    required
                  >
                    <option value="customer">Customer</option>
                    <option value="insurance">Insurance</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="label">Payment Type *</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                    className="input"
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="zelle">Zelle</option>
                    <option value="ach">ACH</option>
                    <option value="credit">Credit</option>
                    <option value="debit">Debit</option>
                  </select>
                </div>

                <div>
                  <label className="label">Who's Paying *</label>
                  <select
                    value={whosPaying}
                    onChange={(e) => setWhosPaying(e.target.value as any)}
                    className="input"
                    required
                  >
                    <option value="deductible">Deductible</option>
                    <option value="drp_payment">DRP Payment</option>
                    <option value="customer_walk_in">Customer Walk In</option>
                    <option value="dealer_repair">Dealer Repair</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Line Items</h3>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="btn-secondary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </button>
              </div>

              <div className="space-y-4">
                {lineItems.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                      <div className="sm:col-span-5">
                        <label className="label">Description *</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          className="input"
                          placeholder="Labor, parts, etc."
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="label">Quantity *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="input"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="label">Unit Price *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="input"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2 flex items-center">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={item.taxable}
                            onChange={(e) => updateLineItem(index, 'taxable', e.target.checked)}
                            className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Taxable</span>
                        </label>
                      </div>

                      <div className="sm:col-span-1 flex items-end">
                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLineItem(index)}
                            className="p-2 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="card p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="input"
                placeholder="Additional notes or terms..."
              />
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Invoice Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxable Amount:</span>
                  <span className="font-medium">${totals.taxableAmount.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (6%):</span>
                  <span className="font-medium">${totals.taxAmount.toFixed(2)}</span>
                </div>
                
                <hr className="border-gray-200" />
                
                <div className="flex justify-between">
                  <span className="text-base font-medium text-gray-900">Total:</span>
                  <span className="text-lg font-bold text-gray-900">${totals.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex justify-center"
                >
                  {loading ? <LoadingSpinner size="sm" /> : 'Create Invoice'}
                </button>
                
                <button
                  type="button"
                  onClick={() => navigate('/invoices')}
                  className="w-full btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoice;