import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { colors } = useTheme();
  const C = colors || COLORS;
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleRegister = async () => {
    const { username, email, password, fullName } = form;
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin bắt buộc');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    setLoading(true);
    try {
      await register({ username: username.trim(), email: email.trim(), password, fullName: fullName.trim() });
    } catch (err) {
      Alert.alert('Đăng ký thất bại', err.message || 'Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: C.background }]}>
      <View style={[styles.circleDeco, { backgroundColor: C.primary }]} />
      <View style={[styles.circleDecoSmall, { backgroundColor: C.primary + '40' }]} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.logo}>💸</Text>
            <Text style={[styles.title, { color: C.primary }]}>Tạo tài khoản</Text>
            <Text style={[styles.subtitle, { color: C.textLight }]}>Quản lý tài chính cá nhân thông minh</Text>
          </View>

          <View style={[styles.card, { backgroundColor: C.surface }]}>
            <TextInput
              style={[styles.input, { backgroundColor: C.background, color: C.text, borderColor: C.border }]} 
              placeholder="Họ tên" placeholderTextColor={C.textLight}
              value={form.fullName} onChangeText={(v) => update('fullName', v)}
            />
            <TextInput
              style={[styles.input, { backgroundColor: C.background, color: C.text, borderColor: C.border }]} 
              placeholder="Tên đăng nhập *" placeholderTextColor={C.textLight}
              value={form.username} onChangeText={(v) => update('username', v)} autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, { backgroundColor: C.background, color: C.text, borderColor: C.border }]} 
              placeholder="Email *" placeholderTextColor={C.textLight}
              value={form.email} onChangeText={(v) => update('email', v)}
              keyboardType="email-address" autoCapitalize="none"
            />
            <View style={[styles.passwordContainer, { backgroundColor: C.background, borderColor: C.border }]}>
              <TextInput
                style={[styles.passwordInput, { color: C.text }]}
                placeholder="Mật khẩu *" placeholderTextColor={C.textLight}
                value={form.password} onChangeText={(v) => update('password', v)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.textLight} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: C.primary }, loading && styles.buttonDisabled]}
              onPress={handleRegister} disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.buttonText}>Đăng ký ngay</Text>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.white} style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={[styles.link, { color: C.textSecondary }]}>
                Đã có tài khoản? <Text style={[styles.linkBold, { color: C.primary }]}>Đăng nhập</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  circleDeco: { position: 'absolute', top: -100, left: -50, width: 250, height: 250, borderRadius: 125, opacity: 0.1 },
  circleDecoSmall: { position: 'absolute', top: 50, right: -50, width: 150, height: 150, borderRadius: 75, opacity: 0.1 },
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: SIZES.lg },
  header: { alignItems: 'center', marginBottom: SIZES.xl },
  logo: { fontSize: 64, marginBottom: SIZES.sm },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 14 },
  card: { padding: SIZES.lg, borderRadius: SIZES.radiusLg, ...SHADOWS.md, gap: SIZES.md },
  input: { borderRadius: SIZES.radiusSm, padding: SIZES.md, fontSize: 16, borderWidth: 1 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: SIZES.radiusSm },
  passwordInput: { flex: 1, padding: SIZES.md, fontSize: 16 },
  eyeBtn: { padding: SIZES.md },
  button: {
    flexDirection: 'row', borderRadius: SIZES.radiusSm, padding: SIZES.md,
    alignItems: 'center', justifyContent: 'center', marginTop: SIZES.xs, ...SHADOWS.sm,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  link: { textAlign: 'center', marginTop: SIZES.md, fontSize: 14 },
  linkBold: { fontWeight: '700' },
});
