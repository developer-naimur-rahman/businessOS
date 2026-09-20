"use client"
import React, { useState } from "react"
import { Building2, Store, Palette, Shield, CreditCard, Bell, UploadCloud } from "lucide-react"
import { StaffSettings } from "../../../components/settings/staff-settings"

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general')

  const tabs = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'staff', label: 'Staff & Roles', icon: Shield },
    { id: 'storefront', label: 'Storefront', icon: Store },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-[1200px] mx-auto">
      
      {/* Workspace Header */}
      <div className="pb-6 border-b border-slate-200/80">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-1">Settings</h1>
        <p className="text-slate-500">Manage your organization preferences and platform configurations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-12 items-start">
        
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center px-4 h-11 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <tab.icon className={`w-4 h-4 mr-3 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="p-8 md:p-12 space-y-10 animate-in fade-in">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-6">Organization Profile</h3>
                <div className="space-y-6 max-w-2xl">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center shrink-0">
                      <span className="text-2xl font-semibold text-slate-400">MB</span>
                    </div>
                    <div>
                      <button className="control-button-secondary h-9 px-4 mb-2 flex items-center text-sm">
                        <UploadCloud className="w-4 h-4 mr-2" /> Upload Logo
                      </button>
                      <p className="text-xs text-slate-500">Recommended size: 256x256px</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Business Name</label>
                      <input type="text" defaultValue="My Business OS" className="control-input h-11 w-full" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Contact Email</label>
                      <input type="email" defaultValue="admin@example.com" className="control-input h-11 w-full" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Business Address</label>
                      <input type="text" defaultValue="123 Commerce St, Suite 100" className="control-input h-11 w-full" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <h3 className="text-xl font-semibold text-slate-900 mb-6">Localization</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Currency</label>
                    <select className="control-input h-11 w-full appearance-none bg-white">
                      <option value="BDT">BDT (৳)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Timezone</label>
                    <select className="control-input h-11 w-full appearance-none bg-white">
                      <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 flex justify-end">
                <button className="control-button-primary h-11 px-8 rounded-full shadow-sm">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'staff' && <StaffSettings />}

          {/* Placeholder for other tabs */}
          {activeTab !== 'general' && activeTab !== 'staff' && (
            <div className="p-20 text-center flex flex-col items-center justify-center animate-in fade-in">
              <Building2 className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Configuration Area</h3>
              <p className="text-slate-500">Settings for {activeTab} will appear here.</p>
            </div>
          )}

        </div>
      </div>
      
    </div>
  )
}
