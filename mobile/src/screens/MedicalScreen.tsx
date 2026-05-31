import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import api from '../api';
import { useAuth } from '../AuthContext';
import { type Prescription, type MedLog } from '../types';
import { colors, commonStyles } from '../styles';
import { LoadingSpinner, ErrorView, EmptyView } from '../components/common';

function MedLogCard({ log, token, onRefresh }: { log: MedLog; token: string; onRefresh: () => void }) {
  const handleToggle = async () => {
    try {
      await api.post('/medical/logs/toggle', { log_id: log.id }, token);
      onRefresh();
    } catch (err: any) {
      Alert.alert('Ошибка', err?.message || 'Не удалось обновить');
    }
  };

  const isTaken = log.status === 'taken';

  return (
    <TouchableOpacity
      onPress={handleToggle}
      activeOpacity={0.7}
      style={[commonStyles.card, { marginBottom: 10, opacity: isTaken ? 0.6 : 1 }]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.gray800 }}>{log.medication_name}</Text>
          <Text style={{ fontSize: 13, color: colors.gray500, marginTop: 2 }}>{log.guest_name}</Text>
          {log.scheduled_time ? (
            <Text style={{ fontSize: 12, color: colors.gray400, marginTop: 2 }}>
              {new Date(log.scheduled_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          ) : null}
        </View>
        <View style={{
          backgroundColor: isTaken ? colors.successLight : colors.warningLight,
          paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
        }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: isTaken ? colors.success : colors.warning }}>
            {isTaken ? 'Принято' : 'Ожидает'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MedicalScreen() {
  const { token } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [todayLogs, setTodayLogs] = useState<MedLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'logs' | 'prescriptions'>('logs');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [p, l] = await Promise.all([
        api.get<Prescription[]>('/medical/prescriptions', token),
        api.get<MedLog[]>('/medical/logs', token),
      ]);
      setPrescriptions(p);
      setTodayLogs(l);
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <View style={commonStyles.container}>
      {/* Tabs */}
      <View style={{ flexDirection: 'row', padding: 16, gap: 8 }}>
        <TouchableOpacity
          onPress={() => setTab('logs')}
          style={{
            flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center',
            backgroundColor: tab === 'logs' ? colors.primary : colors.gray100,
          }}
        >
          <Text style={{ fontWeight: '600', color: tab === 'logs' ? 'white' : colors.gray600 }}>
            Журнал ({todayLogs.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab('prescriptions')}
          style={{
            flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center',
            backgroundColor: tab === 'prescriptions' ? colors.primary : colors.gray100,
          }}
        >
          <Text style={{ fontWeight: '600', color: tab === 'prescriptions' ? 'white' : colors.gray600 }}>
            Назначения ({prescriptions.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading && tab === 'logs' && todayLogs.length === 0 ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorView message={error} onRetry={fetchData} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
        >
          {tab === 'logs' ? (
            todayLogs.length === 0 ? (
              <EmptyView text="Нет записей на сегодня" />
            ) : (
              todayLogs.map(l => <MedLogCard key={l.id} log={l} token={token!} onRefresh={fetchData} />)
            )
          ) : (
            prescriptions.length === 0 ? (
              <EmptyView text="Нет назначений" />
            ) : (
              prescriptions.map(p => (
                <View key={p.id} style={[commonStyles.card, { marginBottom: 10 }]}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: colors.gray800 }}>{p.medication_name}</Text>
                  <Text style={{ fontSize: 13, color: colors.gray600, marginTop: 2 }}>{p.guest_name}</Text>
                  <Text style={{ fontSize: 12, color: colors.gray500, marginTop: 2 }}>{p.dosage}, {p.frequency}</Text>
                </View>
              ))
            )
          )}
        </ScrollView>
      )}
    </View>
  );
}
