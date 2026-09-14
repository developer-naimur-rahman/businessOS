"use client"
import React, { useState } from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Building2, Save, MapPin, Phone, Globe, Shield } from "lucide-react"

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
    }, 1000)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage organizational configurations and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Settings Navigation Sidebar */}
        <div className="md:col-span-1 space-y-2">
          <Button variant="ghost" className="w-full justify-start bg-white shadow-sm border border-slate-200 interaction-bounce text-primary font-medium">
            <Building2 className="w-4 h-4 mr-2" /> Organization
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-600 hover:bg-slate-100 hover:text-slate-900 interaction-bounce">
            <Shield className="w-4 h-4 mr-2" /> Security
          </Button>
        </div>

        {/* Settings Form Content */}
        <div className="md:col-span-3 space-y-6">
          <div className="solid-elevated rounded-2xl p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6 pb-4 border-b border-slate-100">Organization Profile</h2>
            
            <div className="space-y-6">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-700">Business Name</label>
                <Input defaultValue="My Business Shop" className="bg-slate-50" />
              </div>
              
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" /> Primary Address
                </label>
                <textarea 
                  className="flex w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                  defaultValue="123 Business Avenue, Tech District, Dhaka"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" /> Phone Number
                  </label>
                  <Input defaultValue="+880 1234-567890" className="bg-slate-50" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400" /> Website
                  </label>
                  <Input defaultValue="https://mybusiness.shop" className="bg-slate-50" />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-elevated p-6 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Unsaved Changes</h3>
              <p className="text-sm text-slate-500">You have modified the organization profile.</p>
            </div>
            <Button className="bg-primary text-white hover:bg-primary/90 shadow-sm interaction-bounce" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Settings</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
