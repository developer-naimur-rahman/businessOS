"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "../../../components/layout/page-header";
import { DataTable } from "../../../components/ui/data-table";
import { api } from "../../../lib/api-client";
import { toast } from "sonner";
import { Modal } from "../../../components/ui/modal";

interface Supplier {
  id: string;
  code: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  status: "ACTIVE" | "INACTIVE";
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', status: 'ACTIVE' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/business-core/suppliers");
      setSuppliers(res.data);
    } catch (error) {
      toast.error("Failed to load suppliers.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.post("/business-core/suppliers", formData);
      toast.success("Supplier created successfully");
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', email: '', status: 'ACTIVE' });
      fetchSuppliers();
    } catch (error) {
      toast.error("Failed to create supplier");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { header: "Name", accessorKey: "name" as keyof Supplier },
    { header: "Phone", accessorKey: "phone" as keyof Supplier },
    { header: "Email", accessorKey: "email" as keyof Supplier },
    { 
      header: "Status", 
      cell: (item: Supplier) => (
        <span className={`px-2 py-0.5 text-[11px] uppercase tracking-wider rounded-md font-medium border ${item.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
          {item.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Suppliers" description="Manage your suppliers and vendors." />
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Add Supplier
        </button>
      </div>

      <DataTable 
        data={suppliers} 
        columns={columns} 
        isLoading={loading} 
        emptyMessage="No suppliers found. Click 'Add Supplier' to create one."
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !isSubmitting && setIsModalOpen(false)} 
        title="Add Supplier"
        footer={
          <>
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              form="supplier-form"
              disabled={isSubmitting || !formData.name}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save Supplier'}
            </button>
          </>
        }
      >
        <form id="supplier-form" onSubmit={handleCreateSupplier} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name <span className="text-destructive">*</span></label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" 
              placeholder="E.g. Supplier Corp" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary tabular-nums" 
                placeholder="+880..." 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" 
                placeholder="email@example.com" 
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
