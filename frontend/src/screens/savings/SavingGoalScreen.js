import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
  Modal, TextInput, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { savingGoalApi } from '../../api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { useTheme } from '../../contexts/ThemeContext';

export default function SavingGoalScreen() {
  const { colors } = useTheme();
  const C = colors || COLORS;
  const [goals, setGoals] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionModal, setActionModal] = useState({ visible: false, goalId: null, action: 'deposit' });
  const [form, setForm] = useState({ name: '', targetAmount: '', icon: '🎯', color: '#FF9800', targetDate: '' });
  const [actionAmount, setActionAmount] = useState('');

  const loadData = async () => {
    try {
      const res = await savingGoalApi.getAll();
      setGoals(res.data || []);
    } catch (err) { console.error('SavingGoal load error:', err); }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.targetAmount) { Alert.alert('Lỗi', 'Nhập đầy đủ'); return; }
    try {
      await savingGoalApi.create({
        name: form.name.trim(), targetAmount: parseFloat(form.targetAmount),
        icon: form.icon, color: form.color, targetDate: form.targetDate || null,
      });
      setModalVisible(false);
      setForm({ name: '', targetAmount: '', icon: '🎯', color: '#FF9800', targetDate: '' });
      loadData();
    } catch (err) { Alert.alert('Lỗi', err.message || 'Không thể tạo'); }
  };

  const handleAction = async () => {
    if (!actionAmount) { Alert.alert('Lỗi', 'Nhập số tiền'); return; }
    try {
      const amount = parseFloat(actionAmount);
      if (actionModal.action === 'deposit') {
        await savingGoalApi.deposit(actionModal.goalId, amount);
      } else {
        await savingGoalApi.withdraw(actionModal.goalId, amount);
      }
      setActionModal({ visible: false, goalId: null, action: 'deposit' });
      setActionAmount('');
      loadData();
    } catch (err) { Alert.alert('Lỗi', err.message || 'Thất bại'); }
  };

  const handleDelete = (id) => {
    Alert.alert('Xác nhận', 'Xóa mục tiêu này?', [
      { text: 'Hủy' },
      { text: 'Xóa', style: 'destructive', onPress: async () => { try { await savingGoalApi.delete(id); loadData(); } catch (e) { Alert.alert('Lỗi', 'Không thể xóa'); } } },
    ]);
  };

  const renderGoal = ({ item }) => {
    const pct = item.progressPercentage || 0;
    return (
      <TouchableOpacity style={[styles.card, { backgroundColor: C.surface }]} onLongPress={() => handleDelete(item.id)}>
        <View style={styles.cardHeader}>
          <Text style={styles.goalIcon}>{item.icon || '🎯'}</Text>
          <View style={{ flex: 1, marginLeft: SIZES.sm }}>
            <Text style={[styles.goalName, { color: C.text }]}>{item.name}</Text>
            {item.targetDate && <Text style={[styles.targetDate, { color: C.textLight }]}>Mục tiêu: {formatDate(item.targetDate)}</Text>}
          </View>
          {item.achieved && (
            <View style={styles.achievedBadge}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            </View>
          )}
        </View>
        <View style={[styles.progressBg, { backgroundColor: C.border }]}>
          <View style={[styles.progressBar, { width: `${Math.min(pct, 100)}%`, backgroundColor: item.color || C.primary }]} />
        </View>
        <View style={styles.cardFooter}>
          <Text style={[styles.currentAmount, { color: C.primary }]}>{formatCurrency(item.currentAmount)}</Text>
          <Text style={[styles.targetAmount, { color: C.textSecondary }]}>/ {formatCurrency(item.targetAmount)}</Text>
          <Text style={[styles.pctText, { color: C.primary }]}>{pct.toFixed(0)}%</Text>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.depositBtn, { backgroundColor: C.income }]}
            onPress={() => setActionModal({ visible: true, goalId: item.id, action: 'deposit' })}>
            <Ionicons name="add-circle" size={16} color={COLORS.white} />
            <Text style={styles.actionBtnText}>Nạp tiền</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.withdrawBtn, { backgroundColor: C.expense }]}
            onPress={() => setActionModal({ visible: true, goalId: item.id, action: 'withdraw' })}>
            <Ionicons name="remove-circle" size={16} color={COLORS.white} />
            <Text style={styles.actionBtnText}>Rút tiền</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <Text style={[styles.headerTitle, { color: C.text }]}>Mục tiêu tiết kiệm</Text>
      </View>

      <FlatList
        data={goals}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderGoal}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
        ListEmptyComponent={<Text style={[styles.empty, { color: C.textSecondary }]}>Chưa có mục tiêu nào</Text>}
      />

      <TouchableOpacity style={[styles.fab, { backgroundColor: C.primary }]} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>

      {/* Create Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: C.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: C.surface }]}>
            <Text style={[styles.modalTitle, { color: C.text }]}>Thêm mục tiêu</Text>
            <TextInput style={[styles.input, { backgroundColor: C.background, color: C.text, borderColor: C.border }]} placeholder="Tên mục tiêu *" placeholderTextColor={C.textLight}
              value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} />
            <TextInput style={[styles.input, { backgroundColor: C.background, color: C.text, borderColor: C.border }]} placeholder="Số tiền mục tiêu *" placeholderTextColor={C.textLight}
              keyboardType="numeric" value={form.targetAmount} onChangeText={(v) => setForm((p) => ({ ...p, targetAmount: v }))} />
            <TextInput style={[styles.input, { backgroundColor: C.background, color: C.text, borderColor: C.border }]} placeholder="Ngày mục tiêu (YYYY-MM-DD)" placeholderTextColor={C.textLight}
              value={form.targetDate} onChangeText={(v) => setForm((p) => ({ ...p, targetDate: v }))} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: C.border }]} onPress={() => setModalVisible(false)}><Text style={[styles.cancelText, { color: C.textSecondary }]}>Hủy</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: C.primary }]} onPress={handleCreate}><Text style={styles.saveBtnText}>Lưu</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Deposit/Withdraw Modal */}
      <Modal visible={actionModal.visible} animationType="fade" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: C.overlay }]}>
          <View style={[styles.modalContent, { maxHeight: '35%', backgroundColor: C.surface }]}>
            <Text style={[styles.modalTitle, { color: C.text }]}>{actionModal.action === 'deposit' ? 'Nạp tiền' : 'Rút tiền'}</Text>
            <TextInput style={[styles.input, { backgroundColor: C.background, color: C.text, borderColor: C.border }]} placeholder="Số tiền *" placeholderTextColor={C.textLight}
              keyboardType="numeric" value={actionAmount} onChangeText={setActionAmount} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: C.border }]} onPress={() => { setActionModal({ visible: false, goalId: null, action: 'deposit' }); setActionAmount(''); }}>
                <Text style={[styles.cancelText, { color: C.textSecondary }]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: C.primary }]} onPress={handleAction}>
                <Text style={styles.saveBtnText}>{actionModal.action === 'deposit' ? 'Nạp' : 'Rút'}</Text>
              </TouchableOpacity>
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
  list: { padding: SIZES.md },
  card: { borderRadius: SIZES.radius, padding: SIZES.md, marginBottom: SIZES.sm, ...SHADOWS.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  goalIcon: { fontSize: 28 },
  goalName: { ...FONTS.bold },
  targetDate: { ...FONTS.small, marginTop: 2 },
  achievedBadge: { marginLeft: SIZES.sm },
  progressBg: { height: 8, borderRadius: 4, marginTop: SIZES.sm },
  progressBar: { height: 8, borderRadius: 4 },
  cardFooter: { flexDirection: 'row', alignItems: 'baseline', marginTop: SIZES.sm, gap: SIZES.xs },
  currentAmount: { ...FONTS.bold },
  targetAmount: { ...FONTS.small },
  pctText: { marginLeft: 'auto', ...FONTS.bold },
  actionRow: { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.sm },
  depositBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SIZES.sm, borderRadius: SIZES.radiusSm, gap: 4 },
  withdrawBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SIZES.sm, borderRadius: SIZES.radiusSm, gap: 4 },
  actionBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 13 },
  empty: { ...FONTS.regular, textAlign: 'center', marginTop: SIZES.xxl },
  fab: { position: 'absolute', bottom: SIZES.lg, right: SIZES.lg, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', ...SHADOWS.md },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: SIZES.radiusLg, borderTopRightRadius: SIZES.radiusLg, padding: SIZES.lg, maxHeight: '70%' },
  modalTitle: { ...FONTS.title, textAlign: 'center', marginBottom: SIZES.md },
  input: { borderRadius: SIZES.radiusSm, padding: SIZES.md, fontSize: 16, marginBottom: SIZES.sm, borderWidth: 1 },
  modalActions: { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.md },
  cancelBtn: { flex: 1, padding: SIZES.md, borderRadius: SIZES.radiusSm, borderWidth: 1, alignItems: 'center' },
  cancelText: { fontWeight: '600' },
  saveBtn: { flex: 1, padding: SIZES.md, borderRadius: SIZES.radiusSm, alignItems: 'center' },
  saveBtnText: { color: COLORS.white, fontWeight: '700' },
});
