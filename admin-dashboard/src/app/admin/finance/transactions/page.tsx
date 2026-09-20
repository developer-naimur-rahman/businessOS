"use client"
import React, { useState, useEffect } from "react"
import { DataTable } from "../../../../components/ui/data-table"
import { ArrowDownRight, ArrowUpRight, FileText } from "lucide-react"
import { Button } from "../../../../components/ui/button"

import { api } from "../../../../lib/api-client"

export default function FinanceTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await api.get("/finance/journal-entries")
        // Map the backend data to match the UI format or update the UI. The real backend has lines.
        // For simplicity we will flatten them or just store them and render the first line for display.
        const formatted = res.data.flatMap((entry: any) => 
          entry.lines.map((line: any) => ({
            id: line.id,
            date: entry.accountingDate,
            reference: entry.description,
            description: entry.referenceType + ' ' + entry.referenceId,
            account: line.account.name,
            type: line.debit > 0 ? 'DEBIT' : 'CREDIT',
            amount: line.debit > 0 ? line.debit : line.credit,
            balance: 0 // The backend doesn't return running balance in this payload easily, default to 0
          }))
        )
        setTransactions(formatted)
        setLoading(false)
      } catch (error) {
        console.error("Failed to fetch transactions", error)
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [])

  const columns = [
    {
      header: "Date",
      accessorKey: "date",
      cell: (item: any) => (
        <span className="text-slate-600">
          {new Date(item.date).toLocaleDateString()} <span className="text-xs text-slate-400">{new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </span>
      ),
    },
    {
      header: "Reference",
      accessorKey: "reference",
      cell: (item: any) => <span className="font-medium text-slate-900">{item.reference}</span>
    },
    {
      header: "Description",
      accessorKey: "description",
    },
    {
      header: "Account",
      accessorKey: "account",
      cell: (item: any) => <span className="text-slate-600 text-sm">{item.account}</span>
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: (item: any) => (
        <div className="flex items-center justify-end gap-2 pr-4">
          {item.type === 'CREDIT' ? (
            <ArrowDownRight className="w-4 h-4 text-emerald-500" />
          ) : (
            <ArrowUpRight className="w-4 h-4 text-rose-500" />
          )}
          <span className={`tabular-nums font-semibold ${item.type === 'CREDIT' ? 'text-emerald-700' : 'text-rose-700'}`}>
            {item.type === 'CREDIT' ? '+' : '-'} ৳{Number(item.amount).toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      header: "Balance",
      accessorKey: "balance",
      cell: (item: any) => (
        <span className="tabular-nums text-slate-500 text-right block pr-4">
          ৳{Number(item.balance).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (item: any) => (
        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-900">
          <FileText className="w-4 h-4" />
        </Button>
      ),
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">General Journal</h1>
          <p className="text-sm text-slate-500 mt-1">Immutable record of all financial transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="interaction-bounce">
            Export
          </Button>
          <Button className="bg-slate-900 text-white interaction-bounce">
            Manual Entry
          </Button>
        </div>
      </div>

      <div className="solid-elevated p-1 rounded-xl">
        <DataTable
          columns={columns}
          data={transactions}
          isLoading={loading}
        />
      </div>
    </div>
  )
}
