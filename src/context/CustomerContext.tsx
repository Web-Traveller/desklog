import React, { createContext, useContext, useState, useEffect } from 'react';
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
      is_verified: true,
      avatar_initials: initials || 'CU',
      avatar_color: color,
    };

    const saved = await saveTauriCustomer(newCustomer);
    if (saved) {
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
    }
    return newCustomer;
  };

  const editCustomer = async (id: string, customerData: Partial<Customer>) => {
    const target = customers.find(c => c.id === id);
    if (!target) return;

    const name = customerData.name ?? target.name;
    const mobile = customerData.mobile !== undefined ? customerData.mobile : target.mobile;
    const note = customerData.note !== undefined ? customerData.note : target.note;
    const aadhaar_number = customerData.aadhaar_number !== undefined ? customerData.aadhaar_number : target.aadhaar_number;

    const success = await updateTauriCustomer(id, name, mobile, note, aadhaar_number);
    if (success) {
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
    }
  };

  const deleteCustomer = async (id: string) => {
    if (id === 'cust-general') {
      showToast('General / Walk-in Client profile cannot be deleted.', 'warning');
      return;
    }

    const target = customers.find(c => c.id === id);
    const success = await deleteTauriCustomer(id);
    if (success) {
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
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
};
