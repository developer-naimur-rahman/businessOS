"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "../../../components/layout/page-header";
import { DataTable } from "../../../components/ui/data-table";
import { api } from "../../../lib/api-client";
import { toast } from "sonner";
import { Modal } from "../../../components/ui/modal";

interface StockBalance {
  id: string;
  warehouseId: string;
  productId: string;
  quantity: string | number;
  product?: { name: string; code: string; unit: { abbreviation: string } };
  warehouse?: { name: string };
}

export default function InventoryPage() {
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  
  // Data for selectors
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Adjustment Form
  const [adjData, setAdjData] = useState({ warehouseId: '', productId: '', quantity: 0, type: 'ADJUSTMENT_IN' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [balRes, whRes, prodRes] = await Promise.all([
        api.get("/inventory/balances"),
        api.get("/operational-structure/warehouses"),
        api.get("/business-core/products")
      ]);
      setBalances(balRes.data);
      setWarehouses(whRes.data);
      setProducts(prodRes.data.filter((p: any) => p.type === 'PRODUCT')); // Only physical products
    } catch (error) {
      toast.error("Failed to load inventory data.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.post("/inventory/adjustments", {
        ...adjData,
        quantity: Math.abs(Number(adjData.quantity))
      });
      toast.success("Stock adjustment successful");
      setIsAdjModalOpen(false);
      setAdjData({ warehouseId: '', productId: '', quantity: 0, type: 'ADJUSTMENT_IN' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to adjust stock");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { 
      header: "Warehouse", 
      cell: (item: StockBalance) => (
        <span className="font-medium text-slate-700">{item.warehouse?.name || item.warehouseId}</span>
      )
    },
    { 
      header: "Product Code", 
      cell: (item: StockBalance) => (
        <span className="font-mono text-xs">{item.product?.code || '-'}</span>
      )
    },
    { 
      header: "Product Name", 
      cell: (item: StockBalance) => item.product?.name || item.productId 
    },
    { 
      header: "On Hand", 
      align: "right" as const,
      cell: (item: StockBalance) => (
        <span className="font-medium tabular-nums">
          {Number(item.quantity).toLocaleString()} {item.product?.unit?.abbreviation || ''}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Stock Balance" description="View current on-hand inventory across all warehouses." />
        <div className="flex gap-2">
          <button 
            onClick={() => setIsAdjModalOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Stock Adjustment
          </button>
        </div>
      </div>

      <DataTable 
        data={balances} 
        columns={columns} 
        isLoading={loading} 
        emptyMessage="No stock balances found. Create a stock adjustment or receive a purchase."
      />

      <Modal 
        isOpen={isAdjModalOpen} 
        onClose={() => !isSubmitting && setIsAdjModalOpen(false)} 
        title="Stock Adjustment"
        footer={
          <>
            <button 
              type="button"
              onClick={() => setIsAdjModalOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              form="adj-form"
              disabled={isSubmitting || !adjData.warehouseId || !adjData.productId || adjData.quantity <= 0}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Processing...' : 'Confirm Adjustment'}
            </button>
          </>
        }
      >
        <form id="adj-form" onSubmit={handleAdjustment} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Movement Type</label>
              <div className="flex bg-slate-100 p-1 rounded-md">
                <button
                  type="button"
                  onClick={() => setAdjData({...adjData, type: 'ADJUSTMENT_IN'})}
                  className={`flex-1 py-1.5 text-sm font-medium rounded ${adjData.type === 'ADJUSTMENT_IN' ? 'bg-white shadow-sm text-green-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Adjust In (Add)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjData({...adjData, type: 'ADJUSTMENT_OUT'})}
                  className={`flex-1 py-1.5 text-sm font-medium rounded ${adjData.type === 'ADJUSTMENT_OUT' ? 'bg-white shadow-sm text-destructive' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Adjust Out (Remove)
                </button>
              </div>
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Warehouse <span className="text-destructive">*</span></label>
              <select 
                required
                value={adjData.warehouseId}
                onChange={(e) => setAdjData({...adjData, warehouseId: e.target.value})}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white"
              >
                <option value="" disabled>Select warehouse...</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Product <span className="text-destructive">*</span></label>
              <select 
                required
                value={adjData.productId}
                onChange={(e) => setAdjData({...adjData, productId: e.target.value})}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white"
              >
                <option value="" disabled>Select physical product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>[{p.code || 'NO-CODE'}] {p.name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity <span className="text-destructive">*</span></label>
              <input 
                type="number" 
                min="0.01"
                step="0.01"
                required
                value={adjData.quantity || ''}
                onChange={(e) => setAdjData({...adjData, quantity: parseFloat(e.target.value)})}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary tabular-nums" 
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
