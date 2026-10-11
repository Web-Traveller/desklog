import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { Customer, GENERAL_CUSTOMER } from '../types';
import {
  fetchTauriCustomers,
  saveTauriCustomer,
  updateTauriCustomer,
  deleteTauriCustomer,
} from '../api/tauri';
import { createActivityEvent } from '../services/activityService';
import { saveTauriActivity } from '../api/tauri';
import { useUI } from './UIContext';

interface CustomerContextType {
  customers: Customer[];
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  addCustomer: (customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => Promise<Customer>;
  editCustomer: (id: string, customerData: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  confirmDeleteCustomer: (customer: Customer) => void;
  reloadCustomers: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([GENERAL_CUSTOMER]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>('cust-general');
  const { showToast, showConfirm } = useUI();

  const reloadCustomers = async () => {
    const dbCustomers = await fetchTauriCustomers();
    if (dbCustomers) setCustomers(dbCustomers);
  };

  useEffect(() => {
    reloadCustomers();
  }, []);

  const addCustomer = async (
    customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Customer> => {
    const initials = customerData.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const colors = [
      'bg-primary-container text-on-primary-container',
      'bg-secondary-container text-on-secondary-container',
      'bg-tertiary-container text-on-tertiary-container',
      'bg-surface-variant text-on-surface-variant',
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const now = new Date().toISOString();
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      created_at: now,
      updated_at: now,
      is_active: true,
      is_verified: false,
      avatar_initials: initials || 'CU',
      avatar_color: color,
    };

    try {
      const saved = await saveTauriCustomer(newCustomer);
      setCustomers(prev => [...prev, saved]);
      showToast(`Customer "${saved.name}" added successfully.`, 'success');

      const act = createActivityEvent({
        type: 'customer_created',
        title: `New customer registered: ${saved.name}`,
        description: `Customer profile created with mobile ${saved.mobile || 'N/A'}.`,
        customerId: saved.id,
        customerName: saved.name,
        customerPhone: saved.mobile,
      });
      await saveTauriActivity(act);
      return saved;
    } catch (err) {
      console.error('Failed to add customer:', err);
      Sentry.captureException(err, {
        tags: { action: 'add_customer' },
        extra: { customerName: newCustomer.name, customerMobile: newCustomer.mobile },
      });
      showToast(`Failed to add customer: ${err instanceof Error ? err.message : String(err)}`, 'error');
      throw err;
    }
  };

  const editCustomer = async (id: string, customerData: Partial<Customer>) => {
    const target = customers.find(c => c.id === id);
    if (!target) return;

    const name = customerData.name ?? target.name;
    const mobile = customerData.mobile !== undefined ? customerData.mobile : target.mobile;
    const note = customerData.note !== undefined ? customerData.note : target.note;
    const aadhaar_number = customerData.aadhaar_number !== undefined ? customerData.aadhaar_number : target.aadhaar_number;

    try {
      await updateTauriCustomer(id, name, mobile, note, aadhaar_number);
      setCustomers(prev =>
        prev.map(c => (c.id === id ? { ...c, ...customerData, updated_at: new Date().toISOString() } : c))
      );
      showToast(`Customer profile updated.`, 'success');

      const act = createActivityEvent({
        type: 'customer_updated',
        title: `Updated customer: ${name}`,
        description: `Profile details modified.`,
        customerId: id,
        customerName: name,
        customerPhone: mobile,
      });
      await saveTauriActivity(act);
    } catch (err) {
      console.error('Failed to update customer:', err);
      Sentry.captureException(err, { tags: { action: 'update_customer' }, extra: { customerId: id } });
      showToast(`Failed to update customer: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  const deleteCustomer = async (id: string) => {
    if (id === 'cust-general') {
      showToast('General / Walk-in Client profile cannot be deleted.', 'warning');
      return;
    }

    const target = customers.find(c => c.id === id);
    try {
      await deleteTauriCustomer(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      if (selectedCustomerId === id) {
        setSelectedCustomerId('cust-general');
      }
      showToast(`Customer profile removed.`, 'info');

      if (target) {
        const act = createActivityEvent({
          type: 'customer_updated',
          title: `Removed customer: ${target.name}`,
          description: `Customer marked inactive in database.`,
          customerId: id,
          customerName: target.name,
          customerPhone: target.mobile,
        });
        await saveTauriActivity(act);
      }
    } catch (err) {
      console.error('Failed to delete customer:', err);
      Sentry.captureException(err, { tags: { action: 'delete_customer' }, extra: { customerId: id } });
      showToast(`Failed to delete customer: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  const confirmDeleteCustomer = (customer: Customer) => {
    if (customer.id === 'cust-general') {
      showToast('General / Walk-in Client profile cannot be deleted.', 'warning');
      return;
    }
    showConfirm({
      title: 'Delete Customer Profile',
      message: `Are you sure you want to delete customer "${customer.name}"? Active tasks and history will be preserved under general records.`,
      confirmText: 'Delete Customer',
      variant: 'danger',
      onConfirm: () => deleteCustomer(customer.id),
    });
  };

  return (
    <CustomerContext.Provider
      value={{
        customers,
        selectedCustomerId,
        setSelectedCustomerId,
        addCustomer,
        editCustomer,
        deleteCustomer,
        confirmDeleteCustomer,
        reloadCustomers,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomers = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    console.warn('useCustomers called outside CustomerProvider');
    return {
      customers: [],
      selectedCustomerId: null,
      setSelectedCustomerId: () => {},
      addCustomer: async () => ({} as any),
      editCustomer: async () => {},
      deleteCustomer: async () => {},
      confirmDeleteCustomer: () => {},
      reloadCustomers: async () => {},
    };
  }
  return context;
};
