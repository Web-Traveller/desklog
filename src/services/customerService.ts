import { Customer } from '../types';

export function findCustomersByMobile(customers: Customer[], mobile: string): Customer[] {
  const cleanQuery = mobile.trim().replace(/\s+/g, '');
  if (cleanQuery.length < 3) return [];

  return customers.filter((c) => {
    if (!c.mobile || c.is_active === false) return false;
    const cleanMobile = c.mobile.replace(/\s+/g, '');
    return cleanMobile.includes(cleanQuery);
  });
}

export function searchCustomers(customers: Customer[], query: string): Customer[] {
  const q = query.trim().toLowerCase();
  if (!q) return customers.filter(c => c.is_active !== false);

  return customers.filter((c) => {
    if (c.is_active === false) return false;
    const nameMatch = c.name.toLowerCase().includes(q);
    const mobileMatch = (c.mobile || '').includes(q);
    const noteMatch = (c.note || '').toLowerCase().includes(q);
    return nameMatch || mobileMatch || noteMatch;
  });
}
