"use client"
import React, { useState, useEffect } from "react"
import { DataTable } from "../../../../components/ui/data-table"
import { ArrowDownRight, ArrowUpRight, FileText } from "lucide-react"
import { Button } from "../../../../components/ui/button"

export default function FinanceTransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulated fetch for transactions journal
    setTimeout(() => {
      setTransactions([
        { id: '1', date: new Date().toISOString(), reference: 'SL-1001', description: 'POS Sale', account: 'Main Cash Register', type: 'CREDIT', amount: 4500, balance: 45000 },
        { id: '2', date: new Date(Date.now() - 86400000).toISOString(), reference: 'EX-902', description: 'Office Supplies', account: 'Main Cash Register', type: 'DEBIT', amount: 1200, balance: 40500 },
        { id: '3', date: new Date(Date.now() - 172800000).toISOString(), reference: 'TR-102', description: 'Bank Deposit', account: 'Bank Account - Brac', type: 'CREDIT', amount: 20000, balance: 125000 },
      ])
      setLoading(false)
    }, 600)
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
          searchKey="reference"
          loading={loading}
        />
      </div>
    </div>
  )
}
