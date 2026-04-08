import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
  Modal, TextInput, RefreshControl, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { debtApi, walletApi } from '../../api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { useTheme } from '../../contexts/ThemeContext';

export default function DebtScreen() {
  const { colors } = useTheme();
  const C = colors || COLORS;
  const [debts, setDebts] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [filter, setFilter] = useState('ALL'); // ALL, LENT, BORROWED
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [payModal, setPayModal] = useState({ visible: false, debtId: null });
  const [form, setForm] = useState({ type: 'LOAN', personName: '', amount: '', note: '', dueDate: '', walletId: null });
  const [payForm, setPayForm] = useState({ amount: '', walletId: null });

  const loadData = async () => {
    try {
      const [debtRes, walRes] = await Promise.all([
        filter === 'ALL' ? debtApi.getActive() : debtApi.getByType(filter),
        walletApi.getAll()
      ]);
      setDebts(debtRes.data || []);
      setWallets(walRes.data || []);
    } catch (err) { console.error('Debt load error:', err); }
  };

  useFocusEffect(useCallback(() => { loadData(); }, [filter]));

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleCreate = async () => {
    if (!form.personName.trim() || !form.amount) { Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ'); return; }

    const amountVal = parseFloat(form.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      Alert.alert('Lỗi', 'Số tiền phải lớn hơn 0');
      return;
    }

    try {
      await debtApi.create({
        type: form.type, personName: form.personName.trim(),
        amount: parseFloat(form.amount), note: form.note,
        dueDate: form.dueDate || null,
        walletId: form.walletId,
      });
      setModalVisible(false);
      setForm({ type: 'LOAN', personName: '', amount: '', note: '', dueDate: '', walletId: null });
      loadData();
    } catch (err) { Alert.alert('Lỗi', err.message || 'Không thể tạo'); }
  };

  const handlePay = async () => {
    if (!payForm.amount) { Alert.alert('Lỗi', 'Nhập số tiền'); return; }
    try {
      await debtApi.pay(payModal.debtId, {
        amount: parseFloat(payForm.amount),
        walletId: payForm.walletId
      });
      setPayModal({ visible: false, debtId: null });
      setPayForm({ amount: '', walletId: null });
      loadData();
    } catch (err) { Alert.alert('Lỗi', err.message || 'Thanh toán thất bại'); }
  };

  const handleDelete = (id) => {
    Alert.alert('Xác nhận', 'Xóa khoản nợ này?', [
      { text: 'Hủy' },
      { text: 'Xóa', style: 'destructive', onPress: async () => { try { await debtApi.delete(id); loadData(); } catch (e) { Alert.alert('Lỗi', 'Không thể xóa'); } } },
    ]);
  };

  const renderDebt = ({ item }) => {
    const pct = item.paidPercentage || 0;
    return (
      <TouchableOpacity style={[styles.card, { backgroundColor: C.surface }]} onLongPress={() => handleDelete(item.id)}>
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <Ionicons name={item.type === 'LOAN' ? 'arrow-up-circle' : 'arrow-down-circle'} size={24}
              color={item.type === 'LOAN' ? COLORS.income : COLORS.expense} />
            <View style={{ marginLeft: SIZES.sm }}>
              <Text style={[styles.personName, { color: C.text }]}>{item.personName}</Text>
              <Text style={[styles.debtType, { color: C.textLight }]}>{item.type === 'LOAN' ? 'Cho vay' : 'Đi vay'}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.debtAmount, { color: C.text }]}>{formatCurrency(item.amount)}</Text>
            {item.dueDate && <Text style={[styles.dueDate, { color: C.textLight }, item.overdue && { color: COLORS.error }]}>Hạn: {formatDate(item.dueDate)}</Text>}
          </View>
        </View>
        <View style={[styles.progressBg, { backgroundColor: C.border }]}>
          <View style={[styles.progressBar, { width: `${Math.min(pct, 100)}%`, backgroundColor: C.primary }]} />
        </View>
        <View style={styles.cardFooter}>
          <Text style={[styles.paidText, { color: C.textSecondary }]}>Đã trả: {formatCurrency(item.paidAmount)} ({pct.toFixed(0)}%)</Text>
          <TouchableOpacity style={[styles.payBtn, { backgroundColor: C.primary }]} onPress={() => setPayModal({ visible: true, debtId: item.id })}>
            <Text style={styles.payBtnText}>Thanh toán</Text>
          </TouchableOpacity>
        </View>
        {item.overdue && (
          <View style={styles.overdueBadge}>
            <Ionicons name="warning" size={14} color={COLORS.error} />
            <Text style={styles.overdueText}>Quá hạn!</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <Text style={[styles.headerTitle, { color: C.text }]}>💳 Nợ & Cho vay</Text>
      </View>

      <View style={styles.filterRow}>
        {[{ key: 'ALL', label: 'Tất cả' }, { key: 'LOAN', label: 'Cho vay' }, { key: 'DEBT', label: 'Đi vay' }].map((f) => (
          <TouchableOpacity key={f.key} style={[styles.filterBtn, { borderColor: C.border }, filter === f.key && { backgroundColor: C.primary, borderColor: C.primary }]}
            onPress={() => setFilter(f.key)}>
            <Text style={[styles.filterText, { color: C.textSecondary }, filter === f.key && { color: COLORS.white }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={debts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderDebt}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
        ListEmptyComponent={<Text style={[styles.empty, { color: C.textSecondary }]}>Không có khoản nợ nào</Text>}
      />

      <TouchableOpacity style={[styles.fab, { backgroundColor: C.primary }]} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>

      {/* Create Debt Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: C.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: C.surface }]}>
            <ScrollView>
              <Text style={[styles.modalTitle, { color: C.text }]}>Thêm khoản nợ</Text>
              <View style={styles.typeRow}>
                {['LOAN', 'DEBT'].map((t) => (
                  <TouchableOpacity key={t} style={[styles.typeBtn, { borderColor: C.border }, form.type === t && { backgroundColor: C.primary, borderColor: C.primary }]}
                    onPress={() => setForm((p) => ({ ...p, type: t }))}>
                    <Text style={[styles.typeBtnText, { color: C.textSecondary }, form.type === t && { color: COLORS.white }]}>
                      {t === 'LOAN' ? 'Cho vay' : 'Đi vay'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={[styles.input, { backgroundColor: C.background, color: C.text, borderColor: C.border }]} placeholder="Tên người *" placeholderTextColor={C.textLight}
                value={form.personName} onChangeText={(v) => setForm((p) => ({ ...p, personName: v }))} />
              <TextInput style={[styles.input, { backgroundColor: C.background, color: C.text, borderColor: C.border }]} placeholder="Số tiền *" placeholderTextColor={C.textLight}
                keyboardType="numeric" value={form.amount} onChangeText={(v) => setForm((p) => ({ ...p, amount: v }))} />
              <TextInput style={[styles.input, { backgroundColor: C.background, color: C.text, borderColor: C.border }]} placeholder="Ngày đến hạn (YYYY-MM-DD)" placeholderTextColor={C.textLight}
                value={form.dueDate} onChangeText={(v) => setForm((p) => ({ ...p, dueDate: v }))} />
              <TextInput style={[styles.input, { backgroundColor: C.background, color: C.text, borderColor: C.border }]} placeholder="Ghi chú" placeholderTextColor={C.textLight}
                value={form.note} onChangeText={(v) => setForm((p) => ({ ...p, note: v }))} />
              <Text style={[styles.pickerLabel, { color: C.text }]}>Ví liên kết (Tùy chọn)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SIZES.sm }}>
                {wallets.map((w) => (
                  <TouchableOpacity key={w.id}
                    style={[styles.chip, form.walletId === w.id && styles.chipActive]}
                    onPress={() => setForm((p) => ({ ...p, walletId: w.id }))}>
                    <Text style={[styles.chipText, { color: C.textSecondary }, form.walletId === w.id && { color: '#fff' }]}>{w.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.cancelBtn, { borderColor: C.border }]} onPress={() => setModalVisible(false)}><Text style={[styles.cancelText, { color: C.textSecondary }]}>Hủy</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: C.primary }]} onPress={handleCreate}><Text style={styles.saveBtnText}>Lưu</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Pay Modal */}
      <Modal visible={payModal.visible} animationType="fade" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: C.overlay }]}>
          <View style={[styles.modalContent, { maxHeight: '40%', backgroundColor: C.surface }]}>
            <TextInput style={[styles.input, { backgroundColor: C.background, color: C.text, borderColor: C.border }]} placeholder="Số tiền thanh toán *" placeholderTextColor={C.textLight}
              keyboardType="numeric" value={payForm.amount} onChangeText={(v) => setPayForm(p => ({ ...p, amount: v }))} />
            <Text style={[styles.pickerLabel, { color: C.text, marginTop: 8 }]}>Ví thanh toán (Tùy chọn)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SIZES.sm }}>
              {wallets.map((w) => (
                <TouchableOpacity key={w.id}
                  style={[styles.chip, payForm.walletId === w.id && styles.chipActive]}
                  onPress={() => setPayForm((p) => ({ ...p, walletId: w.id }))}>
                  <Text style={[styles.chipText, { color: C.textSecondary }, payForm.walletId === w.id && { color: '#fff' }]}>{w.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: C.border }]} onPress={() => { setPayModal({ visible: false, debtId: null }); setPayForm({ amount: '', walletId: null }); }}>
                <Text style={[styles.cancelText, { color: C.textSecondary }]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: C.primary }]} onPress={handlePay}><Text style={styles.saveBtnText}>Thanh toán</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 52, paddingBottom: 14, paddingHorizontal: SIZES.lg, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  filterRow: { flexDirection: 'row', padding: SIZES.md, gap: SIZES.sm },
  filterBtn: { flex: 1, padding: SIZES.sm, borderRadius: SIZES.radiusSm, borderWidth: 1, alignItems: 'center' },
  filterText: { fontWeight: '600', fontSize: 13 },
  filterText: { fontWeight: '600', fontSize: 13 },
  pickerLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.xs, marginBottom: SIZES.sm },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, marginRight: SIZES.xs },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600' },
  list: { padding: SIZES.md },
  card: { borderRadius: SIZES.radius, padding: SIZES.md, marginBottom: SIZES.sm, ...SHADOWS.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  personName: { ...FONTS.bold },
  debtType: { ...FONTS.small },
  debtAmount: { ...FONTS.bold },
  dueDate: { ...FONTS.small, marginTop: 2 },
  progressBg: { height: 6, borderRadius: 3, marginTop: SIZES.sm },
  progressBar: { height: 6, borderRadius: 3 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SIZES.sm },
  paidText: { ...FONTS.small },
  payBtn: { paddingHorizontal: SIZES.md, paddingVertical: SIZES.xs, borderRadius: SIZES.radiusSm },
  payBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  overdueBadge: { flexDirection: 'row', alignItems: 'center', marginTop: SIZES.xs, gap: 4 },
  overdueText: { color: COLORS.error, fontSize: 12, fontWeight: '600' },
  empty: { ...FONTS.regular, textAlign: 'center', marginTop: SIZES.xxl },
  fab: { position: 'absolute', bottom: SIZES.lg, right: SIZES.lg, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', ...SHADOWS.md },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: SIZES.radiusLg, borderTopRightRadius: SIZES.radiusLg, padding: SIZES.lg, maxHeight: '80%' },
  modalTitle: { ...FONTS.title, textAlign: 'center', marginBottom: SIZES.md },
  typeRow: { flexDirection: 'row', gap: SIZES.sm, marginBottom: SIZES.md },
  typeBtn: { flex: 1, padding: SIZES.sm, borderRadius: SIZES.radiusSm, borderWidth: 1, alignItems: 'center' },
  typeBtnText: { fontWeight: '600' },
  input: { borderRadius: SIZES.radiusSm, padding: SIZES.md, fontSize: 16, marginBottom: SIZES.sm, borderWidth: 1 },
  modalActions: { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.md },
  cancelBtn: { flex: 1, padding: SIZES.md, borderRadius: SIZES.radiusSm, borderWidth: 1, alignItems: 'center' },
  cancelText: { fontWeight: '600' },
  saveBtn: { flex: 1, padding: SIZES.md, borderRadius: SIZES.radiusSm, alignItems: 'center' },
  saveBtnText: { color: COLORS.white, fontWeight: '700' },
});
