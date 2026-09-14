"use client"
import React, { useEffect, useState } from "react"
import { api } from "../../lib/api-client"
import { ArrowRight, ShoppingCart, Activity, Package, Plus, Receipt } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const [data, setData] = useState<any>({
    sales: [],
    customersCount: 0,
    revenue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardMetrics() {
      try {
        const [salesRes, customersRes] = await Promise.all([
          api.get('/sales').catch(() => null),
          api.get('/business-core/customers').catch(() => null)
        ]);
        const sales = salesRes?.data || [];
        const customers = customersRes?.data || [];
        
        let totalRevenue = 0;
        sales.forEach((s: any) => { totalRevenue += Number(s.totalAmount || 0); });

        setData({
          sales: sales.slice(0, 5), // Recent 5 sales
          revenue: totalRevenue,
          customersCount: customers.length
        });
      } catch (err) {
        console.error("Failed to load dashboard metrics");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardMetrics();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Top Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-1">Good morning.</h1>
          <p className="text-slate-500">Here's what's happening with your business today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/pos" className="control-button-primary shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> New Sale
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column - Operations */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Business Overview Inline */}
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-meta mb-1">Today's Revenue</p>
              <p className="text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
                {loading ? "..." : `৳${data.revenue.toLocaleString()}`}
              </p>
            </div>
            <div>
              <p className="text-meta mb-1">Active Customers</p>
              <p className="text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
                {loading ? "..." : data.customersCount}
              </p>
            </div>
            <div>
              <p className="text-meta mb-1">Pending Orders</p>
              <p className="text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">0</p>
            </div>
          </div>

          <div className="h-px bg-slate-200/80 w-full"></div>

          {/* Recent Sales Table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-title-2">Recent Sales</h2>
              <Link href="/admin/sales" className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center transition-colors">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            <div className="surface-elevated overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/50 border-b border-slate-200/70">
                  <tr>
                    <th className="font-medium text-slate-500 px-4 py-3">Receipt</th>
                    <th className="font-medium text-slate-500 px-4 py-3">Time</th>
                    <th className="font-medium text-slate-500 px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
                  ) : data.sales.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center">
                        <div className="flex flex-col items-center">
                          <Receipt className="w-8 h-8 text-slate-300 mb-2" />
                          <p className="text-slate-500">No sales yet today</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data.sales.map((sale: any) => (
                      <tr key={sale.id} className="table-row-refined group cursor-pointer">
                        <td className="px-4 py-3 font-medium text-slate-900">{sale.saleNumber}</td>
                        <td className="px-4 py-3 text-slate-500">{new Date(sale.createdAt).toLocaleTimeString()}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">৳{Number(sale.totalAmount).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Secondary Actions & Alerts */}
        <div className="space-y-8">
          
          {/* Quick Actions List (No Cards, just refined list) */}
          <div>
            <h3 className="text-meta mb-4 text-slate-500">Quick Actions</h3>
            <div className="flex flex-col gap-1">
              <Link href="/admin/inventory" className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700">
                <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">
                  <Package className="w-4 h-4" />
                </div>
                Receive Inventory
              </Link>
              <Link href="/admin/finance/transactions" className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700">
                <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">
                  <Activity className="w-4 h-4" />
                </div>
                Record Expense
              </Link>
            </div>
          </div>

          <div className="h-px bg-slate-200/80 w-full"></div>

          {/* Operational Alerts */}
          <div>
            <h3 className="text-meta mb-4 text-slate-500">Alerts</h3>
            <div className="surface-elevated p-4 border-l-2 border-l-amber-500">
              <h4 className="text-sm font-semibold text-slate-900 mb-1">Low Stock Warning</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                You have items that are below their minimum threshold. Please check the inventory dashboard.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
