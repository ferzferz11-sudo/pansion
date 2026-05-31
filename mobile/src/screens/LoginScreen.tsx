import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../AuthContext';
import { commonStyles, colors } from '../styles';
import { LoadingSpinner } from '../components/common';

export default function LoginScreen() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('admin@pansion.local');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err?.message || 'Ошибка входа');
    }
  };

  if (loading) return <LoadingSpinner text="Вход..." />;

  return (
    <KeyboardAvoidingView
      style={[commonStyles.container, { justifyContent: 'center' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 20,
            backgroundColor: colors.primary,
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <Text style={{ color: 'white', fontSize: 28, fontWeight: '800' }}>РП</Text>
          </View>
          <Text style={commonStyles.title}>Pansion CRM</Text>
          <Text style={commonStyles.subtitle}>Войдите в систему</Text>
        </View>

        {error ? <Text style={commonStyles.errorText}>{error}</Text> : null}

        <View style={{ gap: 14 }}>
          <View>
            <Text style={commonStyles.label}>Email</Text>
            <TextInput
              style={commonStyles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="email@pansion.local"
              placeholderTextColor={colors.gray400}
            />
          </View>

          <View>
            <Text style={commonStyles.label}>Пароль</Text>
            <TextInput
              style={commonStyles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Пароль"
              placeholderTextColor={colors.gray400}
            />
          </View>

          <TouchableOpacity
            style={[commonStyles.button, { marginTop: 8 }]}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={commonStyles.buttonText}>Войти</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
