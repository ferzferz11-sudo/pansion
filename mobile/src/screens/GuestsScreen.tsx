import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, RefreshControl } from 'react-native';
import api from '../api';
import { useAuth } from '../AuthContext';
import { type Guest } from '../types';
import { colors, commonStyles } from '../styles';
import { LoadingSpinner, ErrorView, EmptyView } from '../components/common';

const GUEST_STATUS: Record<string, { label: string; color: string }> = {
  queue: { label: 'Ожидает', color: colors.warning },
  active: { label: 'Проживает', color: colors.success },
  archived: { label: 'Архив', color: colors.gray400 },
};

function GuestCard({ guest }: { guest: Guest }) {
  const st = GUEST_STATUS[guest.status] || { label: guest.status, color: colors.gray400 };
  return (
    <View style={[commonStyles.card, { marginBottom: 10 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.gray800 }}>
            {guest.last_name} {guest.first_name}
          </Text>
          {guest.room_number ? (
            <Text style={{ fontSize: 13, color: colors.gray500, marginTop: 2 }}>Номер: {guest.room_number}</Text>
          ) : null}
          {guest.diet_type ? (
            <Text style={{ fontSize: 13, color: colors.gray500 }}>Диета: {guest.diet_type}</Text>
          ) : null}
        </View>
        <View style={{ backgroundColor: st.color + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: st.color }}>{st.label}</Text>
        </View>
      </View>
    </View>
  );
}

export default function GuestsScreen() {
  const { token } = useAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchGuests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<Guest[]>('/guests', token);
      setGuests(data);
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchGuests(); }, [fetchGuests]);

  return (
    <View style={commonStyles.container}>
      {loading && guests.length === 0 ? (
        <LoadingSpinner />
      ) : error && guests.length === 0 ? (
        <ErrorView message={error} onRetry={fetchGuests} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchGuests} />}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.gray800, marginBottom: 4 }}>
            Постояльцы
          </Text>
          <Text style={{ fontSize: 13, color: colors.gray500, marginBottom: 16 }}>
            {guests.length} записей
          </Text>
          {guests.length === 0 ? (
            <EmptyView text="Нет постояльцев" />
          ) : (
            guests.map(g => <GuestCard key={g.id} guest={g} />)
          )}
        </ScrollView>
      )}
    </View>
  );
}
