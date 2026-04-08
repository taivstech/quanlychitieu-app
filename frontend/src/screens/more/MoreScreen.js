import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Switch, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function MoreScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();
  const C = colors || COLORS;
  const [settingsVisible, setSettingsVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = (user?.fullName || user?.username || 'U').slice(0, 2).toUpperCase();

  const MenuSection = ({ children, style }) => (
    <View style={[styles(C).section, style]}>{children}</View>
  );

  const MenuItem = ({ icon, iconColor, label, sublabel, onPress, rightEl, danger }) => (
    <TouchableOpacity style={styles(C).menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles(C).menuIconWrap, { backgroundColor: (iconColor || C.primary) + '18' }]}>
        <Ionicons name={icon} size={20} color={iconColor || C.primary} />
      </View>
      <View style={styles(C).menuLabelWrap}>
        <Text style={[styles(C).menuLabel, danger && { color: C.error }]}>{label}</Text>
        {sublabel && <Text style={styles(C).menuSublabel}>{sublabel}</Text>}
      </View>
      {rightEl || (
        danger ? null : <Ionicons name="chevron-forward" size={18} color={C.textLight} />
      )}
    </TouchableOpacity>
  );

  const Divider = () => <View style={styles(C).divider} />;

  return (
    <View style={styles(C).container}>
      {/* Header */}
      <View style={styles(C).header}>
        <Text style={styles(C).headerTitle}>Tài khoản</Text>
        <TouchableOpacity onPress={() => setSettingsVisible(true)} style={styles(C).settingsBtn}>
          <Ionicons name="settings-outline" size={22} color={C.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles(C).profileCard}>
          <View style={styles(C).avatarWrap}>
            <View style={styles(C).avatar}>
              <Text style={styles(C).avatarText}>{initials}</Text>
            </View>
            <View style={styles(C).onlineDot} />
          </View>
          <View style={styles(C).profileInfo}>
            <Text style={styles(C).profileName}>{user?.fullName || user?.username || 'Người dùng'}</Text>
            <Text style={styles(C).profileEmail}>{user?.email || 'Chưa có email'}</Text>
            <View style={styles(C).freeBadge}>
              <Ionicons name="star" size={10} color={C.primary} />
              <Text style={styles(C).freeBadgeText}>Miễn phí</Text>
            </View>
          </View>
          <TouchableOpacity style={styles(C).editProfileBtn}>
            <Ionicons name="pencil-outline" size={18} color={C.primary} />
          </TouchableOpacity>
        </View>

        {/* Section: Ví & Giao dịch */}
        <Text style={styles(C).sectionLabel}>Quản lý tài chính</Text>
        <MenuSection>
          <MenuItem icon="wallet-outline" iconColor="#3B82F6" label="Ví của tôi"
            sublabel="Quản lý ví và số dư"
            onPress={() => navigation.navigate('Wallets')} />
          <Divider />
          <MenuItem icon="bar-chart-outline" iconColor="#8B5CF6" label="Báo cáo"
            sublabel="Phân tích thu chi"
            onPress={() => navigation.navigate('Reports')} />
        </MenuSection>

        {/* Section: Tính năng */}
        <Text style={styles(C).sectionLabel}>Tính năng</Text>
        <MenuSection>
          <MenuItem icon="briefcase-outline" iconColor="#F59E0B" label="Sự kiện & Chuyến đi"
            sublabel="Theo dõi chi tiêu sự kiện"
            onPress={() => navigation.navigate('Events')} />
          <Divider />
          <MenuItem icon="repeat-outline" iconColor="#10B981" label="Giao dịch định kỳ"
            sublabel="Tự động thu/chi định kỳ"
            onPress={() => navigation.navigate('Recurring')} />
          <Divider />
          <MenuItem icon="document-text-outline" iconColor="#EF4444" label="Hóa đơn"
            sublabel="Nhắc nhở thanh toán"
            onPress={() => navigation.navigate('Bills')} />
          <Divider />
          <MenuItem icon="people-outline" iconColor="#6366F1" label="Sổ nợ"
            sublabel="Theo dõi vay mượn"
            onPress={() => navigation.navigate('Debts')} />
          <Divider />
          <MenuItem icon="flag-outline" iconColor="#F59E0B" label="Mục tiêu tiết kiệm"
            sublabel="Đặt và theo dõi mục tiêu"
            onPress={() => navigation.navigate('SavingGoals')} />
          <Divider />
          <MenuItem icon="grid-outline" iconColor="#94A3B8" label="Nhóm giao dịch"
            sublabel="Quản lý danh mục thu/chi"
            onPress={() => navigation.navigate('Categories')} />
          <Divider />
          <MenuItem icon="people-circle-outline" iconColor="#3B82F6" label="Ví nhóm"
            sublabel="Chia sẻ ví và quản lý nhóm"
            onPress={() => navigation.navigate('SharedWallet')}
          />
        </MenuSection>

        {/* Section: Hệ thống */}
        <Text style={styles(C).sectionLabel}>Hệ thống</Text>
        <MenuSection>
          <MenuItem icon="information-circle-outline" iconColor="#3B82F6" label="Giới thiệu"
            onPress={() => Alert.alert('Quản Lý Chi Tiêu', 'Phiên bản 1.0.0\nỨng dụng quản lý chi tiêu cá nhân toàn diện.\n\n© 2026')} />
          <Divider />
          <MenuItem icon="log-out-outline" iconColor={C.error} label="Đăng xuất" danger onPress={handleLogout} />
        </MenuSection>

        <Text style={styles(C).version}>QuanLyChiTieu v1.0.0</Text>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Settings Modal */}
      <Modal visible={settingsVisible} animationType="slide" transparent>
        <View style={styles(C).modalOverlay}>
          <View style={styles(C).modalContent}>
            <View style={styles(C).modalHandle} />
            <View style={styles(C).modalHeader}>
              <Text style={styles(C).modalTitle}>⚙️ Cài đặt</Text>
              <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                <Ionicons name="close" size={24} color={C.text} />
              </TouchableOpacity>
            </View>
            <View style={styles(C).settingRow}>
              <View style={styles(C).settingLeft}>
                <View style={[styles(C).settingIcon, { backgroundColor: C.primaryBg }]}>
                  <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={C.primary} />
                </View>
                <View>
                  <Text style={styles(C).settingLabel}>Chế độ tối</Text>
                  <Text style={styles(C).settingHint}>{isDark ? 'Đang bật' : 'Đang tắt'}</Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: C.border, true: C.primaryLight }}
                thumbColor={isDark ? C.primary : '#f4f3f4'}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = (C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: SIZES.md,
    backgroundColor: C.surface, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { color: C.text, fontSize: 20, fontWeight: '800' },
  settingsBtn: { padding: 6 },

  // Profile
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.md,
    backgroundColor: C.surface, padding: SIZES.lg, marginBottom: SIZES.sm,
    ...SHADOWS.sm,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 22 },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: C.income, borderWidth: 2, borderColor: C.surface,
  },
  profileInfo: { flex: 1 },
  profileName: { color: C.text, fontSize: 17, fontWeight: '800' },
  profileEmail: { color: C.textSecondary, fontSize: 13, marginTop: 2 },
  freeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6,
    backgroundColor: C.primaryBg, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, alignSelf: 'flex-start',
  },
  freeBadgeText: { color: C.primary, fontSize: 11, fontWeight: '700' },
  editProfileBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1.5,
    borderColor: C.border, alignItems: 'center', justifyContent: 'center',
  },

  // Sections
  sectionLabel: {
    color: C.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.5,
    paddingHorizontal: SIZES.md, paddingTop: SIZES.md, paddingBottom: SIZES.xs,
    textTransform: 'uppercase',
  },
  section: { backgroundColor: C.surface, ...SHADOWS.xs, marginBottom: 2 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.sm,
    paddingVertical: 14, paddingHorizontal: SIZES.md,
  },
  menuIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabelWrap: { flex: 1 },
  menuLabel: { color: C.text, fontSize: 15, fontWeight: '600' },
  menuSublabel: { color: C.textSecondary, fontSize: 12, marginTop: 1 },
  divider: { height: 1, backgroundColor: C.borderLight, marginLeft: SIZES.md + 36 + SIZES.sm },
  comingSoonBadge: { backgroundColor: C.primaryBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  comingSoonText: { color: C.primary, fontSize: 11, fontWeight: '700' },
  version: { color: C.textLight, textAlign: 'center', marginTop: SIZES.lg, fontSize: 12 },

  // Settings Modal
  modalOverlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: C.surface, borderTopLeftRadius: SIZES.radiusLg,
    borderTopRightRadius: SIZES.radiusLg, padding: SIZES.lg, minHeight: 220,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: SIZES.md },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  modalTitle: { color: C.text, fontSize: 18, fontWeight: '800' },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: SIZES.md, borderTopWidth: 1, borderTopColor: C.border,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
  settingIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { color: C.text, fontSize: 15, fontWeight: '600' },
  settingHint: { color: C.textSecondary, fontSize: 12, marginTop: 1 },
});
