import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
  Modal, TextInput, RefreshControl, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { recurringApi, categoryApi, walletApi } from '../../api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { useTheme } from '../../contexts/ThemeContext';

const FREQ_LABELS = { DAILY: 'Hàng ngày', WEEKLY: 'Hàng tuần', MONTHLY: 'Hàng tháng', YEARLY: 'Hàng năm' };
const FREQ_ICONS = { DAILY: 'today-outline', WEEKLY: 'calendar-outline', MONTHLY: 'calendar-number-outline', YEARLY: 'time-outline' };

export default function RecurringScreen() {
  const { colors } = useTheme();
  const C = colors || COLORS;

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    amount: '', type: 'EXPENSE', note: '', frequency: 'MONTHLY',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    categoryId: null, walletId: null,
  });

  const loadData = async () => {
    try {
      const [recRes, catRes, walRes] = await Promise.all([
        recurringApi.getAll(), categoryApi.getAll(), walletApi.getAll(),
      ]);
      setItems(recRes.data || []);
      setCategories(catRes.data || []);
      setWallets(walRes.data || []);
    } catch (err) { console.error('Recurring load error:', err); }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleCreate = async () => {
    if (!form.amount || !form.categoryId || !form.walletId) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }
    try {
      await recurringApi.create({
        amount: parseFloat(form.amount), type: form.type, note: form.note,
        frequency: form.frequency, startDate: form.startDate,
        endDate: form.endDate || null, categoryId: form.categoryId, walletId: form.walletId,
      });
      setModalVisible(false);
      setForm({
        amount: '', type: 'EXPENSE', note: '', frequency: 'MONTHLY',
        startDate: new Date().toISOString().split('T')[0], endDate: '',
        categoryId: null, walletId: null,
      });
      loadData();
    } catch (err) { Alert.alert('Lỗi', err.message || 'Không thể tạo'); }
  };

  const handleDeactivate = (id) => {
    Alert.alert('Xác nhận', 'Tắt giao dịch định kỳ này?', [
      { text: 'Hủy' },
      { text: 'Tắt', style: 'destructive', onPress: async () => { try { await recurringApi.deactivate(id); loadData(); } catch (e) { Alert.alert('Lỗi', 'Thất bại'); } } },
    ]);
  };

  const filteredCategories = categories.filter((c) => c.type === form.type);

  const renderItem = ({ item }) => {
    const isIncome = item.type === 'INCOME';
    const amountColor = isIncome ? C.income : C.expense;
    const bgColor = isIncome ? C.incomeBg : C.expenseBg;
    return (
      <View style={st(C).card}>
        <View style={st(C).cardLeft}>
          <View style={[st(C).typeBadge, { backgroundColor: bgColor }]}>
            <Ionicons name={isIncome ? 'arrow-down-circle' : 'arrow-up-circle'} size={22} color={amountColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st(C).itemNote}>{item.note || (isIncome ? 'Thu nhập định kỳ' : 'Chi tiêu định kỳ')}</Text>
            <View style={st(C).freqRow}>
              <Ionicons name={FREQ_ICONS[item.frequency] || 'repeat'} size={12} color={C.textSecondary} />
              <Text style={st(C).itemFreq}>{FREQ_LABELS[item.frequency] || item.frequency}</Text>
            </View>
            <Text style={st(C).nextDate}>Tiếp theo: {formatDate(item.nextExecutionDate)}</Text>
            {item.endDate && (
              <Text style={st(C).endDateText}>Kết thúc: {formatDate(item.endDate)}</Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text style={[st(C).itemAmount, { color: amountColor }]}>
              {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
            </Text>
            {item.active ? (
              <TouchableOpacity onPress={() => handleDeactivate(item.id)} style={[st(C).statusBadge, { backgroundColor: C.incomeBg }]}>
                <View style={[st(C).statusDot, { backgroundColor: C.income }]} />
                <Text style={[st(C).statusText, { color: C.income }]}>Đang chạy</Text>
              </TouchableOpacity>
            ) : (
              <View style={[st(C).statusBadge, { backgroundColor: C.border }]}>
                <View style={[st(C).statusDot, { backgroundColor: C.textLight }]} />
                <Text style={[st(C).statusText, { color: C.textLight }]}>Đã tắt</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const activeCount = items.filter(i => i.active).length;
  const totalMonthly = items.filter(i => i.active && i.frequency === 'MONTHLY' && i.type === 'EXPENSE')
    .reduce((s, i) => s + (i.amount || 0), 0);

  const styles = st(C);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Giao dịch định kỳ</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Đang hoạt động</Text>
          <Text style={[styles.summaryValue, { color: C.primary }]}>{activeCount}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Chi hàng tháng</Text>
          <Text style={[styles.summaryValue, { color: C.expense }]}>{formatCurrency(totalMonthly)}</Text>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} tintColor={C.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="repeat-outline" size={52} color={C.textLight} />
            <Text style={styles.empty}>Chưa có giao dịch định kỳ</Text>
            <Text style={styles.emptyHint}>Thêm để tự động ghi nhận thu chi định kỳ</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>🔄 Thêm giao dịch định kỳ</Text>

              <View style={styles.typeRow}>
                {[
                  { key: 'EXPENSE', label: '💸 Chi tiêu', color: C.expense },
                  { key: 'INCOME', label: '💰 Thu nhập', color: C.income },
                ].map((t) => (
                  <TouchableOpacity key={t.key}
                    style={[styles.typeBtn, form.type === t.key && { backgroundColor: t.color, borderColor: t.color }]}
                    onPress={() => setForm((p) => ({ ...p, type: t.key, categoryId: null }))}>
                    <Text style={[styles.typeBtnText, form.type === t.key && { color: '#fff' }]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.amountWrap}>
                <TextInput style={styles.amountInput} placeholder="0"
                  placeholderTextColor={C.textLight}
                  keyboardType="numeric" value={form.amount}
                  onChangeText={(v) => setForm((p) => ({ ...p, amount: v }))} />
                <Text style={styles.amountCurrency}>đ</Text>
              </View>

              <TextInput style={styles.input} placeholder="Ghi chú" placeholderTextColor={C.textLight}
                value={form.note} onChangeText={(v) => setForm((p) => ({ ...p, note: v }))} />

              <Text style={styles.pickerLabel}>Tần suất</Text>
              <View style={styles.chipWrap}>
                {Object.entries(FREQ_LABELS).map(([k, v]) => (
                  <TouchableOpacity key={k} style={[styles.chip, form.frequency === k && styles.chipActive]}
                    onPress={() => setForm((p) => ({ ...p, frequency: k }))}>
                    <Ionicons name={FREQ_ICONS[k]} size={13} color={form.frequency === k ? '#fff' : C.textSecondary} />
                    <Text style={[styles.chipText, form.frequency === k && { color: '#fff' }]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.pickerLabel}>Ngày bắt đầu</Text>
              <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor={C.textLight}
                value={form.startDate} onChangeText={(v) => setForm((p) => ({ ...p, startDate: v }))} />

              <Text style={styles.pickerLabel}>Ngày kết thúc (tùy chọn)</Text>
              <TextInput style={styles.input} placeholder="YYYY-MM-DD (để trống nếu không có)" placeholderTextColor={C.textLight}
                value={form.endDate} onChangeText={(v) => setForm((p) => ({ ...p, endDate: v }))} />

              <Text style={styles.pickerLabel}>Ví</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SIZES.sm }}>
                {wallets.map((w) => (
                  <TouchableOpacity key={w.id} style={[styles.chip, form.walletId === w.id && styles.chipActive]}
                    onPress={() => setForm((p) => ({ ...p, walletId: w.id }))}>
                    <Text style={[styles.chipText, form.walletId === w.id && { color: '#fff' }]}>{w.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.pickerLabel}>Danh mục</Text>
              <View style={styles.chipWrap}>
                {filteredCategories.map((c) => (
                  <TouchableOpacity key={c.id} style={[styles.chip, form.categoryId === c.id && styles.chipActive]}
                    onPress={() => setForm((p) => ({ ...p, categoryId: c.id }))}>
                    <Text style={[styles.chipText, form.categoryId === c.id && { color: '#fff' }]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}>
                  <Text style={styles.saveBtnText}>Lưu</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = (C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: SIZES.md,
    backgroundColor: C.surface, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { color: C.text, fontSize: 20, fontWeight: '800' },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },

  summaryRow: { flexDirection: 'row', gap: SIZES.sm, padding: SIZES.md },
  summaryCard: {
    flex: 1, backgroundColor: C.surface, borderRadius: SIZES.radius,
    padding: SIZES.md, ...SHADOWS.sm, alignItems: 'center',
  },
  summaryLabel: { color: C.textSecondary, fontSize: 12, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '800' },

  list: { padding: SIZES.md, paddingBottom: 100 },
  card: {
    backgroundColor: C.surface, borderRadius: SIZES.radius, padding: SIZES.md,
    marginBottom: SIZES.sm, ...SHADOWS.sm,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: SIZES.sm },
  typeBadge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  itemNote: { color: C.text, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  freqRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  itemFreq: { color: C.textSecondary, fontSize: 12 },
  itemAmount: { fontSize: 15, fontWeight: '800' },
  nextDate: { color: C.textLight, fontSize: 11, marginTop: 2 },
  endDateText: { color: C.warning, fontSize: 11, marginTop: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },

  emptyContainer: { alignItems: 'center', paddingVertical: SIZES.xxl, gap: SIZES.sm },
  empty: { color: C.textSecondary, fontSize: 15, fontWeight: '600' },
  emptyHint: { color: C.textLight, fontSize: 13, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: C.surface, borderTopLeftRadius: SIZES.radiusLg,
    borderTopRightRadius: SIZES.radiusLg, padding: SIZES.lg, maxHeight: '90%',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: SIZES.md },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.text, textAlign: 'center', marginBottom: SIZES.md },
  typeRow: { flexDirection: 'row', gap: SIZES.sm, marginBottom: SIZES.md },
  typeBtn: {
    flex: 1, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusSm,
    borderWidth: 1.5, borderColor: C.border, alignItems: 'center',
  },
  typeBtnText: { fontWeight: '700', color: C.textSecondary },
  amountWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.primaryBg,
    borderRadius: SIZES.radius, padding: SIZES.md, marginBottom: SIZES.sm,
  },
  amountInput: { flex: 1, fontSize: 26, fontWeight: '800', color: C.primary },
  amountCurrency: { fontSize: 18, fontWeight: '700', color: C.primary },
  input: {
    backgroundColor: C.background, borderRadius: SIZES.radiusSm,
    borderWidth: 1, borderColor: C.border, padding: SIZES.md,
    fontSize: 15, marginBottom: SIZES.sm, color: C.text,
  },
  pickerLabel: { color: C.text, fontSize: 13, fontWeight: '700', marginBottom: SIZES.xs, marginTop: SIZES.xs },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.xs, marginBottom: SIZES.sm },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5,
    borderColor: C.border, marginRight: SIZES.xs, marginBottom: SIZES.xs,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.text, fontWeight: '500' },
  modalActions: { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.md },
  cancelBtn: { flex: 1, padding: SIZES.md, borderRadius: SIZES.radius, borderWidth: 1.5, borderColor: C.border, alignItems: 'center' },
  cancelText: { color: C.textSecondary, fontWeight: '700', fontSize: 15 },
  saveBtn: { flex: 1, padding: SIZES.md, borderRadius: SIZES.radius, backgroundColor: C.primary, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
