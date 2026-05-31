import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useLang } from '../LangContext';

interface RoleEntry {
  name: string;
  user_count: number;
}

interface RolesOverlayProps {
  open: boolean;
  onClose: () => void;
}

export default function RolesOverlay({ open, onClose }: RolesOverlayProps) {
  const { RL, roleName } = useLang();
  const [roles, setRoles] = useState<RoleEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<RoleEntry[]>('/settings/roles');
      setRoles(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : RL('error');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [RL]);

  const createRole = useCallback(async () => {
    const trimmed = newRoleName.trim();
    if (!trimmed) return;
    setCreating(true);
    setError(null);
    try {
      await api.post('/settings/roles', { name: trimmed });
      setNewRoleName('');
      await fetchRoles();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : RL('error');
      setError(message);
    } finally {
      setCreating(false);
    }
  }, [newRoleName, fetchRoles, RL]);

  const deleteRole = useCallback(
    async (name: string) => {
      setError(null);
      try {
        await api.delete(`/settings/roles?name=${encodeURIComponent(name)}`);
        setConfirmDelete(null);
        await fetchRoles();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : RL('error');
        setError(message);
      }
    },
    [fetchRoles, RL],
  );

  useEffect(() => {
    if (open) {
      fetchRoles();
    }
  }, [open, fetchRoles]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">
            {RL('settings')} — {RL('roles')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
            aria-label={RL('cancel')}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Create new role */}
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') createRole();
              }}
              placeholder={RL('newRoleName') + '…'}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={createRole}
              disabled={creating || !newRoleName.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {RL('create')}
            </button>
          </div>

          {/* Role list */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">{RL('loading')}</div>
          ) : roles.length === 0 ? (
            <div className="text-center py-8 text-gray-400">{RL('noData')}</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {roles.map((role) => (
                <li
                  key={role.name}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase">
                      {roleName(role.name).charAt(0)}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {roleName(role.name)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {role.user_count} {RL('users')}
                      </p>
                    </div>
                  </div>

                  {confirmDelete === role.name ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600">
                        {RL('confirm')}?
                      </span>
                      <button
                        onClick={() => deleteRole(role.name)}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        {RL('yes')}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                      >
                        {RL('no')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(role.name)}
                      className="px-3 py-1 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      {RL('delete')}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {RL('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
