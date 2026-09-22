"use client"
import React, { useEffect, useState } from "react"
import { api } from "../../../../lib/api-client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { SIZE_PRESETS } from "../../../../components/design-studio/SizePresets"
import { DesignState, defaultDesignState } from "../../../../components/design-studio/types"
import { DesignCanvas } from "../../../../components/design-studio/primitives"
import { TEMPLATES } from "../../../../components/design-studio/TemplateRegistry"

export default function DesignStudioEditor({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params)
  const isNew = unwrappedParams.id === 'new'
  const router = useRouter()
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  
  const [state, setState] = useState<DesignState>(defaultDesignState)
  const [services, setServices] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'content' | 'services' | 'brand' | 'colors' | 'typography' | 'layout' | 'template'>('template')
  
  useEffect(() => {
    fetchServices()
    if (!isNew) {
      fetchDesign()
    }
  }, [unwrappedParams.id])

  const fetchServices = async () => {
    try {
      const res = await api.get('/business-core/products')
      const items = res.data.items || res.data || []
      setServices((Array.isArray(items) ? items : []).filter((p: any) => p.type === 'SERVICE'))
    } catch (e) {}
  }

  const fetchDesign = async () => {
    try {
      const res = await api.get('/design-studio/designs')
      const design = res.data.find((d: any) => d.id === unwrappedParams.id)
      if (design && design.settings && design.settings.version) {
        setState({
          ...defaultDesignState, // fallback for missing fields in old designs
          ...design.settings,
        })
      } else if (design) {
        // Migration mapping from old flat format if necessary
        setState(prev => ({
          ...prev,
          width: design.width,
          height: design.height,
          unit: design.unit,
          templateId: design.template,
          content: { ...prev.content, businessName: design.name },
          services: design.settings?.servicesSnapshot || []
        }))
      }
    } catch (e) {
      toast.error("Failed to load design")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      name: state.content.businessName,
      type: 'BANNER',
      width: state.width,
      height: state.height,
      unit: state.unit,
      template: state.templateId,
      settings: state,
      // Pass serviceIds to trigger backend snapshot refresh if needed
      serviceIds: state.services.map(s => s.serviceId)
    }

    try {
      if (isNew) {
        await api.post('/design-studio/designs', payload)
        toast.success("Created successfully")
        router.push('/admin/design-studio')
      } else {
        await api.put(`/design-studio/designs/${unwrappedParams.id}`, payload)
        toast.success("Saved successfully")
      }
    } catch (err) {
      toast.error("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const updateState = (category: keyof DesignState, field: string, value: any) => {
    setState(prev => ({
      ...prev,
      [category]: typeof prev[category] === 'object' && !Array.isArray(prev[category])
        ? { ...(prev[category] as any), [field]: value }
        : value
    }))
  }

  const handlePresetChange = (presetId: string) => {
    const preset = SIZE_PRESETS.find(p => p.id === presetId)
    if (preset) {
      setState(prev => ({ ...prev, width: preset.width, height: preset.height, unit: preset.unit }))
    }
  }

  const toggleService = (s: any) => {
    setState(prev => {
      const exists = prev.services.find(x => x.serviceId === s.id)
      if (exists) {
        return { ...prev, services: prev.services.filter(x => x.serviceId !== s.id) }
      } else {
        return { 
          ...prev, 
          services: [...prev.services, { 
            serviceId: s.id, 
            name: s.name, 
            price: Number(s.sellingPrice), 
            unit: s.unit?.name || null,
            categoryName: s.category?.name || 'Uncategorized',
            displayOrder: prev.services.length,
            description: s.description || null,
            imageUrl: s.imageUrl || null
          }] 
        }
      }
    })
  }

  const handleRefreshServicePrices = async () => {
    try {
       const res = await api.get('/business-core/products');
       const updatedCatalog = res.data.items || res.data || [];
       setState(prev => {
          const newServices = prev.services.map(ps => {
             const found = updatedCatalog.find((c: any) => c.id === ps.serviceId);
             if (found) {
                return { ...ps, price: Number(found.sellingPrice), name: found.name, unit: found.unit?.name || ps.unit, description: found.description || ps.description, imageUrl: found.imageUrl || ps.imageUrl };
             }
             return ps;
          });
          return { ...prev, services: newServices };
       });
       toast.success("Prices refreshed from catalog!");
    } catch (e) {
       toast.error("Failed to refresh prices");
    }
  }

  if (loading) return <div className="p-8">Loading Editor...</div>

  const TemplateComponent = TEMPLATES[state.templateId]?.component || TEMPLATES['StandardListTemplate'].component

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* LEFT PANEL */}
      <div className="w-96 bg-white border-r flex flex-col h-full overflow-hidden shrink-0 z-10 shadow-sm">
        <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-slate-900">{isNew ? 'New Design' : 'Edit Design'}</h1>
            <p className="text-xs text-slate-500">Auto-preview enabled</p>
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm disabled:opacity-50 hover:bg-primary/90"
          >
            {saving ? 'Saving...' : 'Save Design'}
          </button>
        </div>
        
        {/* TAB NAVIGATION */}
        <div className="flex overflow-x-auto border-b hide-scrollbar bg-slate-50 shrink-0 custom-scrollbar">
          {['template', 'content', 'services', 'brand', 'colors', 'typography', 'layout'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-3 text-xs font-medium uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white">
          
          {activeTab === 'template' && (
            <div className="space-y-4">
               <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Select Template</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(TEMPLATES).map(([id, tpl]) => (
                    <div 
                      key={id} 
                      onClick={() => setState(prev => ({ ...prev, templateId: id }))}
                      className={`p-3 text-sm border rounded-md cursor-pointer text-center ${state.templateId === id ? 'border-primary bg-primary/5 font-semibold text-primary' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      {tpl.name}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-2 mt-6">Physical Dimensions</label>
                <select 
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  onChange={e => handlePresetChange(e.target.value)}
                  value={SIZE_PRESETS.find(p => p.width === state.width && p.height === state.height)?.id || 'custom'}
                >
                  <option value="custom">Custom Size</option>
                  {SIZE_PRESETS.map(p => <option key={p.id} value={p.id}>{p.name} ({p.width}x{p.height} {p.unit})</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input type="number" value={state.width} onChange={e => updateState('width', '', Number(e.target.value))} className="border rounded px-2 py-1 text-sm" placeholder="Width" />
                  <input type="number" value={state.height} onChange={e => updateState('height', '', Number(e.target.value))} className="border rounded px-2 py-1 text-sm" placeholder="Height" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-4">
               {Object.keys(defaultDesignState.content).map(key => (
                 <div key={key}>
                   <label className="block text-xs font-semibold text-slate-600 capitalize mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                   <textarea 
                     value={(state.content as any)[key]} 
                     onChange={e => updateState('content', key, e.target.value)}
                     className="w-full border rounded-md px-3 py-2 text-sm"
                     rows={key === 'customText' ? 4 : 1}
                   />
                 </div>
               ))}
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-4">
               <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-600 uppercase">Select Services</label>
                  <button onClick={handleRefreshServicePrices} className="text-xs text-primary hover:underline">Refresh Prices</button>
               </div>
               
               <div className="space-y-2">
                 {services.map(s => (
                    <label key={s.id} className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-md cursor-pointer border border-transparent hover:border-slate-200 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={!!state.services.find(x => x.serviceId === s.id)} 
                        onChange={() => toggleService(s)} 
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-slate-500">৳{Number(s.sellingPrice)}</p>
                      </div>
                    </label>
                 ))}
               </div>
            </div>
          )}

          {activeTab === 'brand' && (
            <div className="space-y-4">
               <div>
                 <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Logo Image URL</label>
                 <input 
                    type="text"
                    value={state.brand.logoUrl || ''} 
                    onChange={e => updateState('brand', 'logoUrl', e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    placeholder="https://..."
                 />
                 <p className="text-[10px] text-slate-500 mt-1">Full MediaPicker integration pending. Provide external URL for now.</p>
               </div>
               <div>
                 <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Background Image URL</label>
                 <input 
                    type="text"
                    value={state.brand.backgroundImageUrl || ''} 
                    onChange={e => updateState('brand', 'backgroundImageUrl', e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    placeholder="https://..."
                 />
                 <p className="text-[10px] text-slate-500 mt-1">Used in Photo Background template.</p>
               </div>
            </div>
          )}

          {activeTab === 'colors' && (
            <div className="space-y-4">
               {Object.keys(defaultDesignState.colors).map(key => (
                 <div key={key} className="flex items-center justify-between">
                   <label className="text-sm font-medium text-slate-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                   <div className="flex space-x-2 w-32">
                     <input type="color" value={(state.colors as any)[key]} onChange={e => updateState('colors', key, e.target.value)} className="h-8 w-8 rounded cursor-pointer p-0" />
                     <input type="text" value={(state.colors as any)[key]} onChange={e => updateState('colors', key, e.target.value)} className="w-full border rounded text-xs px-2" />
                   </div>
                 </div>
               ))}
            </div>
          )}

          {activeTab === 'typography' && (
            <div className="space-y-4">
               <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Font Family</label>
                  <select value={state.typography.fontFamily} onChange={e => updateState('typography', 'fontFamily', e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                    <option value='"Inter", "Kalpurush", sans-serif'>Inter / Kalpurush (Default)</option>
                    <option value='"Outfit", "Kalpurush", sans-serif'>Outfit / Kalpurush</option>
                    <option value='"Noto Sans Bengali", sans-serif'>Noto Sans Bengali</option>
                    <option value='"Roboto", sans-serif'>Roboto</option>
                  </select>
               </div>
               {['headingSize', 'bodySize', 'priceSize'].map(key => (
                 <div key={key}>
                   <label className="block text-xs font-semibold text-slate-600 capitalize mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                   <input type="text" value={(state.typography as any)[key]} onChange={e => updateState('typography', key, e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
                 </div>
               ))}
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="space-y-4">
               <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Service List Mode</label>
                  <select value={state.layout.serviceListMode} onChange={e => updateState('layout', 'serviceListMode', e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                    <option value="list">List</option>
                    <option value="grid">Grid</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Logo Placement</label>
                  <select value={state.layout.logoPlacement} onChange={e => updateState('layout', 'logoPlacement', e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                    <option value="top-center">Top Center</option>
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="hidden">Hidden</option>
                  </select>
               </div>
               <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
                  <input type="checkbox" checked={state.layout.safeAreaEnabled} onChange={e => updateState('layout', 'safeAreaEnabled', e.target.checked)} id="safeArea" />
                  <label htmlFor="safeArea" className="text-sm font-medium">Show Print Safe Area</label>
               </div>
               <div className="flex items-center space-x-2 mt-2">
                  <input type="checkbox" checked={state.layout.showDescriptions} onChange={e => updateState('layout', 'showDescriptions', e.target.checked)} id="showDescriptions" />
                  <label htmlFor="showDescriptions" className="text-sm font-medium">Show Service Descriptions</label>
               </div>
               <div className="flex items-center space-x-2 mt-2">
                  <input type="checkbox" checked={state.layout.showServiceImages} onChange={e => updateState('layout', 'showServiceImages', e.target.checked)} id="showServiceImages" />
                  <label htmlFor="showServiceImages" className="text-sm font-medium">Show Service Images</label>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* CANVAS AREA */}
      <div className="flex-1 bg-slate-800 overflow-y-auto overflow-x-hidden relative flex items-center justify-center p-8 custom-scrollbar">
         <DesignCanvas state={state}>
            <TemplateComponent state={state} />
         </DesignCanvas>
      </div>
    </div>
  )
}
