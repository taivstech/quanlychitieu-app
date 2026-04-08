import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      Alert.alert('Đăng nhập thất bại', err.message || 'Sai tài khoản hoặc mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const C = COLORS; // Always use light for auth

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Background decoration */}
      <View style={styles.topDecor} />

      <View style={styles.logoSection}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>💰</Text>
        </View>
        <Text style={styles.appName}>QuanLy <Text style={{ color: C.primary }}>ChiTieu</Text></Text>
        <Text style={styles.tagline}>Quản lý tài chính thông minh</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Đăng nhập</Text>

        <View style={styles.inputGroup}>
          <Ionicons name="person-outline" size={18} color={C.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Tên đăng nhập"
            placeholderTextColor={C.textLight}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Ionicons name="lock-closed-outline" size={18} color={C.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Mật khẩu"
            placeholderTextColor={C.textLight}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.loginBtn, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.loginBtnText}>Đăng nhập</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerLink}>
          <Text style={styles.registerText}>
            Chưa có tài khoản? <Text style={styles.registerBold}>Đăng ký ngay</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const C = COLORS;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  topDecor: {
    position: 'absolute', top: -80, left: -60, right: -60,
    height: 280, borderRadius: 200, backgroundColor: C.primary, opacity: 0.08,
  },
  logoSection: { alignItems: 'center', paddingTop: 80, paddingBottom: SIZES.xl },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: SIZES.md,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  logoEmoji: { fontSize: 40 },
  appName: { fontSize: 26, fontWeight: '800', color: C.text },
  tagline: { color: C.textSecondary, fontSize: 14, marginTop: 4 },
  card: {
    backgroundColor: C.surface, marginHorizontal: SIZES.md, borderRadius: 24,
    padding: SIZES.xl,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  cardTitle: { color: C.text, fontSize: 20, fontWeight: '800', marginBottom: SIZES.lg },
  inputGroup: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.background,
    borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: SIZES.md, marginBottom: SIZES.sm,
  },
  inputIcon: { marginRight: SIZES.sm },
  input: { flex: 1, fontSize: 15, color: C.text, paddingVertical: 14 },
  eyeBtn: { padding: 4 },
  loginBtn: {
    backgroundColor: C.primary, borderRadius: 14, padding: SIZES.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SIZES.sm,
    marginTop: SIZES.sm,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  registerLink: { marginTop: SIZES.lg, alignItems: 'center' },
  registerText: { color: C.textSecondary, fontSize: 14 },
  registerBold: { color: C.primary, fontWeight: '700' },
});
