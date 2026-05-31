import { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import { useLang } from '../../LangContext';

// ── Guest types ────────────────────────────────────────────────────────────

interface Guest {
  id: number;
  first_name: string;
  last_name: string;
  diet_type: string;
  room_number: string;
  status: 'queue' | 'active' | 'archived';
}

type GuestStatus = Guest['status'];

// ── Status badge component ─────────────────────────────────────────────────

function StatusBadge({ status, RL }: { status: GuestStatus; RL: (key: string) => string }) {
  const config: Record<GuestStatus, { bg: string; labelKey: string }> = {
    queue: { bg: 'bg-amber-100 text-amber-800', labelKey: 'queue' },
    active: { bg: 'bg-green-100 text-green-800', labelKey: 'active' },
    archived: { bg: 'bg-gray-100 text-gray-600', labelKey: 'archived' },
  };
  const { bg, labelKey } = config[status];
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${bg}`}>
      {RL(labelKey)}
    </span>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function GuestsPage() {
  const { RL } = useLang();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGuests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = api.get<Guest[]>('/guests');
      setGuests(await result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : RL('error');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [RL]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
        <span className="ml-3 text-gray-500">{RL('loading')}</span>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          {error}
        </div>
        <button
          onClick={fetchGuests}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────
  if (guests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">{RL('noData')}</p>
      </div>
    );
  }

  // ── Table ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          {RL('guests')}
        </h2>
        <span className="text-sm text-gray-500">
          {guests.length} {guests.length === 1 ? 'guest' : 'guests'}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {RL('name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {RL('dietType')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {RL('room')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {RL('status')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {guests.map((guest) => (
                <tr key={guest.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {guest.last_name} {guest.first_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {guest.diet_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {guest.room_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={guest.status} RL={RL} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
