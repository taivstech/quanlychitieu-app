import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
  Modal, TextInput, RefreshControl, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { billApi } from '../../api';
import { formatCurrency, formatDate, getCategoryIcon } from '../../utils/helpers';
import { useTheme } from '../../contexts/ThemeContext';

const FREQ_OPTIONS = [
  { key: 'DAILY', label: 'Hàng ngày' },
  { key: 'WEEKLY', label: 'Hàng tuần' },
  { key: 'MONTHLY', label: 'Hàng tháng' },
  { key: 'YEARLY', label: 'Hàng năm' },
];

const FREQ_LABEL = { DAILY: 'Hàng ngày', WEEKLY: 'Hàng tuần', MONTHLY: 'Hàng tháng', YEARLY: 'Hàng năm' };

export default function BillScreen() {
  const { colors } = useTheme();
  const C = colors || COLORS;
  const [bills, setBills] = useState([]);
  const [filter, setFilter] = useState('ACTIVE'); // ACTIVE, UPCOMING, ALL
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    name: '', amount: '', dueDate: '', frequency: 'MONTHLY', note: '',
  });

  const loadData = async () => {
    try {
      let res;
      if (filter === 'ACTIVE') res = await billApi.getActive();
      else if (filter === 'UPCOMING') res = await billApi.getUpcoming();
      else res = await billApi.getAll();
      setBills(res.data || []);
    } catch (err) { console.error('Bill load error:', err); }
  };

  useFocusEffect(useCallback(() => { loadData(); }, [filter]));

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.amount || !form.dueDate) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên, số tiền và ngày đến hạn');
      return;
    }
    try {
      await billApi.create({
        name: form.name.trim(),
        amount: parseFloat(form.amount),
        dueDate: form.dueDate,
        frequency: form.frequency,
        note: form.note,
      });
      setModalVisible(false);
      setForm({ name: '', amount: '', dueDate: '', frequency: 'MONTHLY', note: '' });
      loadData();
    } catch (err) { Alert.alert('Lỗi', err.message || 'Không thể tạo hoá đơn'); }
  };

  const handleMarkPaid = (id, name) => {
    Alert.alert('Thanh toán', `Đánh dấu "${name}" đã thanh toán?`, [
      { text: 'Hủy' },
      {
        text: 'Đã thanh toán', onPress: async () => {
          try { await billApi.markPaid(id); loadData(); }
          catch (e) { Alert.alert('Lỗi', 'Không thể cập nhật'); }
        }
      },
    ]);
  };

  const handleToggle = async (id) => {
    try { await billApi.toggle(id); loadData(); }
    catch (e) { Alert.alert('Lỗi', 'Không thể cập nhật'); }
  };

  const handleDelete = (id) => {
    Alert.alert('Xác nhận', 'Xóa hoá đơn này?', [
      { text: 'Hủy' },
      {
        text: 'Xóa', style: 'destructive',
        onPress: async () => {
          try { await billApi.delete(id); loadData(); }
          catch (e) { Alert.alert('Lỗi', 'Không thể xóa'); }
        }
      },
    ]);
  };

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  };

  const getDueBadge = (item) => {
    if (item.overdue) return { text: 'Quá hạn', color: COLORS.error };
    const days = getDaysUntilDue(item.dueDate);
    if (days === 0) return { text: 'Hôm nay', color: COLORS.warning };
    if (days === 1) return { text: 'Ngày mai', color: COLORS.warning };
    if (days <= 3) return { text: `Còn ${days} ngày`, color: '#FFA726' };
    if (days <= 7) return { text: `Còn ${days} ngày`, color: COLORS.textSecondary };
    return null;
  };

  const renderBill = ({ item }) => {
    const badge = getDueBadge(item);
    return (
      <TouchableOpacity
        style={[styles.card, item.overdue && styles.cardOverdue, !item.active && styles.cardInactive]}
        onLongPress={() => handleDelete(item.id)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <View style={[styles.iconCircle, item.overdue && { backgroundColor: COLORS.error + '20' }]}>
              <Ionicons
                name={getCategoryIcon(item.categoryIcon)}
                size={22}
                color={item.overdue ? COLORS.error : COLORS.primary}
              />
            </View>
            <View style={{ marginLeft: SIZES.sm, flex: 1 }}>
              <Text style={[styles.billName, !item.active && { color: COLORS.textLight }]}>{item.name}</Text>
              <Text style={styles.freq}>{FREQ_LABEL[item.frequency] || item.frequency}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.billAmount, item.overdue && { color: COLORS.error }]}>
              {formatCurrency(item.amount)}
            </Text>
            <Text style={[styles.dueDate, item.overdue && { color: COLORS.error }]}>
              Hạn: {formatDate(item.dueDate)}
            </Text>
          </View>
        </View>

        {badge && (
          <View style={[styles.badge, { backgroundColor: badge.color + '20' }]}>
            {item.overdue && <Ionicons name="warning" size={14} color={badge.color} />}
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
          </View>
        )}

        {item.note ? <Text style={styles.note} numberOfLines={1}>{item.note}</Text> : null}

        <View style={styles.cardActions}>
          {item.active && (
            <TouchableOpacity style={styles.paidBtn} onPress={() => handleMarkPaid(item.id, item.name)}>
              <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.white} />
              <Text style={styles.paidBtnText}>Đã thanh toán</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.toggleBtn} onPress={() => handleToggle(item.id)}>
            <Ionicons name={item.active ? 'pause-circle-outline' : 'play-circle-outline'} size={16} color={COLORS.textSecondary} />
            <Text style={styles.toggleText}>{item.active ? 'Tạm dừng' : 'Kích hoạt'}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Summary stats
  const overdueBills = bills.filter(b => b.overdue);
  const totalAmount = bills.filter(b => b.active).reduce((s, b) => s + (b.amount || 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <Text style={[styles.headerTitle, { color: C.text }]}>🧾 Hóa đơn</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={[styles.addBillBtn, { backgroundColor: C.primary }]}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Tổng hàng tháng</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalAmount)}</Text>
        </View>
        {overdueBills.length > 0 && (
          <View style={[styles.summaryCard, { borderColor: COLORS.error }]}>
            <Text style={[styles.summaryLabel, { color: COLORS.error }]}>Quá hạn</Text>
            <Text style={[styles.summaryValue, { color: COLORS.error }]}>{overdueBills.length}</Text>
          </View>
        )}
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {[
          { key: 'ACTIVE', label: 'Đang hoạt động' },
          { key: 'UPCOMING', label: 'Sắp đến hạn' },
          { key: 'ALL', label: 'Tất cả' },
        ].map((f) => (
          <TouchableOpacity key={f.key} style={[styles.filterBtn, filter === f.key && styles.filterActive]}
            onPress={() => setFilter(f.key)}>
            <Text style={[styles.filterText, filter === f.key && { color: COLORS.white }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={bills}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderBill}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.empty}>Chưa có hoá đơn nào</Text>
            <Text style={styles.emptyHint}>Thêm hoá đơn định kỳ để theo dõi chi phí</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>

      {/* Create Bill Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Thêm hoá đơn</Text>

              <TextInput
                style={styles.input}
                placeholder="Tên hoá đơn *"
                placeholderTextColor={COLORS.textLight}
                value={form.name}
                onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Số tiền *"
                placeholderTextColor={COLORS.textLight}
                keyboardType="numeric"
                value={form.amount}
                onChangeText={(v) => setForm((p) => ({ ...p, amount: v }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Ngày đến hạn * (YYYY-MM-DD)"
                placeholderTextColor={COLORS.textLight}
                value={form.dueDate}
                onChangeText={(v) => setForm((p) => ({ ...p, dueDate: v }))}
              />

              {/* Frequency picker */}
              <Text style={styles.inputLabel}>Tần suất</Text>
              <View style={styles.freqRow}>
                {FREQ_OPTIONS.map((f) => (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.freqBtn, form.frequency === f.key && styles.freqBtnActive]}
                    onPress={() => setForm((p) => ({ ...p, frequency: f.key }))}
                  >
                    <Text style={[styles.freqText, form.frequency === f.key && { color: COLORS.white }]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Ghi chú"
                placeholderTextColor={COLORS.textLight}
                value={form.note}
                onChangeText={(v) => setForm((p) => ({ ...p, note: v }))}
              />

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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: SIZES.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  addBillBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  // Summary
  summaryRow: { flexDirection: 'row', paddingHorizontal: SIZES.md, gap: SIZES.sm, marginBottom: SIZES.xs },
  summaryCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: SIZES.radius, padding: SIZES.md,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  summaryLabel: { ...FONTS.small, marginBottom: 4 },
  summaryValue: { ...FONTS.bold, fontSize: 16 },

  // Filters
  filterRow: { flexDirection: 'row', padding: SIZES.md, gap: SIZES.sm },
  filterBtn: {
    flex: 1, padding: SIZES.sm, borderRadius: SIZES.radiusSm,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  filterActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontWeight: '600', color: COLORS.text, fontSize: 12 },

  // List
  list: { padding: SIZES.md, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius, padding: SIZES.md,
    marginBottom: SIZES.sm, ...SHADOWS.sm,
  },
  cardOverdue: { borderLeftWidth: 3, borderLeftColor: COLORS.error },
  cardInactive: { opacity: 0.5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  billName: { ...FONTS.bold, fontSize: 15 },
  freq: { ...FONTS.small, marginTop: 2 },
  billAmount: { ...FONTS.bold, fontSize: 15 },
  dueDate: { ...FONTS.small, marginTop: 2 },

  // Badge
  badge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    paddingHorizontal: SIZES.sm, paddingVertical: 3, borderRadius: SIZES.radiusSm,
    marginTop: SIZES.sm, gap: 4,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },

  note: { ...FONTS.small, color: COLORS.textLight, marginTop: SIZES.xs },

  // Actions
  cardActions: { flexDirection: 'row', marginTop: SIZES.sm, gap: SIZES.sm },
  paidBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary, paddingHorizontal: SIZES.md, paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusSm,
  },
  paidBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  toggleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusSm, borderWidth: 1, borderColor: COLORS.border,
  },
  toggleText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },

  // Empty
  emptyContainer: { alignItems: 'center', marginTop: SIZES.xxl },
  empty: { ...FONTS.regular, color: COLORS.textSecondary, textAlign: 'center', marginTop: SIZES.md },
  emptyHint: { ...FONTS.small, color: COLORS.textLight, textAlign: 'center', marginTop: SIZES.xs },

  // FAB
  fab: {
    position: 'absolute', bottom: SIZES.lg, right: SIZES.lg,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOWS.md,
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: SIZES.radiusLg,
    borderTopRightRadius: SIZES.radiusLg, padding: SIZES.lg, maxHeight: '80%',
  },
  modalTitle: { ...FONTS.title, textAlign: 'center', marginBottom: SIZES.md },
  inputLabel: { ...FONTS.small, color: COLORS.textSecondary, marginBottom: SIZES.xs, marginTop: SIZES.xs },
  input: {
    backgroundColor: COLORS.background, borderRadius: SIZES.radiusSm, padding: SIZES.md,
    fontSize: 16, marginBottom: SIZES.sm, color: COLORS.text,
  },
  freqRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.xs, marginBottom: SIZES.sm },
  freqBtn: {
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.xs, borderRadius: SIZES.radiusSm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  freqBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  freqText: { fontWeight: '600', color: COLORS.text, fontSize: 13 },
  modalActions: { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.md },
  cancelBtn: {
    flex: 1, padding: SIZES.md, borderRadius: SIZES.radiusSm,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  cancelText: { color: COLORS.textSecondary, fontWeight: '600' },
  saveBtn: {
    flex: 1, padding: SIZES.md, borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.primary, alignItems: 'center',
  },
  saveBtnText: { color: COLORS.white, fontWeight: '700' },
});
