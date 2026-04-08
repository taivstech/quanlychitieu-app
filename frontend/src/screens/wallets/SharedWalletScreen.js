import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
  TextInput, RefreshControl, Modal, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { walletApi } from '../../api';
import { useTheme } from '../../contexts/ThemeContext';

export default function SharedWalletScreen({ route, navigation }) {
  const walletIdFromParams = route.params?.walletId;
  const { colors } = useTheme();
  const C = colors || COLORS;

  const [selectedWalletId, setSelectedWalletId] = useState(walletIdFromParams);
  const [wallets, setWallets] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ username: '', role: 'EDITOR' });
  const [inviting, setInviting] = useState(false);

  const loadMembers = async () => {
    if (!selectedWalletId) {
      setLoading(false);
      return;
    }
    try {
      const res = await walletApi.getMembers(selectedWalletId);
      setMembers(res.data || []);
    } catch (err) {
      console.error('Member load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadWallets = async () => {
    try {
      const res = await walletApi.getAll();
      setWallets(res.data || []);
      // If no wallet selected yet, and we have wallets, don't auto-select unless intended
    } catch (err) {
      console.error('Wallet load error:', err);
    }
  };

  useEffect(() => { 
    loadWallets();
    if (selectedWalletId) loadMembers();
    else setLoading(false);
  }, [selectedWalletId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMembers();
    setRefreshing(false);
  };

  const handleInvite = async () => {
    if (!inviteForm.username.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập username');
      return;
    }
    setInviting(true);
    try {
      await walletApi.inviteMember(selectedWalletId, {
        username: inviteForm.username.trim(),
        role: inviteForm.role
      });
      Alert.alert('Thành công', 'Đã gửi lời mời tham gia ví');
      setInviteModal(false);
      setInviteForm({ username: '', role: 'EDITOR' });
      loadMembers();
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể gửi lời mời');
    } finally {
      setInviting(false);
    }
  };

  const st = styles(C);

  const getRoleLabel = (role) => {
    switch (role) {
      case 'OWNER': return 'Chủ ví';
      case 'EDITOR': return 'Người ghi chép';
      case 'VIEWER': return 'Người xem';
      default: return role;
    }
  };

  const renderMember = ({ item }) => (
    <View style={st.memberItem}>
      <View style={[st.avatar, { backgroundColor: C.primary + '20' }]}>
        <Text style={[st.avatarText, { color: C.primary }]}>
          {item.fullName?.charAt(0) || item.username?.charAt(0) || '?'}
        </Text>
      </View>
      <View style={st.memberInfo}>
        <Text style={st.memberName}>{item.fullName || item.username}</Text>
        <Text style={st.memberRole}>{getRoleLabel(item.role)}</Text>
      </View>
      <View style={[
        st.statusBadge, 
        { backgroundColor: item.status === 'ACCEPTED' ? C.income + '15' : C.warning + '15' }
      ]}>
        <Text style={[
          st.statusText, 
          { color: item.status === 'ACCEPTED' ? C.income : C.warning }
        ]}>
          {item.status === 'ACCEPTED' ? 'Đã tham gia' : 'Đang chờ'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={st.container}>
      <View style={st.header}>
        <Text style={st.headerTitle}>Ví nhóm</Text>
        {selectedWalletId && (
          <TouchableOpacity onPress={() => setInviteModal(true)} style={st.addBtn}>
            <Ionicons name="person-add" size={22} color={C.primary} />
          </TouchableOpacity>
        )}
      </View>

      {!selectedWalletId ? (
        <View style={{ flex: 1 }}>
          <Text style={st.selectLabel}>Chọn ví để quản lý nhóm:</Text>
          <FlatList
            data={wallets}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity style={st.walletCard} onPress={() => setSelectedWalletId(item.id)}>
                <View style={[st.walletIcon, { backgroundColor: item.color || C.primary }]}>
                  <Ionicons name="wallet" size={20} color="#fff" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={st.walletName}>{item.name}</Text>
                  <Text style={st.walletType}>{item.isShared ? 'Đang chia sẻ' : 'Cá nhân'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.textLight} />
              </TouchableOpacity>
            )}
            contentContainerStyle={st.list}
          />
        </View>
      ) : (
        <>
          {/* Wallet Info Header */}
          <View style={st.selectedWalletHeader}>
            <Ionicons name="people" size={24} color={C.primary} />
            <Text style={st.selectedWalletName}>
              {wallets.find(w => w.id === selectedWalletId)?.name || 'Đang tải...'}
            </Text>
            <TouchableOpacity onPress={() => setSelectedWalletId(null)} style={st.changeBtn}>
              <Text style={{ color: C.primary, fontWeight: '700' }}>Đổi ví</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              data={members}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderMember}
              contentContainerStyle={st.list}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListEmptyComponent={
                <View style={st.empty}>
                  <Text style={{ color: C.textLight }}>Chưa có thành viên nào khác</Text>
                </View>
              }
            />
          )}
        </>
      )}

      {/* Invite Modal */}
      <Modal visible={inviteModal} animationType="fade" transparent>
        <View style={st.modalOverlay}>
          <View style={st.modalContent}>
            <Text style={st.modalTitle}>Mời thành viên</Text>
            <Text style={st.label}>Username người nhận</Text>
            <TextInput
              style={st.input}
              placeholder="Nhập username..."
              placeholderTextColor={C.textLight}
              value={inviteForm.username}
              onChangeText={(v) => setInviteForm(p => ({ ...p, username: v }))}
              autoCapitalize="none"
            />
            
            <Text style={st.label}>Quyền hạn</Text>
            <View style={st.roleButtons}>
              {['EDITOR', 'VIEWER'].map(r => (
                <TouchableOpacity
                  key={r}
                  style={[st.roleBtn, inviteForm.role === r && { backgroundColor: C.primary, borderColor: C.primary }]}
                  onPress={() => setInviteForm(p => ({ ...p, role: r }))}
                >
                  <Text style={[st.roleBtnText, inviteForm.role === r && { color: '#fff' }]}>
                    {r === 'EDITOR' ? 'Được ghi chép' : 'Chỉ xem'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={st.actions}>
              <TouchableOpacity style={st.cancelBtn} onPress={() => setInviteModal(false)}>
                <Text style={st.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[st.inviteBtn, { backgroundColor: C.primary }]} 
                onPress={handleInvite}
                disabled={inviting}
              >
                {inviting ? <ActivityIndicator color="#fff" /> : <Text style={st.inviteBtnText}>Gửi lời mời</Text>}
              </TouchableOpacity>
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
    backgroundColor: C.surface, flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, textAlign: 'center', color: C.text, fontSize: 18, fontWeight: '800' },
  addBtn: { padding: 4 },
  list: { padding: SIZES.md },
  selectLabel: { paddingHorizontal: SIZES.md, paddingTop: SIZES.md, color: C.textSecondary, fontWeight: '700' },
  walletCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    padding: SIZES.md, borderRadius: SIZES.radius, marginBottom: SIZES.sm, ...SHADOWS.sm
  },
  walletIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  walletName: { color: C.text, fontSize: 16, fontWeight: '700' },
  walletType: { color: C.textSecondary, fontSize: 12, marginTop: 2 },
  
  selectedWalletHeader: {
    flexDirection: 'row', alignItems: 'center', padding: SIZES.md,
    backgroundColor: C.primaryBg, gap: 10, margin: SIZES.md, borderRadius: SIZES.radius
  },
  selectedWalletName: { flex: 1, color: C.primary, fontSize: 16, fontWeight: '800' },
  changeBtn: { padding: 4 },

  memberItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    padding: SIZES.md, borderRadius: SIZES.radius, marginBottom: SIZES.sm, ...SHADOWS.sm
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'
  },
  avatarText: { fontSize: 18, fontWeight: '800' },
  memberInfo: { flex: 1, marginLeft: SIZES.sm },
  memberName: { color: C.text, fontSize: 15, fontWeight: '700' },
  memberRole: { color: C.textSecondary, fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: 50 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SIZES.lg },
  modalContent: { backgroundColor: C.surface, borderRadius: SIZES.radiusLg, padding: SIZES.xl, ...SHADOWS.lg },
  modalTitle: { color: C.text, fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: SIZES.lg },
  label: { color: C.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: C.background, borderRadius: SIZES.radius, padding: SIZES.md,
    color: C.text, borderWidth: 1, borderColor: C.border
  },
  roleButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  roleBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5,
    borderColor: C.border, alignItems: 'center'
  },
  roleBtnText: { color: C.textSecondary, fontWeight: '700', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: SIZES.radius, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  cancelText: { color: C.textSecondary, fontWeight: '700' },
  inviteBtn: { flex: 1, paddingVertical: 12, borderRadius: SIZES.radius, alignItems: 'center' },
  inviteBtnText: { color: '#fff', fontWeight: '800' }
});
