import { Customer } from '../types';

export function findCustomersByMobile(customers: Customer[], mobile: string): Customer[] {
  if (!Array.isArray(customers) || !mobile) return [];
  const cleanQuery = mobile.trim().replace(/[\s-]/g, '');
  if (cleanQuery.length < 3) return [];

  return customers.filter((c) => {
    if (!c || !c.mobile || c.is_active === false) return false;
    const cleanMobile = c.mobile.replace(/[\s-]/g, '');
    return cleanMobile.includes(cleanQuery);
  });
}

export function searchCustomers(customers: Customer[], query: string): Customer[] {
  if (!Array.isArray(customers)) return [];
  const q = query.trim().toLowerCase();
  const cleanQ = q.replace(/[\s-]/g, '');
  
  if (!q) return customers.filter(c => c && c.is_active !== false);

  return customers.filter((c) => {
    if (!c || c.is_active === false) return false;
    const nameMatch = c.name ? c.name.toLowerCase().includes(q) : false;
    const mobileMatch = c.mobile ? c.mobile.replace(/[\s-]/g, '').includes(cleanQ) : false;
    const aadhaarMatch = c.aadhaar_number ? c.aadhaar_number.replace(/[\s-]/g, '').includes(cleanQ) : false;
    const noteMatch = c.note ? c.note.toLowerCase().includes(q) : false;
    return nameMatch || mobileMatch || aadhaarMatch || noteMatch;
  });
}
