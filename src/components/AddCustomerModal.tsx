import React, { useState } from "react";
import { useDesk } from "../context/DeskContext";
import { findCustomersByMobile } from "../services/customerService";

export const AddCustomerModal: React.FC = () => {
  const {
    isAddCustomerOpen,
    setIsAddCustomerOpen,
    addCustomer,
    customers,
    navigateToCustomerProfile,
    setIsAddTaskOpen,
  } = useDesk();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [notes, setNotes] = useState("");

  if (!isAddCustomerOpen) return null;

  // Check for shared phone numbers across existing profiles
  const matchingCustomers =
    phone.trim().length >= 5
      ? findCustomersByMobile(customers, phone.trim()).filter(
          (c) => c.id !== "cust-general",
        )
      : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    await addCustomer({
      name: name.trim(),
      mobile: phone.trim(),
      is_verified: true,
      note: notes.trim(),
      aadhaar_number: aadhaar.trim(),
    });

    setName("");
    setPhone("");
    setAadhaar("");
    setNotes("");
    setIsAddCustomerOpen(false);
  };

  const handleSelectExisting = (id: string) => {
    setIsAddCustomerOpen(false);
    setName("");
    setPhone("");
    setAadhaar("");
    setNotes("");
    navigateToCustomerProfile(id);
    setIsAddTaskOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-2xl max-w-xl w-full border border-surface-container/60 flex flex-col gap-space-md max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-xl">
              person_add
            </span>
            <h3 className="font-tagline text-tagline font-semibold text-on-surface">
              Add New Customer
            </h3>
          </div>
          <button
            className="text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
            onClick={() => setIsAddCustomerOpen(false)}
            type="button"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Shared Mobile Banner Warning  */}
        {matchingCustomers.length > 0 && (
          <div className="p-3 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex flex-col gap-2 border border-tertiary/20 animate-fadeIn">
            <div className="flex items-center gap-2 font-caption-strong text-caption-strong">
              <span className="material-symbols-outlined text-tertiary text-lg">
                info
              </span>
              <span>Shared Mobile Number Detected</span>
            </div>
            <p className="font-fine-print text-fine-print">
              This mobile number is already used by{" "}
              <strong>{matchingCustomers.length} existing customer(s)</strong>:
            </p>
            <div className="flex flex-col gap-1 my-1">
              {matchingCustomers.map((cust) => (
                <div
                  key={cust.id}
                  className="flex items-center justify-between bg-surface-container-lowest/80 p-2 rounded-lg text-xs"
                >
                  <span className="font-semibold text-on-surface">
                    {cust.name} ({cust.mobile})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSelectExisting(cust.id)}
                    className="px-2 py-1 rounded bg-tertiary text-on-tertiary font-bold hover:bg-tertiary/90 text-[11px]"
                  >
                    Select {cust.name.split(" ")[0]} →
                  </button>
                </div>
              ))}
            </div>
            <p className="font-fine-print text-fine-print italic text-outline">
              You can still create <strong>{name || "this new person"}</strong>{" "}
              as a separate, independent customer profile with this same mobile
              number.
            </p>
          </div>
        )}

        <form className="flex flex-col gap-space-sm" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
            Full Name *
            <input
              required
              className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility"
              placeholder="e.g. Ramesh V. Sharma"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
            Mobile Number *
            <input
              required
              className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility font-mono"
              placeholder="e.g. 9820012345"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
            Aadhaar Number
            <input
              className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility font-mono"
              placeholder="e.g. 1234 5678 9012"
              type="text"
              value={aadhaar}
              onChange={(e) => setAadhaar(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
            Desk Notes / Remarks
            <textarea
              className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility resize-none"
              placeholder="e.g. Son of Rajesh Sharma"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          <div className="flex items-center justify-end gap-space-sm mt-space-xs pt-space-xs border-t border-surface-container">
            <button
              className="px-space-md py-2 rounded-full text-on-surface-variant hover:bg-surface-container font-button-utility text-button-utility"
              onClick={() => setIsAddCustomerOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="px-space-md py-2 rounded-full bg-primary-container hover:bg-primary transition-all active:scale-95 text-on-primary font-button-utility text-button-utility font-medium shadow-sm"
              type="submit"
            >
              Create New Person
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
