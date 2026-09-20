"use client"
import React, { useEffect, useState } from "react"
import { api } from "../../../lib/api-client"
import { Search, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, Package, History } from "lucide-react"
import { Modal } from "../../../components/ui/modal"

export default function AdminInventoryPage() {
  const [balances, setBalances] = useState<any[]>([])
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'balances' | 'movements'>('balances')

  const [products, setProducts] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])

  const [modalType, setModalType] = useState<'receive' | 'issue' | 'transfer' | null>(null)
  const [formData, setFormData] = useState({
    warehouseId: '',
    productId: '',
    quantity: '',
    notes: '',
    destinationWarehouseId: '' // For transfers
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchInventory = async () => {
    try {
      const [balRes, movRes, prodRes, whRes] = await Promise.all([
        api.get('/inventory/balances'),
        api.get('/inventory/movements'),
        api.get('/business-core/products'),
        api.get('/operational-structure/warehouses')
      ])
      setBalances(balRes.data)
      setMovements(movRes.data)
      setProducts(prodRes.data)
      setWarehouses(whRes.data)
    } catch (err) {
      console.error("Failed to load inventory data", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  const handleOpenModal = (type: 'receive' | 'issue' | 'transfer') => {
    setModalType(type)
    setFormData({
      warehouseId: warehouses.length > 0 ? warehouses[0].id : '',
      productId: products.length > 0 ? products[0].id : '',
      quantity: '',
      notes: '',
      destinationWarehouseId: warehouses.length > 1 ? warehouses[1].id : ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (modalType === 'transfer') {
        await api.post('/inventory/transfers', {
          sourceWarehouseId: formData.warehouseId,
          destinationWarehouseId: formData.destinationWarehouseId,
          productId: formData.productId,
          quantity: Number(formData.quantity),
          notes: formData.notes
        })
      } else {
        await api.post('/inventory/adjustments', {
          warehouseId: formData.warehouseId,
          productId: formData.productId,
          quantity: Number(formData.quantity),
          type: modalType === 'receive' ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
          notes: formData.notes
        })
      }
      setModalType(null)
      fetchInventory()
    } catch (err) {
      alert("Operation failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-1">Inventory Operations</h1>
          <p className="text-slate-500">Track and manage stock levels across all locations.</p>
        </div>
        
        {/* Operational Actions */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button onClick={() => handleOpenModal('receive')} className="control-button-secondary bg-white h-10 px-4 flex items-center shadow-sm">
            <ArrowDownToLine className="w-4 h-4 mr-2 text-emerald-600" /> Receive Stock
          </button>
          <button onClick={() => handleOpenModal('issue')} className="control-button-secondary bg-white h-10 px-4 flex items-center shadow-sm">
            <ArrowUpFromLine className="w-4 h-4 mr-2 text-rose-600" /> Issue Stock
          </button>
          <button onClick={() => handleOpenModal('transfer')} className="control-button-secondary bg-white h-10 px-4 flex items-center shadow-sm">
            <ArrowRightLeft className="w-4 h-4 mr-2 text-blue-600" /> Transfer
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex bg-slate-100/80 p-1 rounded-xl w-full md:w-auto overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab('balances')}
            className={`flex-1 md:flex-none flex items-center justify-center px-6 h-9 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'balances' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4 mr-2" /> Stock Balances
          </button>
          <button 
            onClick={() => setActiveTab('movements')}
            className={`flex-1 md:flex-none flex items-center justify-center px-6 h-9 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'movements' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 mr-2" /> Movement History
          </button>
        </div>
        
        <div className="hidden md:block relative w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search SKU or product..." className="control-input pl-9 h-10 w-full" />
        </div>
      </div>

      <div className="surface-elevated overflow-hidden">
        {activeTab === 'balances' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 border-b border-slate-200/70">
                <tr>
                  <th className="font-medium text-slate-500 px-4 py-3">Product</th>
                  <th className="font-medium text-slate-500 px-4 py-3">Location</th>
                  <th className="font-medium text-slate-500 px-4 py-3 text-right">Available Qty</th>
                  <th className="font-medium text-slate-500 px-4 py-3 text-right">Reserved Qty</th>
                  <th className="font-medium text-slate-500 px-4 py-3 text-right">Physical Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Calculating balances...</td></tr>
                ) : balances.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <Package className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No inventory balances found</p>
                      <p className="text-slate-400 text-sm">Receive stock to see balances here.</p>
                    </td>
                  </tr>
                ) : (
                  balances.map((balance: any) => (
                    <tr key={balance.id} className="table-row-refined group">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{balance.product?.name || 'Unknown Product'}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{balance.product?.code || 'NO-SKU'}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{balance.warehouse?.name || 'Main Warehouse'}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-emerald-600">
                        {Number(balance.availableQuantity).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-amber-600">
                        {Number(balance.reservedQuantity).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
                        {Number(balance.physicalQuantity).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'movements' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 border-b border-slate-200/70">
                <tr>
                  <th className="font-medium text-slate-500 px-4 py-3">Time</th>
                  <th className="font-medium text-slate-500 px-4 py-3">Type</th>
                  <th className="font-medium text-slate-500 px-4 py-3">Product</th>
                  <th className="font-medium text-slate-500 px-4 py-3">Location</th>
                  <th className="font-medium text-slate-500 px-4 py-3 text-right">Qty Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading history...</td></tr>
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <History className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No movements recorded</p>
                    </td>
                  </tr>
                ) : (
                  movements.map((movement: any) => (
                    <tr key={movement.id} className="table-row-refined">
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(movement.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider ${
                          movement.type.includes('IN') ? 'bg-emerald-50 text-emerald-700' :
                          movement.type.includes('OUT') ? 'bg-rose-50 text-rose-700' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          {movement.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{movement.product?.name}</td>
                      <td className="px-4 py-3 text-slate-600">{movement.warehouse?.name}</td>
                      <td className={`px-4 py-3 text-right tabular-nums font-medium ${
                        Number(movement.quantity) > 0 ? 'text-emerald-600' : 
                        Number(movement.quantity) < 0 ? 'text-rose-600' : 'text-slate-500'
                      }`}>
                        {Number(movement.quantity) > 0 ? '+' : ''}{Number(movement.quantity).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={!!modalType}
        onClose={() => !isSubmitting && setModalType(null)}
        title={
          modalType === 'receive' ? "Receive Stock" : 
          modalType === 'issue' ? "Issue Stock" : "Transfer Stock"
        }
        footer={
          <>
            <button onClick={() => setModalType(null)} disabled={isSubmitting} className="control-button-secondary h-10 px-4">Cancel</button>
            <button onClick={handleSubmit} disabled={isSubmitting} className="control-button-primary h-10 px-6">
              {isSubmitting ? "Processing..." : "Confirm"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase">Product</label>
            <select required value={formData.productId} onChange={e => setFormData({...formData, productId: e.target.value})} className="control-input w-full h-10 mt-1">
              <option value="" disabled>Select Product</option>
              {products.filter(p => p.type === 'PRODUCT').map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.code || 'NO SKU'})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase">
                {modalType === 'transfer' ? 'Source Warehouse' : 'Warehouse'}
              </label>
              <select required value={formData.warehouseId} onChange={e => setFormData({...formData, warehouseId: e.target.value})} className="control-input w-full h-10 mt-1">
                <option value="" disabled>Select Location</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            {modalType === 'transfer' ? (
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Destination Warehouse</label>
                <select required value={formData.destinationWarehouseId} onChange={e => setFormData({...formData, destinationWarehouseId: e.target.value})} className="control-input w-full h-10 mt-1">
                  <option value="" disabled>Select Destination</option>
                  {warehouses.filter(w => w.id !== formData.warehouseId).map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Quantity</label>
                <input required type="number" min="1" step="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="control-input w-full h-10 mt-1" placeholder="0" />
              </div>
            )}
          </div>
          {modalType === 'transfer' && (
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase">Quantity</label>
              <input required type="number" min="1" step="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="control-input w-full h-10 mt-1" placeholder="0" />
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase">Notes (Optional)</label>
            <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="control-input w-full h-20 mt-1 py-2 resize-none" placeholder="Reason for adjustment..." />
          </div>
        </form>
      </Modal>

    </div>
  )
}
