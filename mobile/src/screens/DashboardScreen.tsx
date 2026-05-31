import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import api from '../api';
import { useAuth } from '../AuthContext';
import { type DashboardData, type FinanceCategory } from '../types';
import { colors, commonStyles } from '../styles';
import { LoadingSpinner, ErrorView, EmptyView } from '../components/common';

function getStat(stats: any[], table: string): number {
  const found = stats.find((s: any) => s.Table === table || s.table === table);
  return found ? (found.Count || found.count || 0) : 0;
}

function parseRoomStats(roomStats: any[]) {
  const result = { vacant: 0, booked: 0, occupied: 0, checkout: 0 };
  for (const item of roomStats || []) {
    const key = item.Status || item.status;
    const val = item.Count || item.count || 0;
    if (key === 'vacant') result.vacant = val;
    else if (key === 'booked') result.booked = val;
    else if (key === 'occupied') result.occupied = val;
    else if (key === 'checking_out_today') result.checkout = val;
  }
  return result;
}

export default function DashboardScreen({ navigation }: any) {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dash, cats] = await Promise.all([
        api.get<DashboardData>('/dashboard', token),
        api.get<FinanceCategory[]>('/finance/categories', token),
      ]);
      setData(dash);
      setCategories(cats);
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading && !data) return <LoadingSpinner text="Загрузка..." />;
  if (error && !data) return <ErrorView message={error} onRetry={fetchData} />;
  if (!data) return <EmptyView />;

  const rs = parseRoomStats(data.room_stats);
  const totalRooms = rs.vacant + rs.booked + rs.occupied + rs.checkout;

  const catLabels: Record<string, string> = {
    rent: 'Проживание', food: 'Питание', chemicals: 'Химия',
    salary: 'Зарплата', maintenance: 'Обслуживание', utilities: 'Коммунальные', other: 'Другое',
  };

  const catColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
    >
      <Text style={{ fontSize: 22, fontWeight: '700', color: colors.gray800, marginBottom: 16 }}>
        Панель управления
      </Text>

      {data.sos_active > 0 && (
        <View style={{
          backgroundColor: colors.dangerLight,
          borderLeftWidth: 4, borderLeftColor: colors.danger,
          borderRadius: 8, padding: 14, marginBottom: 16,
          flexDirection: 'row', alignItems: 'center', gap: 12,
        }}>
          <View style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '800' }}>!</Text>
          </View>
          <View>
            <Text style={{ fontWeight: '600', color: colors.danger }}>SOS Тревога</Text>
            <Text style={{ fontSize: 13, color: '#991b1b' }}>Активных сигналов: {data.sos_active}</Text>
          </View>
        </View>
      )}

      {/* Stats Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        {([
          { label: 'Номера', val: getStat(data.stats, 'rooms'), color: colors.primary, tab: 'chessboard' },
          { label: 'Постояльцы', val: getStat(data.stats, 'guests'), color: colors.success, tab: 'guests' },
          { label: 'Сотрудники', val: getStat(data.stats, 'users'), color: '#8b5cf6', tab: 'users' },
          { label: 'Задачи', val: getStat(data.stats, 'maid_tasks'), color: colors.warning, tab: 'tasks' },
          { label: 'Транзакции', val: getStat(data.stats, 'transactions'), color: '#06b6d4', tab: 'finance' },
          ...(data.sos_active > 0 ? [{ label: 'SOS', val: data.sos_active, color: colors.danger, tab: 'sos' }] : []),
        ] as {label: string; val: number; color: string; tab?: string}[]).map((item, i) => (
          <TouchableOpacity
            key={i}
            onPress={item.tab ? () => navigation.navigate(item.tab) : undefined}
            activeOpacity={0.7}
            style={[commonStyles.card, { flexDirection: 'row', alignItems: 'center', gap: 12, width: '47%' }]}
          >
            <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: item.color, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>{item.val}</Text>
            </View>
            <Text style={{ fontSize: 13, color: colors.gray600 }}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Room Status */}
      <View style={[commonStyles.card, { marginBottom: 16 }]}>
        <Text style={{ fontWeight: '600', fontSize: 16, color: colors.gray800, marginBottom: 14 }}>Статус номеров</Text>
        {[
          { label: 'Свободно', count: rs.vacant, color: colors.vacant },
          { label: 'Бронь', count: rs.booked, color: colors.booked },
          { label: 'Занято', count: rs.occupied, color: colors.occupied },
          { label: 'Выезд', count: rs.checkout, color: colors.checking_out },
        ].map((seg, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: seg.color }} />
            <Text style={{ fontSize: 14, color: colors.gray600, width: 70 }}>{seg.label}</Text>
            <View style={{ flex: 1, height: 8, backgroundColor: colors.gray100, borderRadius: 4, overflow: 'hidden' }}>
              <View style={{
                height: '100%',
                borderRadius: 4,
                backgroundColor: seg.color,
                width: totalRooms > 0 ? `${(seg.count / totalRooms) * 100}%` : '0%',
              }} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.gray800, width: 28, textAlign: 'right' }}>{seg.count}</Text>
          </View>
        ))}
        <View style={[commonStyles.separator, { marginTop: 6 }]} />
        <Text style={{ fontSize: 13, color: colors.gray500 }}>Всего номеров: {totalRooms}</Text>
      </View>

      {/* Finance */}
      <View style={[commonStyles.card, { marginBottom: 16 }]}>
        <Text style={{ fontWeight: '600', fontSize: 16, color: colors.gray800, marginBottom: 14 }}>Финансы</Text>
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success }} />
              <Text style={{ fontSize: 13, color: colors.gray500 }}>Доход</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.success }}>+{data.finance.income.toLocaleString()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger }} />
              <Text style={{ fontSize: 13, color: colors.gray500 }}>Расход</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.danger }}>-{data.finance.expense.toLocaleString()}</Text>
          </View>
        </View>
        <View style={{
          flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8,
          backgroundColor: data.finance.balance >= 0 ? colors.successLight : colors.dangerLight,
        }}>
          <Text style={{ fontWeight: '600', color: colors.gray700 }}>Баланс</Text>
          <Text style={{
            fontSize: 18, fontWeight: '700',
            color: data.finance.balance >= 0 ? colors.success : colors.danger,
          }}>
            {data.finance.balance >= 0 ? '+' : ''}{data.finance.balance.toLocaleString()}
          </Text>
        </View>

        {categories.length > 0 && (
          <>
            <View style={[commonStyles.separator]} />
            <Text style={{ fontSize: 14, color: colors.gray500, marginBottom: 10 }}>Расходы по категориям</Text>
            {categories.map((c, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: catColors[i % catColors.length] }} />
                <Text style={{ flex: 1, fontSize: 13, color: colors.gray600 }}>{catLabels[c.category] || c.category}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.gray800 }}>{c.total.toLocaleString()}</Text>
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}
