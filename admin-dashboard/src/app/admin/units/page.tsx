"use client"
import React, { useEffect, useState } from "react"
import { api } from "../../../lib/api-client"
import { Plus, Search, MoreHorizontal, Scale } from "lucide-react"

export default function AdminUnitsPage() {
  const [units, setUnits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUnits() {
      try {
        const res = await api.get('/business-core/units')
        setUnits(res.data)
      } catch (err) {
        console.error("Failed to load units", err)
      } finally {
        setLoading(false)
      }
    }
    fetchUnits()
  }, [])

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-1">Units of Measurement</h1>
          <p className="text-slate-500">Define standard units for your products and services.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="control-button-primary shadow-sm h-10 px-4">
            <Plus className="w-4 h-4 mr-2" /> New Unit
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search units..." 
            className="control-input pl-9 h-10 w-full"
          />
        </div>
      </div>

      {/* Units Table */}
      <div className="surface-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200/70">
              <tr>
                <th className="font-medium text-slate-500 px-4 py-3">Unit Name</th>
                <th className="font-medium text-slate-500 px-4 py-3">Abbreviation</th>
                <th className="font-medium text-slate-500 px-4 py-3 text-right w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">Loading units...</td></tr>
              ) : units.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center">
                    <Scale className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No units found</p>
                    <p className="text-slate-400 text-sm">Define standard units like Pieces, kg, or Liters.</p>
                  </td>
                </tr>
              ) : (
                units.map((unit: any) => (
                  <tr key={unit.id} className="table-row-refined group">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{unit.name}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {unit.abbreviation ? (
                        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200">
                          {unit.abbreviation}
                        </span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  )
}
