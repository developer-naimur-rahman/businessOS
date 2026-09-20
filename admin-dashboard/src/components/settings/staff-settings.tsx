import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api-client';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';
import { Modal } from '../ui/modal';

export function StaffSettings() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', roleIds: [] as string[]
  });

  const [roleFormData, setRoleFormData] = useState({
    name: '', description: '', permissions: [] as string[]
  });

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [uRes, rRes] = await Promise.all([
        api.get('/iam/users'),
        api.get('/iam/roles')
      ]);
      setUsers(uRes.data);
      setRoles(rRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/iam/users', formData);
      setIsUserModalOpen(false);
      fetchAll();
    } catch (err) {
      alert("Error creating user");
    }
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/iam/roles', roleFormData);
      setIsRoleModalOpen(false);
      fetchAll();
    } catch (err) {
      alert("Error creating role");
    }
  };

  const deleteUser = async (id: string) => {
    if(confirm("Are you sure?")) {
      await api.delete(`/iam/users/${id}`);
      fetchAll();
    }
  }

  const deleteRole = async (id: string) => {
    if(confirm("Are you sure?")) {
      await api.delete(`/iam/roles/${id}`);
      fetchAll();
    }
  }

  const availablePermissions = [
    'iam.users.view', 'iam.users.create', 'iam.users.update', 'iam.users.delete',
    'iam.roles.view', 'iam.roles.create', 'iam.roles.delete',
    'sales.view', 'sales.create', 'inventory.view', 'inventory.update',
    'products.view', 'products.create', 'products.update', 'products.delete'
  ];

  const togglePermission = (p: string) => {
    setRoleFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(p) 
        ? prev.permissions.filter(x => x !== p)
        : [...prev.permissions, p]
    }));
  };

  return (
    <div className="p-8 md:p-12 space-y-10 animate-in fade-in">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Staff Members</h3>
          <p className="text-sm text-slate-500">Manage user access and accounts.</p>
        </div>
        <button onClick={() => setIsUserModalOpen(true)} className="control-button-primary h-9 px-4 text-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Staff
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden mb-12">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-500">Name</th>
              <th className="px-4 py-3 font-medium text-slate-500">Email</th>
              <th className="px-4 py-3 font-medium text-slate-500">Roles</th>
              <th className="px-4 py-3 font-medium text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {u.userRoles?.map((ur: any) => (
                      <span key={ur.roleId} className="px-2 py-0.5 bg-slate-200 rounded text-xs">{ur.role?.name}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => deleteUser(u.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-end mb-6 pt-8 border-t border-slate-100">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Roles & Permissions</h3>
          <p className="text-sm text-slate-500">Define access levels for your staff.</p>
        </div>
        <button onClick={() => setIsRoleModalOpen(true)} className="control-button-secondary h-9 px-4 text-sm">
          <Shield className="w-4 h-4 mr-2" /> Create Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map(r => (
          <div key={r.id} className="border border-slate-200 rounded-xl p-4 relative">
            <h4 className="font-semibold">{r.name}</h4>
            <p className="text-xs text-slate-500 mb-2">{r.description}</p>
            <div className="flex gap-1 flex-wrap mt-2">
              {r.permissions?.slice(0, 4).map((p: any) => (
                <span key={p.permissionId} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-xs">{p.permission.action}</span>
              ))}
              {r.permissions?.length > 4 && <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">+{r.permissions.length - 4} more</span>}
            </div>
            <button onClick={() => deleteRole(r.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Add Staff">
        <form onSubmit={handleUserSubmit} className="space-y-4 py-4">
          <div>
            <label className="text-xs font-semibold uppercase text-slate-600">Name</label>
            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="control-input w-full h-10" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-600">Email</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="control-input w-full h-10" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-600">Password</label>
            <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="control-input w-full h-10" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-600">Roles</label>
            <select multiple className="control-input w-full h-24 p-2" onChange={e => {
              const opts = Array.from(e.target.selectedOptions, o => o.value);
              setFormData({...formData, roleIds: opts});
            }}>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <p className="text-xs text-slate-400 mt-1">Hold CTRL/CMD to select multiple.</p>
          </div>
          <button className="control-button-primary w-full h-10 mt-4">Create User</button>
        </form>
      </Modal>

      <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title="Create Role">
        <form onSubmit={handleRoleSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-xs font-semibold uppercase text-slate-600">Role Name</label>
            <input required value={roleFormData.name} onChange={e => setRoleFormData({...roleFormData, name: e.target.value})} className="control-input w-full h-10" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-600">Description</label>
            <input value={roleFormData.description} onChange={e => setRoleFormData({...roleFormData, description: e.target.value})} className="control-input w-full h-10" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-600 mb-2 block">Permissions</label>
            <div className="grid grid-cols-2 gap-2">
              {availablePermissions.map(p => (
                <label key={p} className="flex items-center gap-2 text-sm bg-slate-50 p-2 rounded border border-slate-100 cursor-pointer hover:bg-slate-100">
                  <input type="checkbox" checked={roleFormData.permissions.includes(p)} onChange={() => togglePermission(p)} className="rounded text-emerald-600" />
                  {p}
                </label>
              ))}
            </div>
          </div>
          <button className="control-button-primary w-full h-10 mt-4 sticky bottom-0">Create Role</button>
        </form>
      </Modal>
    </div>
  );
}
