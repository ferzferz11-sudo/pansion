import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import { useLang } from '../../LangContext';
import type { Room } from '../../types';

const STATUS_CYCLE: Array<'free' | 'occupied' | 'cleaning' | 'repair'> = [
  'free',
  'occupied',
  'cleaning',
  'repair',
];

const STATUS_COLORS: Record<string, string> = {
  free: 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200',
  occupied: 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200',
  cleaning: 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200',
  repair: 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200',
};

interface ChessboardData {
  rooms: Room[];
  floors: number[];
}

export default function ChessboardPage() {
  const { RL } = useLang();
  const [data, setData] = useState<ChessboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChessboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.get<ChessboardData>('/rooms/chessboard');
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chessboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChessboard();
  }, [loadChessboard]);

  const handleRoomClick = useCallback(
    async (room: Room) => {
      const currentIndex = STATUS_CYCLE.indexOf(room.status as typeof STATUS_CYCLE[number]);
      const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];

      // Optimistic update
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          rooms: prev.rooms.map((r) =>
            r.id === room.id ? { ...r, status: nextStatus } : r
          ),
        };
      });

      try {
        await api.patch<{ room: Room }>(`/rooms/${room.id}`, { status: nextStatus });
      } catch {
        // Revert on failure
        loadChessboard();
      }
    },
    [loadChessboard]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{RL('loading')}...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!data || !data.rooms.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">No rooms found</div>
      </div>
    );
  }

  const roomsByFloor = data.floors.map((floor) => ({
    floor,
    rooms: data.rooms.filter((r) => r.floor === floor).sort((a, b) => a.number.localeCompare(b.number)),
  }));

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-lg font-semibold">{RL('room')} Chessboard</h2>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded border bg-green-100 border-green-300" />
          <span>{RL('free')}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded border bg-red-100 border-red-300" />
          <span>{RL('occupied')}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded border bg-yellow-100 border-yellow-300" />
          <span>{RL('cleaning')}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded border bg-blue-100 border-blue-300" />
          <span>{RL('repair')}</span>
        </div>
      </div>

      {/* Floors */}
      {roomsByFloor.map(({ floor, rooms }) => (
        <div key={floor}>
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            {RL('floor')} {floor}
          </h3>
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => handleRoomClick(room)}
                className={`
                  rounded-lg border-2 p-3 text-center transition-colors cursor-pointer
                  ${STATUS_COLORS[room.status] || 'bg-gray-100 border-gray-300 text-gray-800'}
                `}
                title={`${RL('room')} ${room.number} - ${RL(room.status)}`}
              >
                <div className="font-bold text-lg">{room.number}</div>
                <div className="text-xs opacity-75 mt-1">{RL(room.status)}</div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
