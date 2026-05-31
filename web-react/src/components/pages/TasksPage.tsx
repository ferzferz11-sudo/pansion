import React, { useState, useEffect, useCallback } from 'react';
import { useLang } from '../../LangContext';
import api from '../../api';
import type { Task, TaskStatus } from '../../types';

type FilterTab = 'all' | TaskStatus;

interface MaidTask extends Task {
  room_number?: string;
  task_type?: 'linen_change' | 'wet_cleaning' | 'watering_flowers';
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
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [completingId, setCompletingId] = useState<number | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<MaidTask[]>('/maid/tasks');
      setTasks(data);
    } catch (err) {
      setError(RL('error'));
      console.error('Failed to fetch maid tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [RL]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const completeTask = async (taskId: number) => {
    setCompletingId(taskId);
    try {
      await api.post('/maid/tasks/complete', { task_id: taskId });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'done' as TaskStatus } : t))
      );
    } catch (err) {
      console.error('Failed to complete task:', err);
    } finally {
      setCompletingId(null);
    }
  };

  const filteredTasks = activeFilter === 'all'
    ? tasks
    : tasks.filter((t) => t.status === activeFilter);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: RL('all') },
    { key: 'pending', label: RL('pending') },
    { key: 'in_progress', label: RL('inProgress') },
    { key: 'done', label: RL('done') },
  ];

  const getStatusLabel = (status: TaskStatus): string => {
    switch (status) {
      case 'pending':
        return RL('pending');
      case 'in_progress':
        return RL('inProgress');
      case 'done':
        return RL('done');
      case 'cancelled':
        return RL('cancelled');
      default:
        return status;
    }
  };

  const getStatusClass = (status: TaskStatus): string => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'in_progress':
        return 'status-in-progress';
      case 'done':
        return 'status-done';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const getTaskTypeDisplay = (task: MaidTask): string => {
    if (task.task_type && TASK_TYPE_LABELS[task.task_type]) {
      return TASK_TYPE_LABELS[task.task_type][lang];
    }
    return task.title || '';
  };

  if (loading) {
    return <div className="page loading">{RL('loading')}</div>;
  }

  if (error) {
    return (
      <div className="page error">
        <p>{error}</p>
        <button onClick={fetchTasks}>Retry</button>
      </div>
    );
  }

  return (
    <div className="page tasks-page">
      <h1>{TL('tasks')}</h1>

      <div className="filter-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`filter-tab ${activeFilter === tab.key ? 'active' : ''}`}
            onClick={() => setActiveFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <p className="no-data">{RL('noData')}</p>
      ) : (
        <div className="task-list">
          {filteredTasks.map((task) => (
            <div key={task.id} className="task-card">
              <div className="task-info">
                <div className="task-room">
                  <span className="label">{RL('room')}: </span>
                  <span className="value">{task.room_number || task.room_id || '-'}</span>
                </div>
                <div className="task-type">
                  <span className="label">{RL('type')}: </span>
                  <span className="value">{getTaskTypeDisplay(task)}</span>
                </div>
                <div className={`task-status ${getStatusClass(task.status)}`}>
                  <span className="label">{RL('status')}: </span>
                  <span className="value">{getStatusLabel(task.status)}</span>
                </div>
              </div>
              {(task.status === 'pending' || task.status === 'in_progress') && (
                <button
                  className="complete-btn"
                  onClick={() => completeTask(task.id)}
                  disabled={completingId === task.id}
                >
                  {completingId === task.id ? RL('loading') : RL('done')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
