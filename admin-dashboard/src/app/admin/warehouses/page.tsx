"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "../../../components/layout/page-header";
import { DataTable } from "../../../components/ui/data-table";
import { api } from "../../../lib/api-client";
import { toast } from "sonner";
import { Modal } from "../../../components/ui/modal";

interface Warehouse {
  id: string;
  code: string | null;
  name: string;
  branchId: string;
  isDefault: boolean;
  isActive: boolean;
}

interface Branch {
  id: string;
  name: string;
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', code: '', branchId: '', isDefault: false, isActive: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [whRes, brRes] = await Promise.all([
        api.get("/operational-structure/warehouses"),
        api.get("/operational-structure/branches")
      ]);
      setWarehouses(whRes.data);
      setBranches(brRes.data);
    } catch (error) {
      toast.error("Failed to load warehouses.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (warehouse: Warehouse | null = null) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData({
        name: warehouse.name,
        code: warehouse.code || '',
        branchId: warehouse.branchId,
        isDefault: warehouse.isDefault,
        isActive: warehouse.isActive
      });
    } else {
      setEditingWarehouse(null);
      setFormData({ name: '', code: '', branchId: '', isDefault: false, isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (editingWarehouse) {
        await api.put(`/operational-structure/warehouses/${editingWarehouse.id}`, formData);
        toast.success("Warehouse updated successfully");
      } else {
        await api.post("/operational-structure/warehouses", formData);
        toast.success("Warehouse created successfully");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to save warehouse");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { header: "Code", accessorKey: "code" as keyof Warehouse },
    { header: "Name", accessorKey: "name" as keyof Warehouse },
    { 
      header: "Branch", 
      cell: (item: Warehouse) => {
        const branch = branches.find(b => b.id === item.branchId);
        return <span className="font-medium text-slate-700">{branch?.name || item.branchId}</span>;
      }
    },
    { 
      header: "Default", 
      cell: (item: Warehouse) => (
        item.isDefault ? <span className="px-2 py-0.5 text-[11px] uppercase tracking-wider rounded-md font-medium border bg-blue-50 text-blue-700 border-blue-200">DEFAULT</span> : null
      )
    },
    { 
      header: "Status", 
      cell: (item: Warehouse) => (
        <span className={`px-2 py-0.5 text-[11px] uppercase tracking-wider rounded-md font-medium border ${item.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
          {item.isActive ? 'ACTIVE' : 'INACTIVE'}
        </span>
      )
    },
    {
      header: "Actions",
      cell: (item: Warehouse) => (
        <button onClick={() => handleOpenModal(item)} className="text-blue-600 hover:underline text-xs font-medium">Edit</button>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Warehouses" description="Manage inventory locations across branches." />
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Add Warehouse
        </button>
      </div>

      <DataTable 
        data={warehouses} 
        columns={columns} 
        isLoading={loading} 
        emptyMessage="No warehouses found. Click 'Add Warehouse' to create one."
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !isSubmitting && setIsModalOpen(false)} 
        title={editingWarehouse ? "Edit Warehouse" : "Add Warehouse"}
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
              form="warehouse-form"
              disabled={isSubmitting || !formData.name || !formData.branchId}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save Warehouse'}
            </button>
          </>
        }
      >
        <form id="warehouse-form" onSubmit={handleCreateWarehouse} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Associated Branch <span className="text-destructive">*</span></label>
              <select 
                required
                value={formData.branchId}
                onChange={(e) => setFormData({...formData, branchId: e.target.value})}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white"
              >
                <option value="" disabled>Select a branch...</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Warehouse Name <span className="text-destructive">*</span></label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" 
                placeholder="E.g. Main Stockroom" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
              <input 
                type="text" 
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary uppercase" 
                placeholder="E.g. WH-01" 
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                  className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" 
                />
                Make Default Warehouse
              </label>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" 
                />
                Active
              </label>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
