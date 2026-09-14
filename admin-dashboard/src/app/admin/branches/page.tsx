"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "../../../components/layout/page-header";
import { DataTable } from "../../../components/ui/data-table";
import { api } from "../../../lib/api-client";
import { toast } from "sonner";
import { Modal } from "../../../components/ui/modal";

interface Branch {
  id: string;
  code: string | null;
  name: string;
  location: string | null;
  phone: string | null;
  isActive: boolean;
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', code: '', location: '', phone: '', isActive: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await api.get("/operational-structure/branches");
      setBranches(res.data);
    } catch (error) {
      toast.error("Failed to load branches.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.post("/operational-structure/branches", formData);
      toast.success("Branch created successfully");
      setIsModalOpen(false);
      setFormData({ name: '', code: '', location: '', phone: '', isActive: true });
      fetchBranches();
    } catch (error) {
      toast.error("Failed to create branch");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { header: "Code", accessorKey: "code" as keyof Branch },
    { header: "Name", accessorKey: "name" as keyof Branch },
    { header: "Location", accessorKey: "location" as keyof Branch },
    { 
      header: "Status", 
      cell: (item: Branch) => (
        <span className={`px-2 py-0.5 text-[11px] uppercase tracking-wider rounded-md font-medium border ${item.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
          {item.isActive ? 'ACTIVE' : 'INACTIVE'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Branches" description="Manage your organization's physical or logical branches." />
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Add Branch
        </button>
      </div>

      <DataTable 
        data={branches} 
        columns={columns} 
        isLoading={loading} 
        emptyMessage="No branches found. Click 'Add Branch' to create one."
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !isSubmitting && setIsModalOpen(false)} 
        title="Add Branch"
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
              form="branch-form"
              disabled={isSubmitting || !formData.name}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save Branch'}
            </button>
          </>
        }
      >
        <form id="branch-form" onSubmit={handleCreateBranch} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Branch Name <span className="text-destructive">*</span></label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" 
                placeholder="E.g. Main Shop" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Branch Code</label>
              <input 
                type="text" 
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary uppercase" 
                placeholder="E.g. B-01" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary tabular-nums" 
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Location / Address</label>
              <input 
                type="text" 
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" 
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
