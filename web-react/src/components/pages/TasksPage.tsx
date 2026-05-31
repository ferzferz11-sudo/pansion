import React, { useState, useEffect, useCallback } from 'react';
import { useLang } from '../../LangContext';
import { api } from '../../api';

interface MaidTask {
  id: string;
  room_number?: string;
  task_type?: 'linen_change' | 'wet_cleaning' | 'watering_flowers';
  status: string;
}

const TASK_TYPE_LABELS: Record<string, { ru: string; en: string }> = {
  linen_change: { ru: 'Смена белья', en: 'Linen Change' },
  wet_cleaning: { ru: 'Влажная уборка', en: 'Wet Cleaning' },
  watering_flowers: { ru: 'Полив цветов', en: 'Watering Flowers' },
};

export default function TasksPage() {
  const { RL, TL, lang } = useLang();
  const [tasks, setTasks] = useState<MaidTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [completingId, setCompletingId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<MaidTask[]>('/maid/tasks');
      setTasks(data);
    } catch (err) {
      setError(RL('error'));
    } finally {
      setLoading(false);
    }
  }, [RL]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const completeTask = async (taskId: string) => {
    setCompletingId(taskId);
    try {
      await api.post('/maid/tasks/complete', { task_id: taskId });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
    } catch (err) {
      console.error('Failed to complete task:', err);
    } finally {
      setCompletingId(null);
    }
  };

  const filteredTasks = activeFilter === 'all' ? tasks : tasks.filter(t => t.status === activeFilter);

  const tabs = [
    { key: 'all', label: RL('all') },
    { key: 'pending', label: RL('pending') },
    { key: 'in_progress', label: RL('inProgress') },
    { key: 'completed', label: RL('done') },
  ];

  const getTaskTypeLabel = (task: MaidTask): string => {
    if (task.task_type && TASK_TYPE_LABELS[task.task_type]) {
      return TASK_TYPE_LABELS[task.task_type][lang] || task.task_type;
    }
    return task.task_type || '';
  };

  if (loading) return <div className="text-center py-8 text-gray-400">{RL('loading')}</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{TL('tasks')}</h2>

      <div className="flex gap-2 border-b">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveFilter(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${activeFilter === tab.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <p className="text-center text-gray-400 py-8">{RL('noData')}</p>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map(task => (
            <div key={task.id} className="bg-white rounded-lg border p-3 flex items-center justify-between hover:shadow-sm transition">
              <div className="space-y-1">
                <div className="font-medium">{RL('room')} {task.room_number || task.id}</div>
                <div className="text-sm text-gray-600">{getTaskTypeLabel(task)}</div>
                <span className={`text-xs px-2 py-0.5 rounded ${task.status === 'completed' ? 'bg-green-100 text-green-700' : task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                  {task.status === 'completed' ? RL('done') : task.status === 'in_progress' ? RL('inProgress') : RL('pending')}
                </span>
              </div>
              {(task.status === 'pending' || task.status === 'in_progress') && (
                <button onClick={() => completeTask(task.id)}
                  disabled={completingId === task.id}
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
                  {completingId === task.id ? '...' : RL('done')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
