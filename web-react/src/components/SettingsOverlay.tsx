import React, { useState, useEffect, useCallback, useContext } from 'react';
import { api } from '../api';
import { useLang } from '../LangContext';

interface TabVisibility {
  role: string;
  tab_key: string;
  visible: boolean;
}

export default function SettingsOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { RL, TL, roleName } = useLang();
  const [tabs, setTabs] = useState<TabVisibility[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const allTabs = ['chessboard', 'tasks', 'guests', 'finance', 'medical', 'sos'];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, r] = await Promise.all([api.get<TabVisibility[]>('/settings/tabs'), api.get<{name:string}[]>('/settings/roles')]);
      setTabs(t);
      setRoles(r.map(x => x.name));
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { if (open) load(); }, [open, load]);

  const isVisible = (role: string, tab: string) => {
    const found = tabs.find(t => t.role === role && t.tab_key === tab);
    return found ? found.visible : true;
  };

  const toggle = async (role: string, tab: string) => {
    const current = isVisible(role, tab);
    try {
      await api.post('/settings/tabs', { role, tab_key: tab, visible: !current });
      setTabs(prev => prev.map(t => t.role === role && t.tab_key === tab ? { ...t, visible: !current } : t));
    } catch (e: any) { alert(e.message); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold">{RL('tabSettings')}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-500 mb-4">{RL('tabSettingsDesc')}</p>
          {loading ? <div className="text-center py-8 text-gray-400">{RL('loading')}</div> :
           error ? <div className="text-center py-8 text-red-500">{error}</div> :
           <div className="space-y-3">
             {roles.map(role => (
               <div key={role} className="bg-white rounded-lg border p-4">
                 <h3 className="font-medium mb-3">{roleName(role)}</h3>
                 <div className="space-y-2">
                   {allTabs.map(tab => (
                     <label key={tab} className="flex items-center justify-between text-sm">
                       <span>{TL(tab) || tab}</span>
                       <input type="checkbox" checked={isVisible(role, tab)} onChange={() => toggle(role, tab)} className="w-4 h-4" />
                     </label>
                   ))}
                 </div>
               </div>
             ))}
           </div>}
        </div>
      </div>
    </div>
  );
}
