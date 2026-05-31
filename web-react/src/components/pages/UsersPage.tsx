import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api';
import { useLang } from '../../LangContext';

interface User {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
}

interface Role {
  name: string;
  user_count: number;
}

export default function UsersPage() {
  const { RL, roleName, TL } = useLang();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', role: 'maid', password: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([api.get<User[]>('/users'), api.get<Role[]>('/settings/roles')]);
      setUsers(u);
      setRoles(r);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditUser(null); setForm({ first_name: '', last_name: '', email: '', phone: '', role: 'maid', password: '' }); setShowModal(true); };
  const openEdit = (u: User) => { setEditUser(u); setForm({ first_name: u.first_name, last_name: u.last_name, email: u.email, phone: u.phone, role: u.role, password: '' }); setShowModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editUser) {
        await api.put('/users', { id: editUser.id, ...form });
      } else {
        await api.post('/users', form);
      }
      setShowModal(false);
      load();
    } catch (e: any) { alert(e.message); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try { await api.delete('/users?id=' + encodeURIComponent(deleteConfirm)); setDeleteConfirm(null); load(); } catch (e: any) { alert(e.message); }
  };

  if (loading) return <div className="text-center py-8 text-gray-400">{RL('loading')}</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{TL('users')}</h2>
        <button onClick={openAdd} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ {RL('add')}</button>
      </div>
      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-2 text-left">{RL('name')}</th>
              <th className="px-4 py-2 text-left">{RL('role')}</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">{RL('phone')}</th>
              <th className="px-4 py-2 text-left">{RL('status')}</th>
              <th className="px-4 py-2 text-right">{RL('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{u.last_name} {u.first_name}</td>
                <td className="px-4 py-2"><span className="text-xs px-2 py-0.5 rounded bg-gray-100">{roleName(u.role)}</span></td>
                <td className="px-4 py-2">{u.email || '—'}</td>
                <td className="px-4 py-2">{u.phone || '—'}</td>
                <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>{u.status === 'active' ? RL('active') : RL('inactive')}</span></td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => openEdit(u)} className="text-blue-600 text-xs mr-2">{RL('edit')}</button>
                  <button onClick={() => setDeleteConfirm(u.id)} className="text-red-600 text-xs">{RL('delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{editUser ? RL('edit') + ' ' + RL('user') : RL('add') + ' ' + RL('user')}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-gray-600 mb-1">{RL('firstName')}</label><input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} required className="w-full border rounded px-3 py-2" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{RL('lastName')}</label><input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} required className="w-full border rounded px-3 py-2" /></div>
              </div>
              <div><label className="block text-sm text-gray-600 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-gray-600 mb-1">{RL('phone')}</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{RL('role')}</label>
                  <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full border rounded px-3 py-2">
                    {roles.map(r => <option key={r.name} value={r.name}>{roleName(r.name)}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="block text-sm text-gray-600 mb-1">{RL('password')} ({RL('optional')})</label><input value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700">{RL('save')}</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 rounded-lg py-2 hover:bg-gray-300">{RL('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 text-center">
            <h3 className="text-lg font-bold mb-2">{RL('delete')}</h3>
            <p className="text-sm text-gray-600 mb-4">{RL('deleteConfirm')}</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-gray-200 rounded-lg py-2 hover:bg-gray-300">{RL('cancel')}</button>
              <button onClick={handleDelete} className="flex-1 bg-red-600 text-white rounded-lg py-2 hover:bg-red-700">{RL('delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
