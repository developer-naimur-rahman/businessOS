"use client"
import React, { useEffect, useState } from "react"
import { api } from "../../../lib/api-client"
import { PageHeader } from "../../../components/layout/page-header"
import { DataTable } from "../../../components/ui/data-table"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function DesignStudioLibrary() {
  const [designs, setDesigns] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchDesigns()
  }, [])

  const fetchDesigns = async () => {
    try {
      setLoading(true)
      const res = await api.get('/design-studio/designs')
      setDesigns(res.data)
    } catch (err) {
      toast.error("Failed to load designs")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    router.push('/admin/design-studio/new')
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this design?")) return
    try {
      await api.delete(`/design-studio/designs/${id}`)
      toast.success("Deleted successfully")
      fetchDesigns()
    } catch (err) {
      toast.error("Failed to delete")
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      await api.post(`/design-studio/designs/${id}/duplicate`, {})
      toast.success("Duplicated successfully")
      fetchDesigns()
    } catch (err) {
      toast.error("Failed to duplicate")
    }
  }

  const columns = [
    { header: "Name", accessorKey: "name" },
    { header: "Type", accessorKey: "type" },
    { header: "Template", accessorKey: "template" },
    { 
      header: "Size", 
      cell: (item: any) => `${item.width} x ${item.height} ${item.unit}` 
    },
    {
      header: "Actions",
      cell: (item: any) => (
        <div className="flex items-center space-x-3">
          <button onClick={() => router.push(`/admin/design-studio/${item.id}`)} className="text-blue-600 hover:underline">Edit</button>
          <button onClick={() => handleDuplicate(item.id)} className="text-slate-600 hover:underline">Duplicate</button>
          <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline">Delete</button>
          <a href={`http://localhost:3333/api/design-studio/designs/${item.id}/pdf`} target="_blank" className="text-primary hover:underline font-medium">Download PDF</a>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <PageHeader title="Design Studio" description="Create and manage printable banners and signage." />
        <button onClick={handleCreate} className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium">Create New Design</button>
      </div>

      <DataTable 
        data={designs}
        columns={columns}
        isLoading={loading}
        emptyMessage="No designs found. Create your first banner!"
      />
    </div>
  )
}
