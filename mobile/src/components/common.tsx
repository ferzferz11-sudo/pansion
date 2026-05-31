import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { commonStyles, colors } from '../styles';

export function LoadingSpinner({ text }: { text?: string }) {
  return (
    <View style={commonStyles.centered}>
      <ActivityIndicator size="large" color={colors.primary} />
      {text ? <Text style={{ marginTop: 12, color: colors.gray500, fontSize: 14 }}>{text}</Text> : null}
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={[commonStyles.centered, { padding: 24 }]}>
      <Text style={{ fontSize: 48, marginBottom: 8 }}>⚠️</Text>
      <Text style={commonStyles.errorText}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity style={[commonStyles.buttonSecondary, { marginTop: 16, paddingHorizontal: 24 }]} onPress={onRetry}>
          <Text style={commonStyles.buttonSecondaryText}>Повторить</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function EmptyView({ text }: { text?: string }) {
  return (
    <View style={[commonStyles.centered, { padding: 32 }]}>
      <Text style={{ fontSize: 40, marginBottom: 8 }}>📭</Text>
      <Text style={commonStyles.emptyText}>{text || 'Нет данных'}</Text>
    </View>
  );
}

export function StatCard({ label, value, bgColor, onPress }: {
  label: string;
  value: number | string;
  bgColor?: string;
  onPress?: () => void;
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={[commonStyles.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[{
        width: 48, height: 48, borderRadius: 12,
        backgroundColor: bgColor || colors.primary,
        alignItems: 'center', justifyContent: 'center',
      }]}>
        <Text style={{ color: colors.white, fontWeight: '700', fontSize: 18 }}>{value}</Text>
      </View>
      <Text style={[commonStyles.subtitle, { fontSize: 14 }]}>{label}</Text>
    </Wrapper>
  );
}
