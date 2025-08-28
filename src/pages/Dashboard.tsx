import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Plus,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Invoice } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';

interface DashboardStats {
  totalInvoices: number;
  totalRevenue: number;
  pendingInvoices: number;
  paidInvoices: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    paidInvoices: 0
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch recent invoices
        const invoicesQuery = query(
          collection(db, 'invoices'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const invoicesSnapshot = await getDocs(invoicesQuery);
        const invoices = invoicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        })) as Invoice[];

        setRecentInvoices(invoices);

        // Calculate stats
        const allInvoicesQuery = query(collection(db, 'invoices'));
        const allInvoicesSnapshot = await getDocs(allInvoicesQuery);
        
        let totalRevenue = 0;
        let pendingCount = 0;
        let paidCount = 0;

        allInvoicesSnapshot.docs.forEach(doc => {
          const invoice = doc.data() as Invoice;
          if (invoice.totals?.total) {
            totalRevenue += invoice.totals.total;
          }
          if (invoice.status === 'paid') {
            paidCount++;
          } else if (invoice.status === 'finalized' || invoice.status === 'partial') {
            pendingCount++;
          }
        });

        setStats({
          totalInvoices: allInvoicesSnapshot.size,
          totalRevenue,
          pendingInvoices: pendingCount,
          paidInvoices: paidCount
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your invoice management system
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <Link
            to="/invoices/new"
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6">
        <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card px-4 py-5 sm:p-6">
            <dt className="text-base font-normal text-gray-900 flex items-center">
              <FileText className="h-5 w-5 text-gray-400 mr-2" />
              Total Invoices
            </dt>
            <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
              <div className="flex items-baseline text-2xl font-semibold text-brand-600">
                {stats.totalInvoices}
              </div>
            </dd>
          </div>

          <div className="card px-4 py-5 sm:p-6">
            <dt className="text-base font-normal text-gray-900 flex items-center">
              <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
              Total Revenue
            </dt>
            <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
              <div className="flex items-baseline text-2xl font-semibold text-green-600">
                ${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </dd>
          </div>

          <div className="card px-4 py-5 sm:p-6">
            <dt className="text-base font-normal text-gray-900 flex items-center">
              <Clock className="h-5 w-5 text-gray-400 mr-2" />
              Pending
            </dt>
            <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
              <div className="flex items-baseline text-2xl font-semibold text-yellow-600">
                {stats.pendingInvoices}
              </div>
            </dd>
          </div>

          <div className="card px-4 py-5 sm:p-6">
            <dt className="text-base font-normal text-gray-900 flex items-center">
              <CheckCircle className="h-5 w-5 text-gray-400 mr-2" />
              Paid
            </dt>
            <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
              <div className="flex items-baseline text-2xl font-semibold text-green-600">
                {stats.paidInvoices}
              </div>
            </dd>
          </div>
        </dl>
      </div>

      {/* Recent Invoices */}
      <div className="mt-8">
        <div className="md:flex md:items-center md:justify-between">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Invoices</h3>
          <Link
            to="/invoices"
            className="mt-3 text-sm text-brand-600 hover:text-brand-500 md:mt-0"
          >
            View all invoices →
          </Link>
        </div>

        <div className="mt-4 card">
          {recentInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new invoice.</p>
              <div className="mt-6">
                <Link to="/invoices/new" className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  New Invoice
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
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
                  {recentInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.invoiceNo || `Draft`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(invoice.date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${invoice.totals?.total?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(invoice.status)}
                          <span className="ml-2 text-sm text-gray-900 capitalize">
                            {getStatusText(invoice.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/invoices/${invoice.id}`}
                          className="text-brand-600 hover:text-brand-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
