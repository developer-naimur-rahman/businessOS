"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "../../../components/layout/page-header";
import { DataTable } from "../../../components/ui/data-table";
import { api } from "../../../lib/api-client";
import { toast } from "sonner";
import { Modal } from "../../../components/ui/modal";

interface Unit {
  id: string;
  name: string;
  abbreviation: string | null;
}

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', abbreviation: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const res = await api.get("/business-core/units");
      setUnits(res.data);
    } catch (error) {
      toast.error("Failed to load units.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.post("/business-core/units", formData);
      toast.success("Unit created successfully");
      setIsModalOpen(false);
      setFormData({ name: '', abbreviation: '' });
      fetchUnits();
    } catch (error) {
      toast.error("Failed to create unit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { header: "Name", accessorKey: "name" as keyof Unit },
    { 
      header: "Abbreviation", 
      cell: (item: Unit) => (
        <span className="px-2 py-1 text-xs font-mono bg-slate-100 rounded-md border border-slate-200 text-slate-700">
          {item.abbreviation || '-'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Units of Measurement" description="Manage units for your products." />
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Add Unit
        </button>
      </div>

      <DataTable 
        data={units} 
        columns={columns} 
        isLoading={loading} 
        emptyMessage="No units found. Click 'Add Unit' to create one."
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !isSubmitting && setIsModalOpen(false)} 
        title="Add Unit"
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
              form="unit-form"
              disabled={isSubmitting || !formData.name}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save Unit'}
            </button>
          </>
        }
      >
        <form id="unit-form" onSubmit={handleCreateUnit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Unit Name <span className="text-destructive">*</span></label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" 
              placeholder="E.g. Kilogram, Piece" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Abbreviation (Optional)</label>
            <input 
              type="text" 
              value={formData.abbreviation}
              onChange={(e) => setFormData({...formData, abbreviation: e.target.value})}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" 
              placeholder="E.g. kg, pcs" 
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
