import React, { useState } from "react";
import { useDesk } from "../context/DeskContext";
import { EmptyState } from "../components/EmptyState";
import { Service } from "../types";
import { formatRupees, rupeesToPaise, paiseToRupees } from "../utils/currencyUtils";

export const ServicesPage: React.FC = () => {
  const { services, addService, editService } = useDesk();

  const [isAdding, setIsAdding] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");

  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    await addService({
      name: newServiceName.trim(),
      default_price: newServicePrice ? rupeesToPaise(newServicePrice) : undefined,
      is_active: true,
    });

    setNewServiceName("");
    setNewServicePrice("");
    setIsAdding(false);
  };

  const startEdit = (svc: Service) => {
    setEditingService(svc);
    setEditName(svc.name);
    setEditPrice(
      svc.default_price !== undefined ? paiseToRupees(svc.default_price).toString() : "",
    );
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !editName.trim()) return;

    await editService({
      ...editingService,
      name: editName.trim(),
      default_price: editPrice ? rupeesToPaise(editPrice) : undefined,
      updated_at: new Date().toISOString(),
    });

    setEditingService(null);
  };

  const toggleActive = async (svc: Service) => {
    await editService({
      ...svc,
      is_active: !svc.is_active,
      updated_at: new Date().toISOString(),
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-gutter py-space-xl flex flex-col gap-space-lg animate-slideUp">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md border-b border-surface-container pb-space-xs">
        <div>
          <h1 className="font-display-md text-display-md text-on-surface tracking-tight font-semibold">
            Services Catalog & Templates
          </h1>
          <p className="font-body text-body text-on-surface-variant">
            Configure shop services and standard default prices.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-space-md py-2.5 rounded-full bg-primary text-on-primary font-button-utility font-medium transition-all active:scale-95 shadow-sm"
        >
          <span className="material-symbols-outlined text-lg">
            {isAdding ? "close" : "add"}
          </span>
          <span>{isAdding ? "Cancel" : "+ Add New Service"}</span>
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="bg-surface-container-lowest p-space-lg rounded-2xl border border-surface-container/60 flex flex-col gap-space-md shadow-xs animate-fadeIn"
        >
          <h3 className="font-tagline text-tagline text-on-surface font-semibold">
            Add New Service Template
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-1">
              <label className="font-fine-print text-fine-print text-on-surface-variant font-medium">
                Service Name *
              </label>
              <input
                type="text"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="e.g. Passport Online Application"
                className="px-space-md py-2.5 rounded-xl bg-surface-container border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface font-button-utility text-button-utility"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-fine-print text-fine-print text-on-surface-variant font-medium">
                Default Price (₹)
              </label>
              <input
                type="number"
                value={newServicePrice}
                onChange={(e) => setNewServicePrice(e.target.value)}
                placeholder="e.g. 150"
                className="px-space-md py-2.5 rounded-xl bg-surface-container border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface font-button-utility text-button-utility"
              />
            </div>
          </div>
          <div className="flex justify-end gap-space-xs pt-space-xs border-t border-surface-container">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-space-md py-2 rounded-full text-on-surface-variant hover:bg-surface-container font-button-utility text-button-utility"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-space-md py-2 rounded-full bg-primary-container text-on-primary font-button-utility font-medium transition-all active:scale-95 shadow-sm"
            >
              Save Service Template
            </button>
          </div>
        </form>
      )}

      {/* Editing Service Form */}
      {editingService && (
        <form
          onSubmit={handleEditSubmit}
          className="bg-surface-container-lowest p-space-lg rounded-2xl border border-primary/40 flex flex-col gap-space-md shadow-md animate-fadeIn"
        >
          <h3 className="font-tagline text-tagline text-on-surface font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">edit</span>
            <span>Edit Service: {editingService.name}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-1">
              <label className="font-fine-print text-fine-print text-on-surface-variant font-medium">
                Service Name *
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="px-space-md py-2.5 rounded-xl bg-surface-container border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface font-button-utility text-button-utility"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-fine-print text-fine-print text-on-surface-variant font-medium">
                Default Price (₹)
              </label>
              <input
                type="number"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="px-space-md py-2.5 rounded-xl bg-surface-container border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface font-button-utility text-button-utility"
              />
            </div>
          </div>
          <div className="flex justify-end gap-space-xs pt-space-xs border-t border-surface-container">
            <button
              type="button"
              onClick={() => setEditingService(null)}
              className="px-space-md py-2 rounded-full text-on-surface-variant hover:bg-surface-container font-button-utility text-button-utility"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-space-md py-2 rounded-full bg-primary text-on-primary font-button-utility font-medium transition-all active:scale-95 shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </form>
      )}

      {/* Services List */}
      <div className="flex flex-col gap-space-xs">
        {services.length === 0 ? (
          <EmptyState
            icon="design_services"
            title="No service templates configured"
            description="Create shop service catalog templates with default billing prices for rapid work logging."
            actionLabel="+ Add New Service"
            onAction={() => setIsAdding(true)}
          />
        ) : (
          services.map((svc) => (
            <div
              key={svc.id}
              className={`bg-surface-container-lowest p-space-md rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-space-md shadow-xs ${!svc.is_active ? "opacity-60 border-surface-container-high bg-surface-container-low/50" : "border-surface-container/60 hover:border-primary/30"}`}
            >
              <div className="flex items-center gap-space-md">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${svc.is_active ? "bg-primary-container text-on-primary" : "bg-surface-container text-outline"}`}
                >
                  <span className="material-symbols-outlined">
                    design_services
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h4 className="font-body-strong text-body-strong font-semibold text-on-surface">
                      {svc.name}
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded-full font-fine-print text-fine-print font-bold ${svc.is_active ? "bg-secondary-fixed text-on-secondary-fixed-variant" : "bg-surface-container-high text-outline"}`}
                    >
                      {svc.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="font-caption text-caption text-on-surface-variant">
                    Default Billing Price:{" "}
                    <strong className="text-on-surface font-mono">
                      {formatRupees(svc.default_price)}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-space-xs self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => startEdit(svc)}
                  className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-button-utility text-button-utility transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">
                    edit
                  </span>
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleActive(svc)}
                  className={`px-3 py-1.5 rounded-full font-button-utility text-button-utility transition-all flex items-center gap-1 ${svc.is_active ? "bg-tertiary-fixed text-on-tertiary-fixed hover:bg-tertiary" : "bg-primary-container text-on-primary hover:bg-primary"}`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {svc.is_active ? "visibility_off" : "visibility"}
                  </span>
                  <span>{svc.is_active ? "Deactivate" : "Activate"}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
