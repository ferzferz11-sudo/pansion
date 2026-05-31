import { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import { useLang } from '../../LangContext';

// ── Dashboard data types ───────────────────────────────────────────────────

interface DashboardStats {
  table: string;
  count: number;
}

interface RoomStatsItem {
  Status: string;
  Count: number;
}

interface FinanceSummary {
  income: number;
  expense: number;
  balance: number;
}

interface DashboardData {
  stats: DashboardStats[];
  room_stats: RoomStatsItem[];
  finance: FinanceSummary;
  sos_active: number;
}

function parseRoomStats(roomStats: RoomStatsItem[]): { vacant: number; booked: number; occupied: number; checkout: number } {
  const result = { vacant: 0, booked: 0, occupied: 0, checkout: 0 };
  for (const item of roomStats) {
    const key = item.Status as keyof typeof result;
    if (key in result) result[key] = item.Count;
  }
  return result;
}

function getStat(stats: DashboardStats[], table: string): number {
  const found = stats.find(s => s.table === table);
  return found ? found.count : 0;
}

// ── Stat card component ────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  accent?: string;
}

function StatCard({ label, value, accent = 'bg-blue-500' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div className={`${accent} w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0`}>
        {value}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 truncate">{label}</p>
      </div>
    </div>
  );
}

// ── Room status bar component ──────────────────────────────────────────────

interface RoomStatusSegmentProps {
  label: string;
  count: number;
  total: number;
  color: string;
}

function RoomStatusSegment({ label, count, total, color }: RoomStatusSegmentProps) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full shrink-0 ${color}`} />
      <span className="text-sm text-gray-600 w-24 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-800 w-8 text-right">{count}</span>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { RL } = useLang();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<DashboardData>('/dashboard');
      setData(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : RL('error');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [RL]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

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
          onClick={fetchDashboard}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const roomStatus = parseRoomStats(data.room_stats);
  const finance = data.finance;
  const totalRooms =
    roomStatus.vacant + roomStatus.booked + roomStatus.occupied + roomStatus.checkout;

  const roomsCount = getStat(data.stats, 'rooms');
  const guestsCount = getStat(data.stats, 'guests');
  const usersCount = getStat(data.stats, 'users');
  const tasksCount = getStat(data.stats, 'maid_tasks');
  const transactionsCount = getStat(data.stats, 'transactions');

  return (
    <div className="space-y-6">
      {/* SOS Active Warning Banner */}
      {data.sos_active && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 flex items-center gap-3 animate-pulse">
          <div className="bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold">!</span>
          </div>
          <div>
            <p className="font-semibold text-red-800">{RL('sos')} {RL('alert')}</p>
            <p className="text-sm text-red-600">{RL('sosDesc')}</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {RL('dashboard')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard label={RL('room') + 's'} value={roomsCount} accent="bg-blue-500" />
          <StatCard label={RL('guests')} value={guestsCount} accent="bg-green-500" />
          <StatCard label={RL('users')} value={usersCount} accent="bg-purple-500" />
          <StatCard label={RL('tasks')} value={tasksCount} accent="bg-amber-500" />
          <StatCard label={RL('transactions')} value={transactionsCount} accent="bg-teal-500" />
          <StatCard label={"SOS " + RL('active')} value={data.sos_active} accent={data.sos_active > 0 ? 'bg-red-500' : 'bg-gray-400'} />
        </div>
      </section>

      {/* Two-column: Room Status + Finance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Status Breakdown */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            {RL('roomStatus')}
          </h3>
          <div className="space-y-4">
            <RoomStatusSegment
              label={RL('free')}
              count={roomStatus.vacant}
              total={totalRooms}
              color="bg-green-500"
            />
            <RoomStatusSegment
              label={RL('booked')}
              count={roomStatus.booked}
              total={totalRooms}
              color="bg-blue-500"
            />
            <RoomStatusSegment
              label={RL('occupied')}
              count={roomStatus.occupied}
              total={totalRooms}
              color="bg-amber-500"
            />
            <RoomStatusSegment
              label={RL('checkout')}
              count={roomStatus.checkout}
              total={totalRooms}
              color="bg-red-400"
            />
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 text-sm text-gray-500">
            {RL('totalRooms')}: {totalRooms}
          </div>
        </section>

        {/* Finance Summary */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            {RL('financeSummary')}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center text-white">
                  ↑
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {RL('income')}
                </span>
              </div>
              <span className="text-lg font-bold text-green-700">
                +{finance.income.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center text-white">
                  ↓
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {RL('expense')}
                </span>
              </div>
              <span className="text-lg font-bold text-red-700">
                -{finance.expense.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <span className="text-sm font-semibold text-gray-700">
                {RL('balance')}
              </span>
              <span
                className={`text-xl font-bold ${
                  finance.balance >= 0 ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {finance.balance >= 0 ? '+' : ''}
                {finance.balance.toLocaleString()}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
