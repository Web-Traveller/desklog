import React, { useState, useRef, useEffect } from 'react';
import { Customer } from '../types';

interface CustomerSearchPickerProps {
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (customer: Customer) => void;
  label?: string;
  placeholder?: string;
}

export const CustomerSearchPicker: React.FC<CustomerSearchPickerProps> = ({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  label = 'Select Customer / Walk-in',
  placeholder = 'Type customer name or mobile number...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedCustomer =
    customers.find((c) => c.id === selectedCustomerId) ||
    customers.find((c) => c.id === 'cust-general') ||
    customers[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCustomers = customers.filter((c) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q);
  });

  return (
    <div ref={wrapperRef} className="relative flex flex-col gap-1 w-full">
      {label && (
        <label className="font-fine-print text-fine-print text-on-surface-variant font-medium">
          {label}
        </label>
      )}

      {/* Selected Box Trigger */}
      <div
        className="w-full bg-surface-container-low hover:bg-surface-container text-on-surface rounded-xl px-space-md py-2.5 font-button-utility text-button-utility flex items-center justify-between cursor-pointer border border-surface-container-high/40 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-space-xs min-w-0">
          <span className="material-symbols-outlined text-base text-primary">person</span>
          <span className="font-medium truncate">{selectedCustomer?.name || 'Select Customer'}</span>
          <span className="font-mono text-fine-print text-outline">
            ({selectedCustomer?.phone || 'N/A'})
          </span>
        </div>
        <span className="material-symbols-outlined text-outline text-lg pointer-events-none">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </div>

      {/* Dropdown Box */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container-high/60 flex flex-col max-h-64 overflow-hidden animate-fadeIn">
          {/* Internal Search Field */}
          <div className="p-2 border-b border-surface-container">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-2 text-outline text-sm pointer-events-none">
                search
              </span>
              <input
                autoFocus
                className="w-full pl-7 pr-2 py-1.5 rounded-lg bg-surface-container text-on-surface placeholder:text-outline font-button-utility text-button-utility text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                placeholder={placeholder}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="absolute right-2 text-outline text-xs"
                  onClick={() => setSearchTerm('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* List options */}
          <div className="overflow-y-auto divide-y divide-surface-container/40 flex-1">
            {filteredCustomers.length === 0 ? (
              <div className="p-3 text-center text-fine-print text-outline">
                No matching customer found.
              </div>
            ) : (
              filteredCustomers.map((cust) => {
                const isSelected = cust.id === selectedCustomerId;
                return (
                  <div
                    key={cust.id}
                    className={`px-space-md py-2 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary-container/20 text-primary font-semibold'
                        : 'hover:bg-surface-container text-on-surface'
                    }`}
                    onClick={() => {
                      onSelectCustomer(cust);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-button-utility text-button-utility truncate">
                        {cust.name}
                      </span>
                      <span className="font-mono text-fine-print text-outline">
                        {cust.phone}
                      </span>
                    </div>

                    {cust.id === 'cust-general' ? (
                      <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-bold">
                        Default Walk-in
                      </span>
                    ) : isSelected ? (
                      <span className="material-symbols-outlined text-primary text-base">
                        check
                      </span>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
