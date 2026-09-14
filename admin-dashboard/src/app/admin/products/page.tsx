"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "../../../components/layout/page-header";
import { DataTable } from "../../../components/ui/data-table";
import { api } from "../../../lib/api-client";
import { toast } from "sonner";
import { Modal } from "../../../components/ui/modal";

interface Product {
  id: string;
  code: string | null;
  name: string;
  type: "PRODUCT" | "SERVICE";
  sellingPrice: string | number;
  isActive: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', code: '', type: 'PRODUCT', sellingPrice: 0, isActive: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/business-core/products");
      setProducts(res.data);
    } catch (error) {
      toast.error("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.post("/business-core/products", { ...formData, sellingPrice: Number(formData.sellingPrice) });
      toast.success("Product created successfully");
      setIsModalOpen(false);
      setFormData({ name: '', code: '', type: 'PRODUCT', sellingPrice: 0, isActive: true });
      fetchProducts();
    } catch (error) {
      toast.error("Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { header: "Code", accessorKey: "code" as keyof Product },
    { header: "Name", accessorKey: "name" as keyof Product },
    { 
      header: "Type", 
      cell: (item: Product) => (
        <span className={`px-2 py-0.5 text-[11px] uppercase tracking-wider rounded-md font-medium border ${item.type === 'PRODUCT' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
          {item.type}
        </span>
      )
    },
    { 
      header: "Price", 
      align: "right" as const,
      cell: (item: Product) => `৳${Number(item.sellingPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}` 
    },
    { 
      header: "Status", 
      cell: (item: Product) => (
        <span className={`px-2 py-0.5 text-[11px] uppercase tracking-wider rounded-md font-medium border ${item.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
          {item.isActive ? 'ACTIVE' : 'INACTIVE'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Products & Services" description="Manage your physical products and non-inventory services." />
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Add Item
        </button>
      </div>

      <DataTable 
        data={products} 
        columns={columns} 
        isLoading={loading} 
        emptyMessage="No products found. Click 'Add Item' to create one."
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !isSubmitting && setIsModalOpen(false)} 
        title="Add Product / Service"
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
              form="product-form"
              disabled={isSubmitting || !formData.name}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save Item'}
            </button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Name <span className="text-destructive">*</span></label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" 
                placeholder="E.g. A4 Paper Rim" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Item Type</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as 'PRODUCT' | 'SERVICE'})}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white"
              >
                <option value="PRODUCT">Physical Product</option>
                <option value="SERVICE">Service (No Inventory)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price</label>
              <input 
                type="number" 
                min="0"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({...formData, sellingPrice: parseFloat(e.target.value)})}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary tabular-nums" 
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
