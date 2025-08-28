import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { CompanySettings } from '../types';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Save, Upload, Building2, TestTube } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { testGoogleSheetsConnection } from '../utils/testGoogleSheets';

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<CompanySettings | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CompanySettings>();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'company'));
        if (settingsDoc.exists()) {
          const settingsData = {
            ...settingsDoc.data(),
            updatedAt: settingsDoc.data().updatedAt?.toDate()
          } as CompanySettings;
          
          setSettings(settingsData);
          reset(settingsData);
        } else {
          // Create default settings
          const defaultSettings: Partial<CompanySettings> = {
            legalName: 'Whittico Collision',
            address: {
              street: '123 Main Street',
              city: 'Anytown',
              state: 'MI',
              zipCode: '48000'
            },
            phone: '(555) 123-4567',
            email: 'info@whitticocollision.co',
            invoicePrefix: 'WC',
            nextInvoiceSeq: 1,
            defaultTaxRateParts: 0.06,
            terms: 'Payment is due upon receipt. Thank you for your business!'
          };
          reset(defaultSettings as CompanySettings);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [reset]);



  const onSubmit = async (data: CompanySettings) => {
    setSaving(true);
    try {
      // Use setDoc with merge to create or update the document
      await setDoc(doc(db, 'settings', 'company'), {
        ...data,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setSettings({ ...data, updatedAt: new Date() });
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestGoogleSheets = async () => {
    setSaving(true);
    try {
      const success = await testGoogleSheetsConnection();
      if (success) {
        toast.success('Google Sheets connection successful! Check your sheet for a test entry.');
      } else {
        toast.error('Google Sheets connection failed. Check console for details.');
      }
    } catch (error) {
      console.error('Google Sheets test error:', error);
      toast.error('Error testing Google Sheets connection');
    } finally {
      setSaving(false);
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
    <div className="max-w-4xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Company Settings
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your company information and invoice settings
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Company Information */}
        <div className="card p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Company Information</h3>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Legal Name *</label>
              <input
                type="text"
                {...register('legalName', { required: 'Legal name is required' })}
                className="input"
                placeholder="Whittico Collision"
              />
              {errors.legalName && (
                <p className="mt-1 text-sm text-red-600">{errors.legalName.message}</p>
              )}
            </div>

            <div>
              <label className="label">Phone *</label>
              <input
                type="tel"
                {...register('phone', { required: 'Phone is required' })}
                className="input"
                placeholder="(555) 123-4567"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                className="input"
                placeholder="info@whitticocollision.co"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="label">EIN (Optional)</label>
              <input
                type="text"
                {...register('ein')}
                className="input"
                placeholder="12-3456789"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="card p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Business Address</h3>
          
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="label">Street Address *</label>
              <input
                type="text"
                {...register('address.street', { required: 'Street address is required' })}
                className="input"
                placeholder="123 Main Street"
              />
              {errors.address?.street && (
                <p className="mt-1 text-sm text-red-600">{errors.address.street.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label className="label">City *</label>
                <input
                  type="text"
                  {...register('address.city', { required: 'City is required' })}
                  className="input"
                  placeholder="Anytown"
                />
                {errors.address?.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.city.message}</p>
                )}
              </div>

              <div>
                <label className="label">State *</label>
                <select
                  {...register('address.state', { required: 'State is required' })}
                  className="input"
                >
                  <option value="MI">Michigan</option>
                  <option value="OH">Ohio</option>
                  <option value="IN">Indiana</option>
                  <option value="IL">Illinois</option>
                </select>
                {errors.address?.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.state.message}</p>
                )}
              </div>

              <div>
                <label className="label">ZIP Code *</label>
                <input
                  type="text"
                  {...register('address.zipCode', { required: 'ZIP code is required' })}
                  className="input"
                  placeholder="48000"
                />
                {errors.address?.zipCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.zipCode.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Company Logo Note */}
        <div className="card p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Company Branding</h3>
          
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            
            <div className="flex-1">
              <p className="text-sm text-gray-600">
                Company logo can be added to invoices via print CSS or by editing the invoice template directly.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Cloud Storage has been disabled to keep the system free.
              </p>
            </div>
          </div>
        </div>

        {/* Invoice Settings */}
        <div className="card p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Invoice Settings</h3>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="label">Invoice Prefix *</label>
              <input
                type="text"
                {...register('invoicePrefix', { required: 'Invoice prefix is required' })}
                className="input"
                placeholder="WC"
              />
              {errors.invoicePrefix && (
                <p className="mt-1 text-sm text-red-600">{errors.invoicePrefix.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Example: WC-2024-00001
              </p>
            </div>

            <div>
              <label className="label">Next Invoice Number</label>
              <input
                type="number"
                {...register('nextInvoiceSeq', { 
                  required: 'Next invoice sequence is required',
                  min: { value: 1, message: 'Must be at least 1' }
                })}
                className="input"
                min="1"
              />
              {errors.nextInvoiceSeq && (
                <p className="mt-1 text-sm text-red-600">{errors.nextInvoiceSeq.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                The next sequential number for new invoices
              </p>
            </div>

            <div>
              <label className="label">Default Tax Rate (Parts) *</label>
              <input
                type="number"
                step="0.0001"
                min="0"
                max="1"
                {...register('defaultTaxRateParts', { 
                  required: 'Tax rate is required',
                  min: { value: 0, message: 'Tax rate must be positive' },
                  max: { value: 1, message: 'Tax rate must be less than 100%' }
                })}
                className="input"
                placeholder="0.06"
              />
              {errors.defaultTaxRateParts && (
                <p className="mt-1 text-sm text-red-600">{errors.defaultTaxRateParts.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Enter as decimal (0.06 = 6%)
              </p>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="card p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Invoice Terms</h3>
          
          <div>
            <label className="label">Default Terms *</label>
            <textarea
              {...register('terms', { required: 'Terms are required' })}
              rows={4}
              className="input"
              placeholder="Payment is due upon receipt. Thank you for your business!"
            />
            {errors.terms && (
              <p className="mt-1 text-sm text-red-600">{errors.terms.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              These terms will appear on all invoices
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleTestGoogleSheets}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
          >
            {saving ? <LoadingSpinner size="sm" /> : (
              <>
                <TestTube className="h-4 w-4 mr-2" />
                Test Google Sheets
              </>
            )}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? <LoadingSpinner size="sm" /> : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
