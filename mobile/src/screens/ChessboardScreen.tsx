import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import api from '../api';
import { useAuth } from '../AuthContext';
import { type Room, type RoomStatus } from '../types';
import { colors, commonStyles } from '../styles';
import { LoadingSpinner, ErrorView } from '../components/common';

const STATUS_COLORS: Record<string, string> = {
  vacant: colors.vacant,
  booked: colors.booked,
  occupied: colors.occupied,
  checking_out_today: colors.checking_out,
};

const STATUS_LABELS: Record<string, string> = {
  vacant: 'Свободен',
  booked: 'Бронь',
  occupied: 'Занят',
  checking_out_today: 'Выезд',
};

function RoomCard({ room, token, onRefresh }: { room: Room; token: string; onRefresh: () => void }) {
  const nextStatus: Record<string, RoomStatus> = {
    vacant: 'occupied',
    occupied: 'vacant',
    booked: 'occupied',
    checking_out_today: 'vacant',
  };

  const handleStatusChange = async () => {
    const ns = nextStatus[room.status];
    if (!ns) return;
    try {
      await api.put(`/rooms/${room.id}/status`, { status: ns }, token);
      onRefresh();
    } catch (err: any) {
      Alert.alert('Ошибка', err?.message || 'Не удалось обновить');
    }
  };

  return (
    <TouchableOpacity
      onPress={handleStatusChange}
      activeOpacity={0.7}
      style={[commonStyles.card, {
        borderLeftWidth: 4,
        borderLeftColor: STATUS_COLORS[room.status] || colors.gray300,
        marginBottom: 10,
      }]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.gray800 }}>№{room.number}</Text>
          <Text style={{ fontSize: 12, color: colors.gray500 }}>Этаж {room.floor}</Text>
        </View>
        <View style={{
          backgroundColor: (STATUS_COLORS[room.status] || colors.gray300) + '20',
          paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
        }}>
          <Text style={{
            fontSize: 12, fontWeight: '600',
            color: STATUS_COLORS[room.status] || colors.gray500,
          }}>
            {STATUS_LABELS[room.status] || room.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ChessboardScreen() {
  const { token } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<Room[]>('/rooms', token);
      setRooms(data.sort((a: Room, b: Room) => a.number.localeCompare(b.number)));
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const vacant = rooms.filter(r => r.status === 'vacant').length;
  const booked = rooms.filter(r => r.status === 'booked').length;
  const occupied = rooms.filter(r => r.status === 'occupied').length;
  const checkout = rooms.filter(r => r.status === 'checking_out_today').length;

  return (
    <View style={commonStyles.container}>
      {/* Summary bar */}
      <View style={{ flexDirection: 'row', padding: 16, gap: 8 }}>
        {[
          { label: 'Свободно', count: vacant, color: colors.vacant },
          { label: 'Бронь', count: booked, color: colors.booked },
          { label: 'Занято', count: occupied, color: colors.occupied },
          { label: 'Выезд', count: checkout, color: colors.checking_out },
        ].map((s, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: s.color }}>{s.count}</Text>
            <Text style={{ fontSize: 11, color: colors.gray500 }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {loading && rooms.length === 0 ? (
        <LoadingSpinner />
      ) : error && rooms.length === 0 ? (
        <ErrorView message={error} onRetry={fetchRooms} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRooms} />}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.gray800, marginBottom: 12 }}>
            Номера ({rooms.length})
          </Text>
          {rooms.map(room => (
            <RoomCard key={room.id} room={room} token={token!} onRefresh={fetchRooms} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
