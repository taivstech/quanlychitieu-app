import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
  Modal, TextInput, RefreshControl, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS, WALLET_COLORS } from '../../constants/theme';
import { walletApi } from '../../api';
import { formatCurrency } from '../../utils/helpers';
import { useTheme } from '../../contexts/ThemeContext';

const WALLET_TYPES = ['CASH', 'BANK_ACCOUNT', 'CREDIT_CARD', 'E_WALLET'];
const WALLET_ICONS = { CASH: 'cash', BANK_ACCOUNT: 'business', CREDIT_CARD: 'card', E_WALLET: 'phone-portrait' };
const WALLET_LABELS = { CASH: 'Tiền mặt', BANK_ACCOUNT: 'Ngân hàng', CREDIT_CARD: 'Thẻ tín dụng', E_WALLET: 'Ví điện tử' };

export default function WalletScreen() {
  const { colors } = useTheme();
  const C = colors || COLORS;
  const navigation = useNavigation();
  const [wallets, setWallets] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [transferModal, setTransferModal] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'CASH', balance: '', icon: '', color: '#4CAF50' });
  const [transferForm, setTransferForm] = useState({ fromWalletId: null, toWalletId: null, amount: '', note: '' });

  const loadData = async () => {
    try {
      const [walRes, balRes, invRes] = await Promise.all([
        walletApi.getAll(),
        walletApi.getTotalBalance(),
        walletApi.getPendingInvites()
      ]);
      setWallets(walRes.data || []);
      setTotalBalance(balRes.data?.totalBalance || 0);
      setPendingInvites(invRes.data || []);
    } catch (err) { console.error('Wallet load error:', err); }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.balance) { Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ'); return; }
    try {
      await walletApi.create({ name: form.name.trim(), type: form.type, balance: parseFloat(form.balance), icon: form.icon, color: WALLET_COLORS[form.type] || form.color, includeInTotal: true });
      setModalVisible(false);
      setForm({ name: '', type: 'CASH', balance: '', icon: '', color: '#4CAF50' });
      loadData();
    } catch (err) { Alert.alert('Lỗi', err.message || 'Không thể tạo ví'); }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Xóa ví', `Bạn có chắc muốn xóa ví "${name}"?`, [
      { text: 'Hủy' },
      { text: 'Xóa', style: 'destructive', onPress: async () => { try { await walletApi.delete(id); loadData(); } catch (e) { Alert.alert('Lỗi', 'Không thể xóa'); } } },
    ]);
  };

  const handleTransfer = async () => {
    const { fromWalletId, toWalletId, amount } = transferForm;
    if (!fromWalletId || !toWalletId || !amount) { Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ'); return; }
    if (fromWalletId === toWalletId) { Alert.alert('Lỗi', 'Không thể chuyển cùng 1 ví'); return; }
    try {
      await walletApi.transfer({ fromWalletId, toWalletId, amount: parseFloat(amount), note: transferForm.note });
      setTransferModal(false);
      setTransferForm({ fromWalletId: null, toWalletId: null, amount: '', note: '' });
      loadData();
    } catch (err) { Alert.alert('Lỗi', err.message || 'Chuyển tiền thất bại'); }
  };

  const handleRespondInvite = async (inviteId, accept) => {
    try {
      await walletApi.respondToInvite(inviteId, accept);
      loadData();
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể phản hồi lời mời');
    }
  };

  const st = styles(C);

  const renderWallet = ({ item }) => {
    const wc = WALLET_COLORS[item.type] || C.primary;
    return (
      <TouchableOpacity
        style={st.walletCard}
        onLongPress={() => handleDelete(item.id, item.name)}
        onPress={() => navigation.navigate('SharedWallet', { walletId: item.id })}
      >
        <View style={[st.walletIconWrap, { backgroundColor: wc }]}>
          <Ionicons name={WALLET_ICONS[item.type] || 'wallet'} size={24} color="#fff" />
        </View>
        <View style={st.walletInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={st.walletName}>{item.name}</Text>
            {item.isShared && (
              <Ionicons name="people" size={14} color={C.textSecondary} />
            )}
          </View>
          <Text style={st.walletType}>{WALLET_LABELS[item.type] || item.type}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={[st.walletBalance, { color: item.balance < 0 ? C.expense : C.text }]}>
            {formatCurrency(item.balance)}
          </Text>
          <View style={[st.walletTypeBadge, { backgroundColor: wc + '18' }]}>
            <Text style={[st.walletTypeBadgeText, { color: wc }]}>{WALLET_LABELS[item.type]}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={st.container}>
      <View style={st.header}>
        <Text style={st.headerTitle}>Ví của tôi</Text>
        <TouchableOpacity onPress={() => setTransferModal(true)} style={st.transferBtn}>
          <Ionicons name="swap-horizontal" size={20} color={C.primary} />
          <Text style={st.transferBtnText}>Chuyển tiền</Text>
        </TouchableOpacity>
      </View>

      {/* Total Balance Card */}
      <View style={st.totalCard}>
        <View style={st.totalRow}>
          <View>
            <Text style={st.totalLabel}>Tổng số dư</Text>
            <Text style={st.totalAmount}>{formatCurrency(totalBalance)}</Text>
          </View>
          <View style={st.totalIcon}>
            <Ionicons name="wallet" size={32} color="rgba(255,255,255,0.8)" />
          </View>
        </View>
        <Text style={st.totalHint}>{wallets.length} ví đang hoạt động</Text>
      </View>

      {/* Pending Invites Section */}
      {pendingInvites.length > 0 && (
        <View style={st.inviteContainer}>
          <Text style={st.sectionTitle}>Lời mời tham gia ví ({pendingInvites.length})</Text>
          {pendingInvites.map(inv => (
            <View key={inv.id} style={st.inviteCard}>
              <View style={st.inviteInfo}>
                <Ionicons name="people-circle" size={32} color={C.primary} />
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text style={st.inviteText}>
                    <Text style={{ fontWeight: '700' }}>{inv.fullName}</Text> mời bạn vào ví <Text style={{ fontWeight: '700' }}>{inv.username}</Text>
                  </Text>
                  <Text style={st.inviteRole}>Quyền: {inv.role === 'EDITOR' ? 'Ghi chép' : 'Chỉ xem'}</Text>
                </View>
              </View>
              <View style={st.inviteActions}>
                <TouchableOpacity onPress={() => handleRespondInvite(inv.id, false)} style={st.rejectBtn}>
                  <Text style={st.rejectBtnText}>Từ chối</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRespondInvite(inv.id, true)} style={st.acceptBtn}>
                  <Text style={st.acceptBtnText}>Chấp nhận</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <FlatList
        data={wallets}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderWallet}
        contentContainerStyle={st.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} tintColor={C.primary} />}
        ListEmptyComponent={
          <View style={st.emptyContainer}>
            <Ionicons name="wallet-outline" size={52} color={C.textLight} />
            <Text style={st.empty}>Chưa có ví nào</Text>
            <Text style={st.emptyHint}>Thêm ví để bắt đầu theo dõi chi tiêu</Text>
          </View>
        }
      />

      <TouchableOpacity style={st.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Create Wallet Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={st.modalOverlay}>
          <View style={st.modalContent}>
            <View style={st.modalHandle} />
            <Text style={st.modalTitle}>➕ Thêm ví mới</Text>

            <TextInput style={st.input} placeholder="Tên ví *" placeholderTextColor={C.textLight}
              value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} />

            <View style={st.amountWrap}>
              <TextInput style={st.amountInput} placeholder="0" placeholderTextColor={C.textLight}
                keyboardType="numeric" value={form.balance}
                onChangeText={(v) => setForm((p) => ({ ...p, balance: v }))} />
              <Text style={st.amountCurrency}>đ</Text>
            </View>

            <Text style={st.pickerLabel}>Loại ví</Text>
            <View style={st.chipWrap}>
              {WALLET_TYPES.map((t) => {
                const wc = WALLET_COLORS[t];
                return (
                  <TouchableOpacity key={t}
                    style={[st.chip, form.type === t && { backgroundColor: wc, borderColor: wc }]}
                    onPress={() => setForm((p) => ({ ...p, type: t }))}>
                    <Ionicons name={WALLET_ICONS[t]} size={14} color={form.type === t ? '#fff' : C.textSecondary} />
                    <Text style={[st.chipText, form.type === t && { color: '#fff' }]}>{WALLET_LABELS[t]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={st.modalActions}>
              <TouchableOpacity style={st.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={st.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.saveBtn} onPress={handleCreate}>
                <Text style={st.saveBtnText}>Tạo ví</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Transfer Modal */}
      <Modal visible={transferModal} animationType="slide" transparent>
        <View style={st.modalOverlay}>
          <View style={st.modalContent}>
            <View style={st.modalHandle} />
            <Text style={st.modalTitle}>↔️ Chuyển tiền</Text>

            <View style={st.amountWrap}>
              <TextInput style={st.amountInput} placeholder="0" placeholderTextColor={C.textLight}
                keyboardType="numeric" value={transferForm.amount}
                onChangeText={(v) => setTransferForm((p) => ({ ...p, amount: v }))} />
              <Text style={st.amountCurrency}>đ</Text>
            </View>

            <Text style={st.pickerLabel}>Từ ví</Text>
            <View style={st.chipWrap}>
              {wallets.map((w) => (
                <TouchableOpacity key={w.id}
                  style={[st.chip, transferForm.fromWalletId === w.id && { backgroundColor: WALLET_COLORS[w.type] || C.primary, borderColor: 'transparent' }]}
                  onPress={() => setTransferForm((p) => ({ ...p, fromWalletId: w.id }))}>
                  <Ionicons name={WALLET_ICONS[w.type] || 'wallet'} size={13}
                    color={transferForm.fromWalletId === w.id ? '#fff' : C.textSecondary} />
                  <Text style={[st.chipText, transferForm.fromWalletId === w.id && { color: '#fff' }]}>{w.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={st.pickerLabel}>Đến ví</Text>
            <View style={st.chipWrap}>
              {wallets.map((w) => (
                <TouchableOpacity key={w.id}
                  style={[st.chip, transferForm.toWalletId === w.id && { backgroundColor: WALLET_COLORS[w.type] || C.primary, borderColor: 'transparent' }]}
                  onPress={() => setTransferForm((p) => ({ ...p, toWalletId: w.id }))}>
                  <Ionicons name={WALLET_ICONS[w.type] || 'wallet'} size={13}
                    color={transferForm.toWalletId === w.id ? '#fff' : C.textSecondary} />
                  <Text style={[st.chipText, transferForm.toWalletId === w.id && { color: '#fff' }]}>{w.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput style={st.input} placeholder="Ghi chú" placeholderTextColor={C.textLight}
              value={transferForm.note} onChangeText={(v) => setTransferForm((p) => ({ ...p, note: v }))} />

            <View style={st.modalActions}>
              <TouchableOpacity style={st.cancelBtn} onPress={() => setTransferModal(false)}>
                <Text style={st.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.saveBtn} onPress={handleTransfer}>
                <Text style={st.saveBtnText}>Chuyển</Text>
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
    backgroundColor: C.surface, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { color: C.text, fontSize: 20, fontWeight: '800' },
  transferBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, backgroundColor: C.primaryBg, borderWidth: 1, borderColor: C.primary + '40',
  },
  transferBtnText: { color: C.primary, fontSize: 13, fontWeight: '700' },

  totalCard: {
    backgroundColor: C.primary, margin: SIZES.md, borderRadius: SIZES.radius, padding: SIZES.lg, ...SHADOWS.lg,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  totalLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  totalAmount: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 4 },
  totalIcon: { opacity: 0.6 },
  totalHint: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: SIZES.sm },

  inviteContainer: { paddingHorizontal: SIZES.md, marginBottom: SIZES.sm },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.textSecondary, marginBottom: 8 },
  inviteCard: {
    backgroundColor: C.surface, borderRadius: SIZES.radius, padding: 12,
    borderWidth: 1, borderColor: C.primary + '30', ...SHADOWS.sm
  },
  inviteInfo: { flexDirection: 'row', alignItems: 'center' },
  inviteText: { fontSize: 14, color: C.text, lineHeight: 20 },
  inviteRole: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  inviteActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  acceptBtn: { backgroundColor: C.primary, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 15 },
  acceptBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  rejectBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 15, borderWidth: 1, borderColor: C.border },
  rejectBtnText: { color: C.textSecondary, fontSize: 12, fontWeight: '600' },

  list: { padding: SIZES.md, paddingBottom: 100 },
  walletCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: SIZES.radius, padding: SIZES.md, marginBottom: SIZES.sm, ...SHADOWS.sm,
  },
  walletIconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  walletInfo: { flex: 1, marginLeft: SIZES.sm },
  walletName: { color: C.text, fontSize: 15, fontWeight: '700' },
  walletType: { color: C.textSecondary, fontSize: 12, marginTop: 2 },
  walletBalance: { fontSize: 16, fontWeight: '800' },
  walletTypeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  walletTypeBadgeText: { fontSize: 10, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', paddingVertical: SIZES.xxl, gap: SIZES.sm },
  empty: { color: C.textSecondary, fontSize: 15, fontWeight: '600' },
  emptyHint: { color: C.textLight, fontSize: 13 },

  fab: {
    position: 'absolute', bottom: SIZES.lg, right: SIZES.lg, width: 56, height: 56,
    borderRadius: 28, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', ...SHADOWS.lg,
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: C.surface, borderTopLeftRadius: SIZES.radiusLg,
    borderTopRightRadius: SIZES.radiusLg, padding: SIZES.lg, maxHeight: '80%',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: SIZES.md },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.text, textAlign: 'center', marginBottom: SIZES.md },
  amountWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.primaryBg,
    borderRadius: SIZES.radius, padding: SIZES.md, marginBottom: SIZES.sm,
  },
  amountInput: { flex: 1, fontSize: 26, fontWeight: '800', color: C.primary },
  amountCurrency: { fontSize: 18, fontWeight: '700', color: C.primary },
  input: {
    backgroundColor: C.background, borderRadius: SIZES.radiusSm, borderWidth: 1,
    borderColor: C.border, padding: SIZES.md, fontSize: 15, marginBottom: SIZES.sm, color: C.text,
  },
  pickerLabel: { color: C.text, fontSize: 13, fontWeight: '700', marginBottom: SIZES.xs, marginTop: SIZES.xs },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.xs, marginBottom: SIZES.sm },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5,
    borderColor: C.border, marginRight: SIZES.xs, marginBottom: SIZES.xs,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  chipText: { fontSize: 13, color: C.text, fontWeight: '500' },
  modalActions: { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.md },
  cancelBtn: { flex: 1, padding: SIZES.md, borderRadius: SIZES.radius, borderWidth: 1.5, borderColor: C.border, alignItems: 'center' },
  cancelText: { color: C.textSecondary, fontWeight: '700', fontSize: 15 },
  saveBtn: { flex: 1, padding: SIZES.md, borderRadius: SIZES.radius, backgroundColor: C.primary, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
