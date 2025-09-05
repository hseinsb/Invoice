import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Invoice, Payment, CompanySettings } from '../types';
import { ArrowLeft, Edit, DollarSign, FileText, Printer, CheckCircle, Trash2 } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
// Google Sheets integration now handled automatically by Firebase sync

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [recordingPayment, setRecordingPayment] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) {
        console.error('No invoice ID provided');
        setLoading(false);
        return;
      }

      console.log('Fetching invoice with ID:', id);

      try {
        // Fetch both invoice and company settings
        const [invoiceDoc, settingsDoc] = await Promise.all([
          getDoc(doc(db, 'invoices', id)),
          getDoc(doc(db, 'settings', 'company'))
        ]);
        
        console.log('Invoice document exists:', invoiceDoc.exists());
        console.log('Settings document exists:', settingsDoc.exists());

        // Load company settings
        if (settingsDoc.exists()) {
          const settingsData = {
            ...settingsDoc.data(),
            updatedAt: settingsDoc.data().updatedAt?.toDate() || new Date()
          } as CompanySettings;
          setCompanySettings(settingsData);
          console.log('Company settings loaded:', settingsData);
        }
        
        if (invoiceDoc.exists()) {
          const rawData = invoiceDoc.data();
          console.log('Raw invoice data:', rawData);
          
          const invoiceData = {
            id: invoiceDoc.id,
            ...rawData,
            createdAt: rawData.createdAt?.toDate() || new Date(),
            updatedAt: rawData.updatedAt?.toDate() || new Date()
          } as Invoice;

          console.log('Processed invoice data:', invoiceData);
          setInvoice(invoiceData);
        } else {
          // Try to get data from session storage as fallback
          console.log('Checking session storage for invoice data...');
          const sessionData = sessionStorage.getItem(`invoice_${id}`);
          
          if (sessionData) {
            console.log('Found invoice data in session storage');
            const invoiceData = JSON.parse(sessionData);
            invoiceData.createdAt = new Date(invoiceData.createdAt);
            invoiceData.updatedAt = new Date(invoiceData.updatedAt);
            setInvoice(invoiceData);
            toast.success('Invoice loaded from local storage');
          } else {
            console.error('Invoice document does not exist for ID:', id);
            toast.error('Invoice not found - it may still be saving. Redirecting to invoices list.');
            setTimeout(() => navigate('/invoices'), 2000);
          }
        }
      } catch (error) {
        console.error('Error fetching invoice:', error);
        toast.error('Failed to load invoice');
        navigate('/invoices');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id, navigate]);

  const handleFinalizeInvoice = async () => {
    if (!invoice || !companySettings) return;

    setFinalizing(true);
    try {
      // Generate invoice number client-side for now
      const currentYear = new Date().getFullYear();
      const invoicePrefix = companySettings.invoicePrefix || 'WC';
      const nextSeq = companySettings.nextInvoiceSeq || 1;
      const paddedSeq = nextSeq.toString().padStart(5, '0');
      const invoiceNo = `${invoicePrefix}-${currentYear}-${paddedSeq}`;

      // Update the invoice with finalized status and invoice number
      const updatedData = {
        invoiceNo,
        status: 'finalized',
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'invoices', invoice.id), updatedData);

      // Update company settings to increment sequence (simplified)
      await updateDoc(doc(db, 'settings', 'company'), {
        nextInvoiceSeq: nextSeq + 1,
        updatedAt: serverTimestamp()
      });

      // Update local state
      setInvoice({
        ...invoice,
        invoiceNo,
        status: 'finalized',
        updatedAt: new Date()
      });

      setCompanySettings({
        ...companySettings,
        nextInvoiceSeq: nextSeq + 1
      });

      toast.success('Invoice finalized successfully');
    } catch (error: any) {
      console.error('Error finalizing invoice:', error);
      toast.error(`Failed to finalize invoice: ${error.message}`);
    } finally {
      setFinalizing(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!invoice || !paymentAmount) return;

    setRecordingPayment(true);
    try {
      const amount = parseFloat(paymentAmount);
      const currentBalance = invoice.balance || 0;
      const newBalance = Math.max(0, currentBalance - amount);

      // Create new payment record
      const newPayment: Payment = {
        amount,
        method: paymentMethod as any,
        date: paymentDate,
        recordedAt: new Date(),
        recordedByUid: 'user' // You could get this from useAuth if needed
      };

      const updatedPayments = [...(invoice.payments || []), newPayment];

      // Determine new status
      let newStatus = invoice.status;
      if (newBalance === 0) {
        newStatus = 'paid';
      } else if (newBalance < currentBalance) {
        newStatus = 'partial';
      }

      // Update invoice in database
      await updateDoc(doc(db, 'invoices', invoice.id), {
        payments: updatedPayments,
        balance: newBalance,
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // Update local state
      setInvoice({
        ...invoice,
        payments: updatedPayments,
        balance: newBalance,
        status: newStatus as any,
        updatedAt: new Date()
      });

      // Google Sheets integration now handled automatically by Firebase sync
      console.log('Payment recorded - will be synced to Google Sheets automatically');

      // Reset form and close modal
      setPaymentAmount('');
      setPaymentMethod('cash');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setShowPaymentModal(false);

      toast.success('Payment recorded successfully');
    } catch (error: any) {
      console.error('Error recording payment:', error);
      toast.error(`Failed to record payment: ${error.message}`);
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!invoice?.id) return;

    try {
      console.log('Attempting to delete invoice from detail page:', invoice.id);
      await deleteDoc(doc(db, 'invoices', invoice.id));
      console.log('Invoice deleted from Firebase successfully');
      
      // Remove from session storage if it exists
      sessionStorage.removeItem(`invoice_${invoice.id}`);
      
      toast.success('Invoice deleted successfully');
      navigate('/invoices');
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      toast.error(`Failed to delete invoice: ${error.message}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'finalized':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'partial':
        return 'Partial Payment';
      case 'finalized':
        return 'Pending Payment';
      case 'draft':
        return 'Draft';
      default:
        return status;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <div className="ml-4">
          <p className="text-gray-600">Loading invoice...</p>
          <p className="text-sm text-gray-400">ID: {id}</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Invoice not found</h3>
        <p className="mt-1 text-sm text-gray-500">Invoice ID: {id}</p>
        <div className="mt-4 space-x-3">
          <Link to="/invoices" className="btn-primary">
            Back to Invoices
          </Link>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-secondary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-6 print:hidden">
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
                {invoice.invoiceNo || 'Draft Invoice'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Created on {format(invoice.createdAt, 'MMMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex space-x-3 md:ml-4 md:mt-0">
          <button
            onClick={handlePrint}
            className="btn-secondary"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </button>
          {invoice.status === 'draft' && (
            <button
              onClick={handleFinalizeInvoice}
              disabled={finalizing}
              className="btn-primary"
            >
              {finalizing ? <LoadingSpinner size="sm" /> : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalize
                </>
              )}
            </button>
          )}
          {(invoice.status === 'finalized' || invoice.status === 'partial') && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="btn-primary"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Record Payment
            </button>
          )}
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="bg-white shadow-lg rounded-lg p-8 print:shadow-none print:rounded-none print-container no-page-break">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {companySettings?.legalName || 'Whittico Collision'}
            </h1>
            <p className="text-gray-600 mt-2">
              {companySettings?.address ? (
                <>
                  {companySettings.address.street}<br />
                  {companySettings.address.city}, {companySettings.address.state} {companySettings.address.zipCode}<br />
                  {companySettings.phone}<br />
                  {companySettings.email}
                </>
              ) : (
                <>
                  123 Main Street<br />
                  Anytown, MI 48000<br />
                  (555) 123-4567<br />
                  info@whitticocollision.co
                </>
              )}
            </p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)} mb-4`}>
              {getStatusText(invoice.status)}
            </div>
            <div className="text-sm text-gray-600">
              <p><strong>Invoice:</strong> {invoice.invoiceNo || 'Draft'}</p>
              <p><strong>Date:</strong> {invoice.date ? format(new Date(invoice.date + 'T00:00:00'), 'MMMM d, yyyy') : 'N/A'}</p>
              <p><strong>Due:</strong> {invoice.dueDate ? format(new Date(invoice.dueDate + 'T00:00:00'), 'MMMM d, yyyy') : 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Customer & Vehicle Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To</h3>
            <div className="text-gray-600">
              <p className="font-medium text-gray-900">{invoice.customerId}</p>
            </div>
          </div>

        </div>

        {/* Line Items */}
        <div className="mb-8 no-page-break">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Services & Parts</h3>
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tax
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(invoice.lineItems || []).map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.description || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.quantity || 0}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">${(item.unitPrice || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.taxable ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">
                      ${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8 no-page-break">
          <div className="w-full max-w-xs">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${invoice.totals?.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (6%):</span>
                <span className="font-medium">${invoice.totals?.taxAmount?.toFixed(2) || '0.00'}</span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>${invoice.totals?.total?.toFixed(2) || '0.00'}</span>
              </div>
              {invoice.balance !== undefined && invoice.balance !== invoice.totals?.total && (
                <div className="flex justify-between text-lg font-bold text-red-600">
                  <span>Balance Due:</span>
                  <span>${invoice.balance.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payments */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment History</h3>
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.payments.map((payment, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {format(new Date(payment.date + 'T00:00:00'), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                        {payment.method.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        ${payment.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        {/* Terms */}
        <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-4">
          <p>{companySettings?.terms || 'Payment is due upon receipt. Thank you for your business!'}</p>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Record Payment</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    max={invoice?.balance}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Outstanding balance: ${invoice?.balance?.toFixed(2) || '0.00'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="zelle">Zelle</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRecordPayment}
                  disabled={recordingPayment || !paymentAmount}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {recordingPayment ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteInvoice}
        title="Delete Invoice"
        message={`Are you sure you want to delete this invoice "${invoice?.invoiceNo || 'Draft Invoice'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default InvoiceDetail;
