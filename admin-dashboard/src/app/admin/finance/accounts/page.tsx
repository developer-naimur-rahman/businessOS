"use client"
import React, { useState, useEffect } from "react"
import { api } from "../../../../lib/api-client"
import { DataTable } from "../../../../components/ui/data-table"
import { Button } from "../../../../components/ui/button"
import { Wallet, Activity, Plus } from "lucide-react"

export default function FinanceAccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const res = await api.get("/finance/accounts")
      setAccounts(res.data)
      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch accounts", error)
      setLoading(false)
    }
  }

  const columns = [
    {
      header: "Account Name",
      accessorKey: "name",
      cell: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <Wallet className="w-4 h-4" />
          </div>
          <span className="font-medium text-slate-900">{item.name}</span>
        </div>
      )
    },
    {
      header: "Type",
      accessorKey: "type",
      cell: (item: any) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
          {item.type}
        </span>
      ),
    },
    {
      header: "Current Balance",
      accessorKey: "balance",
      cell: (item: any) => (
        <span className="tabular-nums font-semibold text-slate-900 text-right block pr-4">
          ৳{Number(item.balance).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (item: any) => (
        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-primary">
          <Activity className="w-4 h-4 mr-2" /> View Journal
        </Button>
      ),
    }
  ]

  const totalBalance = accounts.reduce((acc: number, curr: any) => acc + curr.balance, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Accounts</h1>
          <p className="text-sm text-slate-500 mt-1">Manage cash, bank, and mobile money ledgers</p>
        </div>
        <Button className="bg-primary text-white interaction-bounce">
          <Plus className="w-4 h-4 mr-2" /> New Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-elevated p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Liquidity</h3>
              <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 tabular-nums tracking-tight">
              {loading ? "..." : `৳${totalBalance.toLocaleString()}`}
            </p>
          </div>
        </div>
      </div>

      <div className="solid-elevated p-1 rounded-xl">
        <DataTable
          columns={columns}
          data={accounts}
          isLoading={loading}
        />
      </div>
    </div>
  )
}
