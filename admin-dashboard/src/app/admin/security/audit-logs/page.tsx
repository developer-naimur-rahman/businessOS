"use client"

import React, { useState, useEffect } from "react"
import { api } from "../../../../lib/api-client"
import { 
  ShieldAlert, ShieldCheck, Lock, UserCheck, RefreshCw, 
  Search, Filter, AlertTriangle, Eye, Check, X, Sliders, Layers 
} from "lucide-react"
import { toast } from "sonner"

export default function SecurityAuditLogsPage() {
  const [activeTab, setActiveTab] = useState<"stream" | "matrix">("stream")
  const [loading, setLoading] = useState(false)
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [riskFilter, setRiskFilter] = useState("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  // Role Matrix State
  const [matrixData, setMatrixData] = useState<any>({ roles: [], allAvailableScopes: [] })
  const [savingMatrix, setSavingMatrix] = useState(false)

  // JSON Diff Modal
  const [selectedLog, setSelectedLog] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [logsRes, matrixRes] = await Promise.all([
        api.get("/admin/security/audit-logs"),
        api.get("/admin/security/role-matrix"),
      ])
      setAuditLogs(logsRes.data || [])
      setMatrixData(matrixRes.data || { roles: [], allAvailableScopes: [] })
    } catch (err) {
      console.error("Failed to load security audit data:", err)
      toast.error("Failed to load audit logs or role matrix")
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePermission = (roleKey: string, scope: string) => {
    const updatedRoles = matrixData.roles.map((role: any) => {
      if (role.roleKey !== roleKey) return role

      const currentPerms = role.permissions || []
      const hasPerm = currentPerms.includes(scope) || currentPerms.includes("*")
      let newPerms: string[]

      if (hasPerm) {
        newPerms = currentPerms.filter((p: string) => p !== scope && p !== "*")
      } else {
        newPerms = [...currentPerms, scope]
      }

      return { ...role, permissions: newPerms }
    })

    setMatrixData({ ...matrixData, roles: updatedRoles })
  }

  const handleSaveMatrix = async () => {
    setSavingMatrix(true)
    try {
      const res = await api.post("/admin/security/role-matrix", { roles: matrixData.roles })
      toast.success(res.data.message || "Role matrix updated successfully")
    } catch (err) {
      toast.error("Failed to save role matrix")
    } finally {
      setSavingMatrix(false)
    }
  }

  const filteredLogs = auditLogs.filter((log) => {
    const matchesRisk = riskFilter === "ALL" || log.riskLevel === riskFilter
    const matchesSearch = 
      log.actorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityType?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesRisk && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-950">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Enterprise Governance & Staff Surveillance
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Staff Audit Trail & Granular RBAC</h1>
          <p className="text-slate-400 text-xs mt-1">
            Second-by-second activity surveillance, anomaly risk grading, and role-based access control matrix.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("stream")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "stream"
              ? "border-[#04BBFD] text-[#04BBFD]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Second-by-Second Activity Stream ({filteredLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("matrix")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "matrix"
              ? "border-[#04BBFD] text-[#04BBFD]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Interactive RBAC Permission Matrix</span>
        </button>
      </div>

      {/* ================= TAB 1: ACTIVITY STREAM ================= */}
      {activeTab === "stream" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Search className="w-4 h-4 text-slate-400 ml-1" />
              <input
                type="text"
                placeholder="Search staff, action, entity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs outline-none text-slate-800 w-64"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Risk:</span>
              {(["ALL", "CRITICAL_ANOMALY", "WARNING", "NORMAL"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRiskFilter(r)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    riskFilter === r
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {r.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Staff Actor</th>
                    <th className="p-4">Target Entity</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Risk Level</th>
                    <th className="p-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No audit logs recorded matching this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-mono text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          <div className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-extrabold text-slate-900">{log.actorName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{log.actorEmail}</div>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-slate-800">{log.entityType}</span>
                          <div className="text-[10px] text-slate-400 font-mono truncate max-w-xs">{log.entityId}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 font-mono">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            log.riskLevel === "CRITICAL_ANOMALY"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : log.riskLevel === "WARNING"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            {log.riskLevel.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 inline mr-1" />
                            Diff
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
      )}

      {/* ================= TAB 2: RBAC MATRIX ================= */}
      {activeTab === "matrix" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900">Fine-Grained Role Permission Matrix</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Toggle operational scopes per role. Changes apply globally across terminals.
              </p>
            </div>

            <button
              onClick={handleSaveMatrix}
              disabled={savingMatrix}
              className="px-6 py-2.5 bg-[#04BBFD] hover:bg-[#03a0d9] text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-[#04BBFD]/20 cursor-pointer disabled:opacity-50"
            >
              {savingMatrix ? "Saving Matrix..." : "Save Role Matrix"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-2xl overflow-hidden">
              <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-4">Permission Scope</th>
                  {matrixData.roles.map((r: any) => (
                    <th key={r.roleKey} className="p-4 text-center">
                      <div className="font-extrabold">{r.displayName}</div>
                      <div className="text-[9px] text-slate-400 font-normal">{r.roleKey}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(matrixData.allAvailableScopes || []).map((scopeObj: any) => (
                  <tr key={scopeObj.scope} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{scopeObj.scope}</div>
                      <div className="text-[11px] text-slate-500">{scopeObj.description}</div>
                      <span className="text-[10px] text-indigo-600 font-semibold">{scopeObj.group}</span>
                    </td>

                    {matrixData.roles.map((role: any) => {
                      const hasPermission = 
                        role.permissions?.includes("*") || 
                        role.permissions?.includes(scopeObj.scope)
                      const isSuperAdmin = role.permissions?.includes("*")

                      return (
                        <td key={role.roleKey} className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={hasPermission}
                            disabled={isSuperAdmin}
                            onChange={() => handleTogglePermission(role.roleKey, scopeObj.scope)}
                            className="w-4 h-4 rounded text-[#04BBFD] focus:ring-[#04BBFD] cursor-pointer disabled:opacity-40"
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* JSON Diff Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Audit Payload Inspection</h3>
                <p className="text-xs text-slate-500 font-mono">{selectedLog.action} • {selectedLog.entityType}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="font-bold text-slate-700 block mb-1">Audit Metadata:</span>
                <div>Actor: {selectedLog.actorName} ({selectedLog.actorEmail})</div>
                <div>Terminal IP: {selectedLog.ipAddress}</div>
                <div>Recorded: {selectedLog.timestamp}</div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Payload Content (JSON):</span>
                <pre className="bg-slate-900 text-slate-200 p-4 rounded-2xl overflow-x-auto text-[11px] leading-relaxed">
                  {JSON.stringify(selectedLog.newData || selectedLog.oldData, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
