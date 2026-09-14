"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "../../../components/layout/page-header";
import { DataTable } from "../../../components/ui/data-table";
import { api } from "../../../lib/api-client";
import { toast } from "sonner";
import { Modal } from "../../../components/ui/modal";

interface Category {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', description: '', parentId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get("/business-core/categories");
      setCategories(res.data);
    } catch (error) {
      toast.error("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        parentId: formData.parentId || undefined
      };
      await api.post("/business-core/categories", payload);
      toast.success("Category created successfully");
      setIsModalOpen(false);
      setFormData({ name: '', description: '', parentId: '' });
      fetchCategories();
    } catch (error) {
      toast.error("Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { header: "Category Name", accessorKey: "name" as keyof Category },
    { header: "Description", accessorKey: "description" as keyof Category },
    { 
      header: "Type", 
      cell: (item: Category) => (
        <span className={`px-2 py-0.5 text-[11px] uppercase tracking-wider rounded-md font-medium border ${item.parentId ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
          {item.parentId ? 'Subcategory' : 'Main Category'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Categories" description="Organize your products and services." />
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Add Category
        </button>
      </div>

      <DataTable 
        data={categories} 
        columns={columns} 
        isLoading={loading} 
        emptyMessage="No categories found. Click 'Add Category' to create one."
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !isSubmitting && setIsModalOpen(false)} 
        title="Add Category"
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
              form="category-form"
              disabled={isSubmitting || !formData.name}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save Category'}
            </button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleCreateCategory} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category Name <span className="text-destructive">*</span></label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" 
              placeholder="E.g. Electronics, Services" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Parent Category (Optional)</label>
            <select 
              value={formData.parentId}
              onChange={(e) => setFormData({...formData, parentId: e.target.value})}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white"
            >
              <option value="">None (Top Level)</option>
              {categories.filter(c => !c.parentId).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
