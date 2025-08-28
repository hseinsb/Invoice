import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Users as UsersIcon,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { collection, query, orderBy, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { Customer } from '../types';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  insuranceCompany: string;
  policyNumber: string;
}

const Customers: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormData>();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const customersQuery = query(
          collection(db, 'customers'),
          orderBy('name', 'asc')
        );
        const snapshot = await getDocs(customersQuery);
        const customerData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        })) as Customer[];

        setCustomers(customerData);
        setFilteredCustomers(customerData);
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast.error('Failed to load customers');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.insuranceCompany?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [customers, searchTerm]);

  const openModal = (customer?: Customer) => {
    setEditingCustomer(customer || null);
    if (customer) {
      reset({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || { street: '', city: '', state: 'MI', zipCode: '' },
        insuranceCompany: customer.insuranceCompany || '',
        policyNumber: customer.policyNumber || ''
      });
    } else {
      reset({
        name: '',
        email: '',
        phone: '',
        address: { street: '', city: '', state: 'MI', zipCode: '' },
        insuranceCompany: '',
        policyNumber: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    reset();
  };

  const onSubmit = async (data: CustomerFormData) => {
    if (!user) return;

    setSubmitting(true);
    try {
      if (editingCustomer) {
        // Update existing customer
        await updateDoc(doc(db, 'customers', editingCustomer.id), {
          ...data,
          updatedAt: serverTimestamp()
        });
        
        setCustomers(prev => prev.map(customer =>
          customer.id === editingCustomer.id
            ? { ...customer, ...data, updatedAt: new Date() }
            : customer
        ));
        
        toast.success('Customer updated successfully');
      } else {
        // Create new customer
        const docRef = await addDoc(collection(db, 'customers'), {
          ...data,
          createdByUid: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        const newCustomer: Customer = {
          id: docRef.id,
          ...data,
          createdByUid: user.uid,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        setCustomers(prev => [newCustomer, ...prev]);
        toast.success('Customer created successfully');
      }

      closeModal();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (!window.confirm(`Are you sure you want to delete ${customer.name}?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'customers', customer.id));
      setCustomers(prev => prev.filter(c => c.id !== customer.id));
      toast.success('Customer deleted successfully');
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
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
            Customers
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your customer database
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <button
            onClick={() => openModal()}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="input pl-10"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="mt-6">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 card">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm ? 'No matching customers' : 'No customers found'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search criteria.'
                : 'Get started by adding your first customer.'
              }
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button onClick={() => openModal()} className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="card p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {customer.name}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openModal(customer)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(customer)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {customer.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  
                  {customer.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  
                  {customer.address && customer.address.city && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="truncate">
                        {customer.address.city}, {customer.address.state}
                      </span>
                    </div>
                  )}
                  
                  {customer.insuranceCompany && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500">Insurance</p>
                      <p className="text-sm text-gray-900 truncate">{customer.insuranceCompany}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Name *</label>
                    <input
                      type="text"
                      {...register('name', { required: 'Name is required' })}
                      className="input"
                      placeholder="John Doe"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      {...register('email')}
                      className="input"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="label">Phone</label>
                    <input
                      type="tel"
                      {...register('phone')}
                      className="input"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="label">Insurance Company</label>
                    <input
                      type="text"
                      {...register('insuranceCompany')}
                      className="input"
                      placeholder="State Farm"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Policy Number</label>
                  <input
                    type="text"
                    {...register('policyNumber')}
                    className="input"
                    placeholder="POL123456789"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="label">Street Address</label>
                    <input
                      type="text"
                      {...register('address.street')}
                      className="input"
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div>
                    <label className="label">City</label>
                    <input
                      type="text"
                      {...register('address.city')}
                      className="input"
                      placeholder="Anytown"
                    />
                  </div>

                  <div>
                    <label className="label">State</label>
                    <select {...register('address.state')} className="input">
                      <option value="MI">Michigan</option>
                      <option value="OH">Ohio</option>
                      <option value="IN">Indiana</option>
                      <option value="IL">Illinois</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">ZIP Code</label>
                    <input
                      type="text"
                      {...register('address.zipCode')}
                      className="input"
                      placeholder="48000"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary"
                  >
                    {submitting ? <LoadingSpinner size="sm" /> : (editingCustomer ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
