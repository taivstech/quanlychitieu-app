import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
  Modal, TextInput, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { budgetApi, categoryApi } from '../../api';
import { formatCurrency, getCurrentMonth, getCurrentYear } from '../../utils/helpers';
import { useTheme } from '../../contexts/ThemeContext';

export default function BudgetScreen() {
  const { colors } = useTheme();
  const C = colors || COLORS;
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [month, setMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(getCurrentYear());
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ amountLimit: '', categoryId: null });

  const loadData = async () => {
    try {
      const [budRes, catRes] = await Promise.all([
        budgetApi.getByMonth(month, year),
        categoryApi.getByType('EXPENSE'),
      ]);
      setBudgets(budRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) { console.error('Budget load error:', err); }
  };

  useFocusEffect(useCallback(() => { loadData(); }, [month, year]));

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleCreate = async () => {
    if (!form.amountLimit || !form.categoryId) { Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ'); return; }
    try {
      await budgetApi.create({ amountLimit: parseFloat(form.amountLimit), categoryId: form.categoryId, month, year });
      setModalVisible(false);
      setForm({ amountLimit: '', categoryId: null });
      loadData();
    } catch (err) { Alert.alert('Lỗi', err.message || 'Không thể tạo ngân sách'); }
  };

  const handleDelete = (id) => {
    Alert.alert('Xác nhận', 'Xóa ngân sách này?', [
      { text: 'Hủy' },
      { text: 'Xóa', style: 'destructive', onPress: async () => { try { await budgetApi.delete(id); loadData(); } catch (e) { Alert.alert('Lỗi', 'Không thể xóa'); } } },
    ]);
  };

  const renderBudget = ({ item }) => {
    const pct = item.usagePercentage || 0;
    const barColor = pct >= 100 ? COLORS.error : pct >= 80 ? COLORS.warning : COLORS.primary;
    return (
      <TouchableOpacity style={styles.budgetCard} onLongPress={() => handleDelete(item.id)}>
        <View style={styles.budgetHeader}>
          <View style={[styles.catDot, { backgroundColor: item.categoryColor || COLORS.gray }]} />
          <Text style={styles.budgetCategory}>{item.categoryName}</Text>
          <Text style={[styles.budgetPct, { color: barColor }]}>{pct.toFixed(0)}%</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressBar, { width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }]} />
        </View>
        <View style={styles.budgetFooter}>
          <Text style={styles.budgetSpent}>Đã chi: {formatCurrency(item.spentAmount)}</Text>
          <Text style={styles.budgetLimit}>Hạn mức: {formatCurrency(item.amountLimit)}</Text>
        </View>
        {item.overBudget && (
          <View style={styles.overBadge}>
            <Ionicons name="warning" size={14} color={COLORS.error} />
            <Text style={styles.overText}>Vượt ngân sách!</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <Text style={[styles.headerTitle, { color: C.text }]}>📊 Ngân sách</Text>
      </View>

      {/* Month/Year nav */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => { if (month === 1) { setMonth(12); setYear(year - 1); } else setMonth(month - 1); }}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.monthText}>Tháng {month}/{year}</Text>
        <TouchableOpacity onPress={() => { if (month === 12) { setMonth(1); setYear(year + 1); } else setMonth(month + 1); }}>
          <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={budgets}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderBudget}
        contentContainerStyle={budgets.length === 0 ? styles.emptyList : styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={80} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>Bạn chưa có ngân sách</Text>
            <Text style={styles.emptySubtitle}>
              Bắt đầu tiết kiệm bằng cách tạo ngân sách cho các khoản chi tiêu của bạn
            </Text>
            <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.createBtnText}>TẠO NGÂN SÁCH</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {budgets.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thêm ngân sách</Text>
            <Text style={styles.monthLabel}>Tháng {month}/{year}</Text>
            <TextInput style={styles.input} placeholder="Hạn mức (VND) *" placeholderTextColor={COLORS.textLight}
              keyboardType="numeric" value={form.amountLimit} onChangeText={(v) => setForm((p) => ({ ...p, amountLimit: v }))} />
            <Text style={styles.pickerLabel}>Danh mục chi tiêu</Text>
            <View style={styles.chipWrap}>
              {categories.map((c) => (
                <TouchableOpacity key={c.id} style={[styles.chip, form.categoryId === c.id && styles.chipActive]}
                  onPress={() => setForm((p) => ({ ...p, categoryId: c.id }))}>
                  <Text style={[styles.chipText, form.categoryId === c.id && { color: COLORS.white }]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={styles.cancelText}>Hủy</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}><Text style={styles.saveBtnText}>Lưu</Text></TouchableOpacity>
            </View>
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
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SIZES.md, backgroundColor: COLORS.surface },
  monthText: { ...FONTS.bold },
  list: { padding: SIZES.md },
  emptyList: { flex: 1, justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', paddingHorizontal: SIZES.xl },
  emptyTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginTop: SIZES.lg },
  emptySubtitle: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginTop: SIZES.sm, lineHeight: 20 },
  createBtn: {
    backgroundColor: COLORS.primary, borderRadius: SIZES.radiusSm,
    paddingHorizontal: 40, paddingVertical: 14, marginTop: SIZES.xl,
  },
  createBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  budgetCard: { backgroundColor: COLORS.surface, borderRadius: SIZES.radius, padding: SIZES.md, marginBottom: SIZES.sm, ...SHADOWS.sm },
  budgetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.sm },
  catDot: { width: 12, height: 12, borderRadius: 6, marginRight: SIZES.sm },
  budgetCategory: { flex: 1, ...FONTS.medium },
  budgetPct: { ...FONTS.bold },
  progressBg: { height: 8, backgroundColor: COLORS.border, borderRadius: 4 },
  progressBar: { height: 8, borderRadius: 4 },
  budgetFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SIZES.sm },
  budgetSpent: { ...FONTS.small },
  budgetLimit: { ...FONTS.small },
  overBadge: { flexDirection: 'row', alignItems: 'center', marginTop: SIZES.xs, gap: 4 },
  overText: { color: COLORS.error, fontSize: 12, fontWeight: '600' },
  empty: { ...FONTS.regular, color: COLORS.textSecondary, textAlign: 'center', marginTop: SIZES.xxl },
  fab: { position: 'absolute', bottom: SIZES.lg, right: SIZES.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOWS.md },
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: SIZES.radiusLg, borderTopRightRadius: SIZES.radiusLg, padding: SIZES.lg, maxHeight: '80%' },
  modalTitle: { ...FONTS.title, textAlign: 'center', marginBottom: SIZES.sm },
  monthLabel: { ...FONTS.medium, textAlign: 'center', color: COLORS.primary, marginBottom: SIZES.md },
  input: { backgroundColor: COLORS.background, borderRadius: SIZES.radiusSm, padding: SIZES.md, fontSize: 16, marginBottom: SIZES.sm, color: COLORS.text },
  pickerLabel: { ...FONTS.medium, marginBottom: SIZES.xs },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.xs, marginBottom: SIZES.sm },
  chip: { paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border, marginRight: SIZES.xs, marginBottom: SIZES.xs },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.text },
  modalActions: { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.md },
  cancelBtn: { flex: 1, padding: SIZES.md, borderRadius: SIZES.radiusSm, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelText: { color: COLORS.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1, padding: SIZES.md, borderRadius: SIZES.radiusSm, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveBtnText: { color: COLORS.white, fontWeight: '700' },
});
