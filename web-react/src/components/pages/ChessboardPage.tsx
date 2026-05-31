import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api';
import { useLang } from '../../LangContext';

interface Room {
  id: string;
  number: string;
  floor: number;
  status: string;
}

// Map API status -> internal status
function mapStatus(s: string): string {
  const m: Record<string, string> = {
    vacant: 'free',
    booked: 'booked',
    occupied: 'occupied',
    checking_out_today: 'checkout',
  };
  return m[s] || s;
}

const STATUS_CYCLE = ['free', 'booked', 'occupied', 'checkout'] as const;
const STATUS_COLORS: Record<string, string> = {
  free: 'bg-green-100 border-green-300 text-green-800',
  booked: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  occupied: 'bg-red-100 border-red-300 text-red-800',
  checkout: 'bg-blue-100 border-blue-300 text-blue-800',
};

export default function ChessboardPage() {
  const { RL } = useLang();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Room[]>('/rooms/chessboard');
      setRooms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleClick = useCallback(async (room: Room) => {
    const currentMapped = mapStatus(room.status);
    const idx = STATUS_CYCLE.indexOf(currentMapped as typeof STATUS_CYCLE[number]);
    const nextMapped = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    // Map back to API status
    const apiStatus: Record<string, string> = {
      free: 'vacant',
      booked: 'booked',
      occupied: 'occupied',
      checkout: 'checking_out_today',
    };
    const nextApiStatus = apiStatus[nextMapped] || nextMapped;

    // Optimistic update
    setRooms(prev => prev.map(r => r.id === room.id ? { ...r, status: nextApiStatus } : r));

    try {
      await api.put('/rooms/' + room.id + '/status', { status: nextApiStatus });
    } catch {
      load(); // revert on failure
    }
  }, [load]);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">{RL('loading')}...</div>;
  if (error) return <div className="flex items-center justify-center h-64 text-red-500">{error}</div>;
  if (!rooms.length) return <div className="flex items-center justify-center h-64 text-gray-400">No rooms</div>;

  // Group by floor
  const floors = [...new Set(rooms.map(r => r.floor))].sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">{RL('rooms')}</h2>

      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1"><span className="w-4 h-4 rounded border bg-green-100 border-green-300" /><span>{RL('vacant')}</span></div>
        <div className="flex items-center gap-1"><span className="w-4 h-4 rounded border bg-yellow-100 border-yellow-300" /><span>{RL('booked')}</span></div>
        <div className="flex items-center gap-1"><span className="w-4 h-4 rounded border bg-red-100 border-red-300" /><span>{RL('occupied')}</span></div>
        <div className="flex items-center gap-1"><span className="w-4 h-4 rounded border bg-blue-100 border-blue-300" /><span>{RL('checkout')}</span></div>
      </div>

      {floors.map(floor => (
        <div key={floor}>
          <h3 className="text-sm font-medium text-gray-600 mb-2">{RL('floor')} {floor}</h3>
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {rooms.filter(r => r.floor === floor).sort((a, b) => a.number.localeCompare(b.number)).map(room => {
              const mapped = mapStatus(room.status);
              return (
                <button key={room.id} onClick={() => handleClick(room)}
                  className={`rounded-lg border-2 p-2 text-center cursor-pointer hover:opacity-80 transition ${STATUS_COLORS[mapped] || 'bg-gray-100 border-gray-300'}`}>
                  <div className="font-bold text-lg">{room.number}</div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
