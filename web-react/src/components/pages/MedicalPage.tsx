import React, { useState, useEffect, useCallback } from 'react';
import { useLang } from '../../LangContext';
import api from '../../api';

// Extended prescription joined with guest name from the API
interface PrescriptionRow {
  id: number;
  guest_id: number;
  guest_name: string;
  doctor_id: number;
  medication: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date: string;
  notes: string;
}

// Today's medication log row as returned by GET /medical/logs
interface MedLogEntry {
  id: number;
  prescription_id: number;
  guest_id: number;
  guest_name: string;
  medication: string;
  dosage: string;
  scheduled_time: string;
  status: 'taken' | 'pending';
  nurse_name: string;
}

export default function MedicalPage() {
  const { RL, TL } = useLang();

  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([]);
  const [logs, setLogs] = useState<MedLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prescriptionsData, logsData] = await Promise.all([
        api.get<PrescriptionRow[]>('/medical/prescriptions'),
        api.get<MedLogEntry[]>('/medical/logs'),
      ]);
      setPrescriptions(prescriptionsData);
      setLogs(logsData);
    } catch (err) {
      setError(RL('error'));
      console.error('Failed to fetch medical data:', err);
    } finally {
      setLoading(false);
    }
  }, [RL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleLogStatus = async (logId: number) => {
    setTogglingId(logId);
    try {
      const updated = await api.post<MedLogEntry>('/medical/logs/toggle', {
        log_id: logId,
      });
      setLogs((prev) =>
        prev.map((l) => (l.id === logId ? { ...l, ...updated } : l)),
      );
    } catch (err) {
      console.error('Failed to toggle log status:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr: string): string => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div className="page loading">{RL('loading')}</div>;
  }

  if (error) {
    return (
      <div className="page error">
        <p>{error}</p>
        <button onClick={fetchData} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          {RL('submit')}
        </button>
      </div>
    );
  }

  return (
    <div className="page medical-page">
      <h1 className="text-2xl font-bold mb-6">{TL('medical')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Prescriptions Section ─── */}
        <section className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold">
              {RL('prescriptions')}
            </h2>
          </div>

          {prescriptions.length === 0 ? (
            <p className="p-4 text-gray-500">{RL('noData')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-600">
                    <th className="px-4 py-2 font-medium">{RL('guests')}</th>
                    <th className="px-4 py-2 font-medium">{RL('medication')}</th>
                    <th className="px-4 py-2 font-medium">{RL('dosage')}</th>
                    <th className="px-4 py-2 font-medium">{RL('frequency')}</th>
                    <th className="px-4 py-2 font-medium">{RL('startDate')}</th>
                    <th className="px-4 py-2 font-medium">{RL('endDate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map((p) => (
                    <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap">{p.guest_name || '-'}</td>
                      <td className="px-4 py-2 font-medium whitespace-nowrap">{p.medication}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{p.dosage}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{p.frequency}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{formatDate(p.start_date)}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{formatDate(p.end_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ─── Today's Medication Log Section ─── */}
        <section className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold">
              {RL('todayLog')}
            </h2>
          </div>

          {logs.length === 0 ? (
            <p className="p-4 text-gray-500">{RL('noData')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-600">
                    <th className="px-4 py-2 font-medium">{RL('guests')}</th>
                    <th className="px-4 py-2 font-medium">{RL('medication')}</th>
                    <th className="px-4 py-2 font-medium">{RL('date')}</th>
                    <th className="px-4 py-2 font-medium">{RL('status')}</th>
                    <th className="px-4 py-2 font-medium">{RL('assignedTo')}</th>
                    <th className="px-4 py-2 font-medium">{RL('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap">{log.guest_name || '-'}</td>
                      <td className="px-4 py-2 font-medium whitespace-nowrap">{log.medication}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{formatTime(log.scheduled_time)}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span
                          className={
                            log.status === 'taken'
                              ? 'inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700'
                              : 'inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700'
                          }
                        >
                          {RL(log.status === 'taken' ? 'done' : 'pending')}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">{log.nurse_name || '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <button
                          className={
                            togglingId === log.id
                              ? 'px-3 py-1 rounded text-xs font-medium bg-gray-200 text-gray-500 cursor-not-allowed'
                              : log.status === 'taken'
                                ? 'px-3 py-1 rounded text-xs font-medium bg-yellow-500 text-white hover:bg-yellow-600'
                                : 'px-3 py-1 rounded text-xs font-medium bg-green-600 text-white hover:bg-green-700'
                          }
                          onClick={() => toggleLogStatus(log.id)}
                          disabled={togglingId === log.id}
                        >
                          {togglingId === log.id
                            ? RL('loading')
                            : log.status === 'taken'
                              ? RL('pending')
                              : RL('done')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
