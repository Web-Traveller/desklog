/**
 * Standard Citizen Counter Services & CSC Templates
 * Extracted directly from client's operational sheets (Work Manager & Data Book)
 */

export interface DefaultServiceTemplate {
  name: string;
  defaultPriceRupees: number;
}

export const CLIENT_STANDARD_SERVICES: DefaultServiceTemplate[] = [
  { name: 'New PAN Card (NSDL)', defaultPriceRupees: 150 },
  { name: 'Correction PAN Card', defaultPriceRupees: 150 },
  { name: 'Aadhaar Mobile Update (MOB UPDATE)', defaultPriceRupees: 100 },
  { name: 'Domicile Certificate', defaultPriceRupees: 200 },
  { name: 'Income Certificate', defaultPriceRupees: 200 },
  { name: 'Domicile + Income Combo', defaultPriceRupees: 350 },
  { name: 'Fino Bank Account / KYC', defaultPriceRupees: 100 },
  { name: 'Food License (FSSAI)', defaultPriceRupees: 500 },
  { name: 'Income Tax Return (ITR)', defaultPriceRupees: 500 },
  { name: 'PF KYC / Claim Advance', defaultPriceRupees: 200 },
  { name: 'Electricity Bill Payment (Lite Bill)', defaultPriceRupees: 20 },
  { name: 'Dish TV Recharge', defaultPriceRupees: 20 },
  { name: 'Credit Card Bill Payment', defaultPriceRupees: 50 },
  { name: 'IRCTC Tatkal Ticket Booking', defaultPriceRupees: 150 },
  { name: 'IRCTC Normal Ticket Booking', defaultPriceRupees: 100 },
  { name: 'Police Verification Form', defaultPriceRupees: 150 },
];
