import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import api from '../api';
import { useAuth } from '../AuthContext';
import { type MaidTask, type TaskStatus } from '../types';
import { colors, commonStyles } from '../styles';
import { LoadingSpinner, ErrorView, EmptyView } from '../components/common';

const TASK_STATUS: Record<TaskStatus, { label: string; color: string; next: TaskStatus }> = {
  pending: { label: 'Ожидает', color: colors.warning, next: 'in_progress' },
  in_progress: { label: 'В работе', color: colors.primary, next: 'completed' },
  completed: { label: 'Готово', color: colors.success, next: 'completed' },
};

const TASK_TYPES: Record<string, string> = {
  linen_change: 'Смена белья',
  wet_cleaning: 'Влажная уборка',
  watering_flowers: 'Полив цветов',
};

function TaskCard({ task, token, onRefresh }: { task: MaidTask; token: string; onRefresh: () => void }) {
  const st = TASK_STATUS[task.status] || { label: task.status, color: colors.gray400, next: 'completed' as TaskStatus };

  const handleToggle = async () => {
    if (task.status === 'completed') return;
    const ns = st.next;
    try {
      await api.put(`/maid/tasks/${task.id}`, { status: ns }, token);
      onRefresh();
    } catch (err: any) {
      Alert.alert('Ошибка', err?.message || 'Не удалось обновить');
    }
  };

  return (
    <TouchableOpacity
      onPress={handleToggle}
      activeOpacity={task.status === 'completed' ? 1 : 0.7}
      style={[commonStyles.card, { marginBottom: 10, opacity: task.status === 'completed' ? 0.6 : 1 }]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.gray800 }}>
            №{task.room_number} — {TASK_TYPES[task.task_type] || task.task_type}
          </Text>
          {task.created_at ? (
            <Text style={{ fontSize: 12, color: colors.gray500, marginTop: 2 }}>
              {new Date(task.created_at).toLocaleDateString('ru-RU')}
            </Text>
          ) : null}
        </View>
        <View style={{ backgroundColor: st.color + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: st.color }}>{st.label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function TasksScreen() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<MaidTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<MaidTask[]>('/maid/tasks', token);
      setTasks(data);
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const pending = tasks.filter(t => t.status === 'pending').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const completed = tasks.filter(t => t.status === 'completed').length;

  return (
    <View style={commonStyles.container}>
      <View style={{ flexDirection: 'row', padding: 16, gap: 8 }}>
        {[
          { label: 'Ожидает', count: pending, color: colors.warning },
          { label: 'В работе', count: inProgress, color: colors.primary },
          { label: 'Готово', count: completed, color: colors.success },
        ].map((s, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: s.color }}>{s.count}</Text>
            <Text style={{ fontSize: 11, color: colors.gray500 }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {loading && tasks.length === 0 ? (
        <LoadingSpinner />
      ) : error && tasks.length === 0 ? (
        <ErrorView message={error} onRetry={fetchTasks} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTasks} />}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.gray800, marginBottom: 12 }}>
            Задачи ({tasks.length})
          </Text>
          {tasks.length === 0 ? (
            <EmptyView text="Нет задач" />
          ) : (
            tasks.map(t => <TaskCard key={t.id} task={t} token={token!} onRefresh={fetchTasks} />)
          )}
        </ScrollView>
      )}
    </View>
  );
}
