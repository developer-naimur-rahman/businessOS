"use client"

import { useState, useEffect } from "react"
import { api } from "../../../../lib/api-client"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Label } from "../../../../components/ui/label"
import { DataTable } from "../../../../components/ui/data-table"
import { toast } from "sonner"
import { Save, Printer, Download } from "lucide-react"

export default function PriceListPage() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  const [pdfConfig, setPdfConfig] = useState({
    title: "OUR SERVICES",
    subtitle: "PRICE LIST",
    currency: "৳",
    pageSize: "A4",
    orientation: "Portrait",
    showCategory: true,
    showDescriptions: true,
    showUnits: true,
    showPhoneAddress: true,
    showDate: true,
    includeInactive: false
  })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const res = await api.get("/business-core/products")
      // Filter only services
      let srv = res.data.filter((p: any) => p.type === "SERVICE")
      // Sort by display order
      srv = srv.sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
      setServices(srv)
    } catch (err) {
      toast.error("Failed to load services")
    } finally {
      setLoading(false)
    }
  }

  const updateDisplayOrder = async (id: string, newOrder: string) => {
    try {
      await api.patch(`/business-core/products/${id}`, { displayOrder: parseInt(newOrder) || 0 })
      toast.success("Order updated")
      fetchServices()
    } catch (err) {
      toast.error("Failed to update order")
    }
  }

  const columns = [
    { accessorKey: "name", header: "Service Name" },
    { 
      header: "Category",
      cell: (item: any) => item.category?.name || "Uncategorized"
    },
    { 
      header: "Price",
      cell: (item: any) => `৳${Number(item.sellingPrice || 0).toFixed(2)}`
    },
    { 
      header: "Unit",
      cell: (item: any) => item.unit?.name || ""
    },
    { 
      header: "Display Order",
      cell: (item: any) => (
        <Input 
          type="number" 
          defaultValue={item.displayOrder} 
          className="w-20 h-8"
          onBlur={(e) => {
            if (e.target.value !== String(item.displayOrder)) {
              updateDisplayOrder(item.id, e.target.value)
            }
          }}
        />
      )
    },
    { 
      header: "Status",
      cell: (item: any) => item.isActive ? <span className="text-green-600">Active</span> : <span className="text-red-600">Inactive</span>
    },
  ]

  const buildQueryString = () => {
    const params = new URLSearchParams()
    Object.entries(pdfConfig).forEach(([key, value]) => {
      params.append(key, String(value))
    })
    return params.toString()
  }

  const handleDownload = () => {
    const token = localStorage.getItem('adminToken')
    if (!token) return toast.error("Not authenticated")
    
    const qs = buildQueryString()
    const url = `http://localhost:3333/api/business-core/price-list/pdf?${qs}`
    
    // We fetch it securely then trigger download to pass auth headers
    toast.loading("Generating PDF...", { id: "pdf-gen" })
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `price-list-${new Date().getTime()}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      toast.success("PDF generated!", { id: "pdf-gen" })
    })
    .catch(err => {
      toast.error("Failed to generate PDF", { id: "pdf-gen" })
    })
  }

  const handlePreview = () => {
    const token = localStorage.getItem('adminToken')
    if (!token) return toast.error("Not authenticated")
    
    const qs = buildQueryString()
    const url = `http://localhost:3333/api/business-core/price-list/pdf?${qs}`
    
    toast.loading("Generating preview...", { id: "pdf-prev" })
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
      toast.success("Preview opened!", { id: "pdf-prev" })
    })
    .catch(err => {
      toast.error("Failed to generate preview", { id: "pdf-prev" })
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Service Price List</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-xl border">
            <h2 className="text-lg font-semibold mb-4">Available Services</h2>
            <DataTable columns={columns} data={services} />
            <p className="text-xs text-muted-foreground mt-2">
              * Note: Change the Display Order to adjust how services appear on the PDF. 
              Services are grouped by category first, then sorted by display order.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border">
            <h2 className="text-lg font-semibold mb-4">PDF Settings</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input 
                  value={pdfConfig.title} 
                  onChange={(e) => setPdfConfig({...pdfConfig, title: e.target.value})} 
                />
              </div>

              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input 
                  value={pdfConfig.subtitle} 
                  onChange={(e) => setPdfConfig({...pdfConfig, subtitle: e.target.value})} 
                />
              </div>

              <div className="space-y-2">
                <Label>Currency Symbol</Label>
                <Input 
                  value={pdfConfig.currency} 
                  onChange={(e) => setPdfConfig({...pdfConfig, currency: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Page Size</Label>
                  <select 
                    value={pdfConfig.pageSize} 
                    onChange={(e) => setPdfConfig({...pdfConfig, pageSize: e.target.value})}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="A4">A4</option>
                    <option value="A3">A3</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Orientation</Label>
                  <select 
                    value={pdfConfig.orientation} 
                    onChange={(e) => setPdfConfig({...pdfConfig, orientation: e.target.value})}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="Portrait">Portrait</option>
                    <option value="Landscape">Landscape</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    id="cat" 
                    checked={pdfConfig.showCategory}
                    onChange={(e) => setPdfConfig({...pdfConfig, showCategory: e.target.checked})}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <Label htmlFor="cat">Show Category Headings</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    id="desc" 
                    checked={pdfConfig.showDescriptions}
                    onChange={(e) => setPdfConfig({...pdfConfig, showDescriptions: e.target.checked})}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <Label htmlFor="desc">Show Service Descriptions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    id="units" 
                    checked={pdfConfig.showUnits}
                    onChange={(e) => setPdfConfig({...pdfConfig, showUnits: e.target.checked})}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <Label htmlFor="units">Show Units (e.g. / Page)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    id="phone" 
                    checked={pdfConfig.showPhoneAddress}
                    onChange={(e) => setPdfConfig({...pdfConfig, showPhoneAddress: e.target.checked})}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <Label htmlFor="phone">Show Shop Phone & Address</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    id="inactive" 
                    checked={pdfConfig.includeInactive}
                    onChange={(e) => setPdfConfig({...pdfConfig, includeInactive: e.target.checked})}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <Label htmlFor="inactive">Include Inactive Services</Label>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col space-y-3">
              <Button onClick={handlePreview} variant="outline" className="w-full justify-center">
                <Printer className="mr-2 h-4 w-4" /> Preview PDF
              </Button>
              <Button onClick={handleDownload} className="w-full justify-center">
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
