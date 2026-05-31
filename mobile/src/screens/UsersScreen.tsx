import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, RefreshControl } from 'react-native';
import api from '../api';
import { useAuth } from '../AuthContext';
import { type User, ROLE_NAMES } from '../types';
import { colors, commonStyles } from '../styles';
import { LoadingSpinner, ErrorView, EmptyView } from '../components/common';

function UserCard({ user }: { user: User }) {
  return (
    <View style={[commonStyles.card, { marginBottom: 10 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.gray800 }}>
            {user.first_name} {user.last_name}
          </Text>
          <Text style={{ fontSize: 13, color: colors.gray500, marginTop: 2 }}>{user.email}</Text>
          {user.phone ? (
            <Text style={{ fontSize: 13, color: colors.gray500 }}>{user.phone}</Text>
          ) : null}
        </View>
        <View style={{
          backgroundColor: user.status === 'active' ? colors.successLight : colors.gray200,
          paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
        }}>
          <Text style={{
            fontSize: 11, fontWeight: '600',
            color: user.status === 'active' ? colors.success : colors.gray500,
          }}>
            {ROLE_NAMES[user.role] || user.role}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function UsersScreen() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<User[]>('/users', token);
      setUsers(data);
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return (
    <View style={commonStyles.container}>
      {loading && users.length === 0 ? (
        <LoadingSpinner />
      ) : error && users.length === 0 ? (
        <ErrorView message={error} onRetry={fetchUsers} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchUsers} />}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.gray800, marginBottom: 4 }}>
            Сотрудники
          </Text>
          <Text style={{ fontSize: 13, color: colors.gray500, marginBottom: 16 }}>
            {users.length} записей
          </Text>
          {users.length === 0 ? (
            <EmptyView text="Нет сотрудников" />
          ) : (
            users.map(u => <UserCard key={u.id} user={u} />)
          )}
        </ScrollView>
      )}
    </View>
  );
}
