"use client"
import React, { useState, useEffect } from "react"
import { api } from "../../../lib/api-client"
import { DataTable } from "../../../components/ui/data-table"
import { Eye } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { useRouter } from "next/navigation"

export default function SalesHistoryPage() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    try {
      const res = await api.get("/sales")
      setSales(res.data)
    } catch (error) {
      console.error("Failed to fetch sales", error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      header: "Sale Number",
      accessorKey: "saleNumber",
    },
    {
      header: "Date",
      accessorKey: "createdAt",
      cell: (item: any) => new Date(item.createdAt).toLocaleString(),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (item: any) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          item.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
        }`}>
          {item.status}
        </span>
      ),
    },
    {
      header: "Payment",
      accessorKey: "paymentStatus",
      cell: (item: any) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          item.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
        }`}>
          {item.paymentStatus}
        </span>
      ),
    },
    {
      header: "Total",
      accessorKey: "total",
      cell: (item: any) => (
        <span className="tabular-nums font-medium text-slate-900">
          ৳{Number(item.total).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (item: any) => (
        <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/sales/${item.id}`)}>
          <Eye className="w-4 h-4 mr-2" /> View Receipt
        </Button>
      ),
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales History</h1>
      </div>

      <div className="solid-elevated p-1 rounded-xl">
        <DataTable
          columns={columns}
          data={sales}
          searchKey="saleNumber"
          loading={loading}
        />
      </div>
    </div>
  )
}
