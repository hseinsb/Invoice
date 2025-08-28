import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Trash2
} from 'lucide-react';
import { collection, query, orderBy, getDocs, where, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Invoice } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    invoiceId: string;
    invoiceNo: string;
  }>({
    isOpen: false,
    invoiceId: '',
    invoiceNo: ''
  });

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const invoicesQuery = query(
          collection(db, 'invoices'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(invoicesQuery);
        const invoiceData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        })) as Invoice[];

        setInvoices(invoiceData);
        setFilteredInvoices(invoiceData);
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  useEffect(() => {
    let filtered = invoices;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        invoice.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, statusFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'partial':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'finalized':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'partial':
        return 'Partial';
      case 'finalized':
        return 'Pending';
      case 'draft':
        return 'Draft';
      default:
        return status;
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

  const handleDeleteClick = (invoice: Invoice) => {
    setDeleteDialog({
      isOpen: true,
      invoiceId: invoice.id!,
      invoiceNo: invoice.invoiceNo || 'Draft Invoice'
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteDoc(doc(db, 'invoices', deleteDialog.invoiceId));
      
      // Remove from local state
      setInvoices(invoices.filter(inv => inv.id !== deleteDialog.invoiceId));
      
      toast.success('Invoice deleted successfully');
      setDeleteDialog({ isOpen: false, invoiceId: '', invoiceNo: '' });
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      toast.error(`Failed to delete invoice: ${error.message}`);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, invoiceId: '', invoiceNo: '' });
  };

  const exportToCSV = () => {
    const headers = ['Invoice No', 'Date', 'Customer', 'Amount', 'Status', 'Balance'];
    const csvData = filteredInvoices.map(invoice => [
      invoice.invoiceNo || 'Draft',
      format(new Date(invoice.date), 'yyyy-MM-dd'),
      invoice.customerId,
      invoice.totals?.total?.toFixed(2) || '0.00',
      invoice.status,
      invoice.balance?.toFixed(2) || '0.00'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Invoices
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track all your invoices
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:ml-4 md:mt-0">
          <button
            onClick={exportToCSV}
            className="btn-secondary"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <Link
            to="/invoices/new"
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 card p-4">
        <div className="md:flex md:items-center md:space-x-4 space-y-4 md:space-y-0">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="input pl-10"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="finalized">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="mt-6 card">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm || statusFilter !== 'all' ? 'No matching invoices' : 'No invoices found'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating a new invoice.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <div className="mt-6">
                <Link to="/invoices/new" className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  New Invoice
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.invoiceNo || (
                            <span className="text-gray-500 italic">Draft</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(invoice.date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.customerId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${invoice.totals?.total?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          <span className="ml-1">{getStatusText(invoice.status)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/invoices/${invoice.id}`}
                            className="text-brand-600 hover:text-brand-900 font-medium"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(invoice)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete Invoice"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice "${deleteDialog.invoiceNo}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default Invoices;
