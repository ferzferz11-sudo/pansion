import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import api from '../api';
import { useAuth } from '../AuthContext';
import { type SosAlert } from '../types';
import { colors, commonStyles } from '../styles';
import { LoadingSpinner, ErrorView, EmptyView } from '../components/common';

function SosCard({ alert, token, onRefresh }: { alert: SosAlert; token: string; onRefresh: () => void }) {
  const handleResolve = async () => {
    try {
      await api.put(`/sos/${alert.id}/resolve`, {}, token);
      onRefresh();
    } catch (err: any) {
      Alert.alert('Ошибка', err?.message || 'Не удалось обновить');
    }
  };

  return (
    <View style={[commonStyles.card, {
      marginBottom: 10,
      borderLeftWidth: 4,
      borderLeftColor: alert.status === 'active' ? colors.danger : colors.gray300,
      backgroundColor: alert.status === 'active' ? colors.dangerLight : colors.card,
    }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.gray800 }}>
            SOS — {alert.room_id || 'Номер неизвестен'}
          </Text>
          {alert.message ? (
            <Text style={{ fontSize: 14, color: colors.gray600, marginTop: 4 }}>{alert.message}</Text>
          ) : null}
          <Text style={{ fontSize: 12, color: colors.gray500, marginTop: 4 }}>
            {new Date(alert.created_at).toLocaleString('ru-RU')}
          </Text>
        </View>
        {alert.status === 'active' ? (
          <TouchableOpacity
            onPress={handleResolve}
            style={{ backgroundColor: colors.success, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}
          >
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>Решено</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ backgroundColor: colors.gray200, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
            <Text style={{ fontSize: 11, color: colors.gray500 }}>Решено</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function SosScreen() {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<SosAlert[]>('/sos', token);
      setAlerts(data);
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const active = alerts.filter(a => a.status === 'active').length;

  return (
    <View style={commonStyles.container}>
      {active > 0 && (
        <View style={{
          backgroundColor: colors.dangerLight,
          borderLeftWidth: 4, borderLeftColor: colors.danger,
          padding: 12, margin: 16, borderRadius: 8,
        }}>
          <Text style={{ fontWeight: '600', color: colors.danger }}>
            ⚠️ Активных SOS: {active}
          </Text>
        </View>
      )}

      {loading && alerts.length === 0 ? (
        <LoadingSpinner />
      ) : error && alerts.length === 0 ? (
        <ErrorView message={error} onRetry={fetchAlerts} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAlerts} />}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.gray800, marginBottom: 12 }}>
            SOS Сигналы ({alerts.length})
          </Text>
          {alerts.length === 0 ? (
            <EmptyView text="Нет SOS сигналов" />
          ) : (
            alerts.map(a => <SosCard key={a.id} alert={a} token={token!} onRefresh={fetchAlerts} />)
          )}
        </ScrollView>
      )}
    </View>
  );
}
