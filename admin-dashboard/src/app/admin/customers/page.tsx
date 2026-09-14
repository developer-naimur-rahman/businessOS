"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "../../../components/layout/page-header";
import { DataTable } from "../../../components/ui/data-table";
import { api } from "../../../lib/api-client";
import { toast } from "sonner";
import { Modal } from "../../../components/ui/modal";

interface Customer {
  id: string;
  code: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  status: "ACTIVE" | "INACTIVE";
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', status: 'ACTIVE' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/business-core/customers");
      setCustomers(res.data);
    } catch (error) {
      toast.error("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.post("/business-core/customers", formData);
      toast.success("Customer created successfully");
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', email: '', status: 'ACTIVE' });
      fetchCustomers();
    } catch (error) {
      toast.error("Failed to create customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { header: "Name", accessorKey: "name" as keyof Customer },
    { header: "Phone", accessorKey: "phone" as keyof Customer },
    { header: "Email", accessorKey: "email" as keyof Customer },
    { 
      header: "Status", 
      cell: (item: Customer) => (
        <span className={`px-2 py-1 text-xs rounded-full font-medium ${item.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
          {item.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Customers" description="Manage your customer directory." />
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Add Customer
        </button>
      </div>

      <DataTable 
        data={customers} 
        columns={columns} 
        isLoading={loading} 
        emptyMessage="No customers found. Click 'Add Customer' to create one."
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !isSubmitting && setIsModalOpen(false)} 
        title="Add Customer"
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
              form="customer-form"
              disabled={isSubmitting || !formData.name}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save Customer'}
            </button>
          </>
        }
      >
        <form id="customer-form" onSubmit={handleCreateCustomer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name <span className="text-destructive">*</span></label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" 
              placeholder="E.g. Acme Corp" 
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
