import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, RefreshControl } from 'react-native';
import api from '../api';
import { useAuth } from '../AuthContext';
import { type FinanceCategory } from '../types';
import { colors, commonStyles } from '../styles';
import { LoadingSpinner, ErrorView, EmptyView } from '../components/common';

export default function FinanceScreen() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<{ income: number; expense: number; balance: number } | null>(null);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dash, cats] = await Promise.all([
        api.get<any>('/dashboard', token),
        api.get<FinanceCategory[]>('/finance/categories', token),
      ]);
      setSummary(dash.finance);
      setCategories(cats);
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const catLabels: Record<string, string> = {
    rent: 'Проживание', food: 'Питание', chemicals: 'Химия',
    salary: 'Зарплата', maintenance: 'Обслуживание', utilities: 'Коммунальные', other: 'Другое',
  };
  const catColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <View style={commonStyles.container}>
      {loading && !summary ? (
        <LoadingSpinner />
      ) : error && !summary ? (
        <ErrorView message={error} onRetry={fetchData} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.gray800, marginBottom: 16 }}>
            Финансы
          </Text>

          {summary && (
            <>
              <View style={[commonStyles.card, { marginBottom: 16 }]}>
                <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success }} />
                      <Text style={{ fontSize: 13, color: colors.gray500 }}>Доход</Text>
                    </View>
                    <Text style={{ fontSize: 22, fontWeight: '700', color: colors.success }}>
                      +{summary.income.toLocaleString()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger }} />
                      <Text style={{ fontSize: 13, color: colors.gray500 }}>Расход</Text>
                    </View>
                    <Text style={{ fontSize: 22, fontWeight: '700', color: colors.danger }}>
                      -{summary.expense.toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View style={{
                  paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10,
                  backgroundColor: summary.balance >= 0 ? colors.successLight : colors.dangerLight,
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <Text style={{ fontWeight: '600', fontSize: 15, color: colors.gray700 }}>Баланс</Text>
                  <Text style={{
                    fontSize: 22, fontWeight: '700',
                    color: summary.balance >= 0 ? colors.success : colors.danger,
                  }}>
                    {summary.balance >= 0 ? '+' : ''}{summary.balance.toLocaleString()}
                  </Text>
                </View>
              </View>

              {categories.length > 0 && (
                <View style={[commonStyles.card]}>
                  <Text style={{ fontWeight: '600', fontSize: 15, color: colors.gray800, marginBottom: 12 }}>
                    Расходы по категориям
                  </Text>
                  {categories.map((c, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 }}>
                      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: catColors[i % catColors.length] }} />
                      <Text style={{ flex: 1, fontSize: 14, color: colors.gray600 }}>
                        {catLabels[c.category] || c.category}
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.gray800 }}>
                        {c.total.toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}
