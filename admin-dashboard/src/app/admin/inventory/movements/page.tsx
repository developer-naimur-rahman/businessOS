"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "../../../../components/layout/page-header";
import { DataTable } from "../../../../components/ui/data-table";
import { api } from "../../../../lib/api-client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Movement {
  id: string;
  type: string;
  quantity: string | number;
  movementDate: string;
  referenceType: string | null;
  product: {
    name: string;
    code: string | null;
  };
  warehouse: {
    name: string;
  };
}

export default function InventoryMovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const res = await api.get("/inventory/movements");
      setMovements(res.data);
    } catch (error) {
      toast.error("Failed to load inventory movements.");
    } finally {
      setLoading(false);
    }
  };

  const getMovementTypeStyle = (type: string) => {
    switch (type) {
      case 'RECEIPT':
      case 'ADJUSTMENT_IN':
      case 'TRANSFER_IN':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'ISSUE':
      case 'ADJUSTMENT_OUT':
      case 'TRANSFER_OUT':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const columns = [
    { 
      header: "Date", 
      cell: (item: Movement) => format(new Date(item.movementDate), 'MMM d, yyyy HH:mm') 
    },
    { 
      header: "Product", 
      cell: (item: Movement) => (
        <div>
          <div className="font-medium">{item.product.name}</div>
          {item.product.code && <div className="text-xs text-slate-500">{item.product.code}</div>}
        </div>
      )
    },
    { header: "Warehouse", accessorKey: "warehouse.name" as any },
    { 
      header: "Type", 
      cell: (item: Movement) => (
        <span className={`px-2 py-0.5 text-[11px] uppercase tracking-wider rounded-md font-medium border ${getMovementTypeStyle(item.type)}`}>
          {item.type.replace('_', ' ')}
        </span>
      )
    },
    { 
      header: "Quantity", 
      cell: (item: Movement) => {
        const isPositive = ['RECEIPT', 'ADJUSTMENT_IN', 'TRANSFER_IN'].includes(item.type);
        return (
          <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : '-'}{item.quantity}
          </span>
        );
      }
    },
    { header: "Reference", accessorKey: "referenceType" as keyof Movement }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Inventory Movements" description="View all inventory transactions across warehouses." />
      </div>

      <DataTable 
        data={movements} 
        columns={columns} 
        isLoading={loading} 
        emptyMessage="No inventory movements found."
      />
    </div>
  );
}
