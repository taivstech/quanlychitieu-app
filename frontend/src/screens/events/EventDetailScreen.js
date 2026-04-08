import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, TextInput, ScrollView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SIZES, SHADOWS, WALLET_COLORS } from '../../constants/theme';
import { eventApi, transactionApi, categoryApi, walletApi } from '../../api';
import { formatCurrency, formatDate, getCategoryIcon } from '../../utils/helpers';
import { useTheme } from '../../contexts/ThemeContext';

export default function EventDetailScreen({ route, navigation }) {
  const { event: passedEvent } = route.params;
  const { colors } = useTheme();
  const C = colors || COLORS;

  const [eventData, setEventData] = useState(passedEvent);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wallets, setWallets] = useState([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  // Form
  const [form, setForm] = useState({
    amount: '', type: 'EXPENSE', note: '', 
    transactionDate: new Date().toISOString().split('T')[0],
    categoryId: null, walletId: null
  });

  const loadData = async () => {
    try {
      const [txRes, catRes, walRes] = await Promise.all([
        eventApi.getTransactions(passedEvent.id),
        categoryApi.getAll(),
        walletApi.getAll()
      ]);
      setTransactions(txRes.data || []);
      setCategories(catRes.data || []);
      setWallets(walRes.data || []);

      // Calculate totals since the passed event might be stale after adding txns
      const txns = txRes.data || [];
      const totalExpense = txns.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
      const totalIncome = txns.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
      setEventData(prev => ({ ...prev, totalExpense, totalIncome }));

    } catch (err) {
      console.error('Failed to load event details', err);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, [passedEvent.id]));

  const filteredCategories = categories.filter((c) => c.type === form.type);

  const handleCreateTxn = async () => {
    if (!form.amount || !form.categoryId || !form.walletId) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số tiền, danh mục và chọn ví');
      return;
    }

    const amountVal = parseFloat(form.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      Alert.alert('Lỗi', 'Số tiền phải lớn hơn 0');
      return;
    }

    const selectedDate = new Date(form.transactionDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    selectedDate.setHours(0,0,0,0);
    if (selectedDate > today) {
      Alert.alert('Lỗi', 'Ngày giao dịch không được vượt quá hôm nay');
      return;
    }

    try {
      await transactionApi.create({
        amount: parseFloat(form.amount), type: form.type, note: form.note,
        transactionDate: form.transactionDate, categoryId: form.categoryId, 
        walletId: form.walletId, eventId: passedEvent.id, // LOCKED TO THIS EVENT
      });
      setModalVisible(false);
      setForm({
        amount: '', type: 'EXPENSE', note: '', 
        transactionDate: new Date().toISOString().split('T')[0],
        categoryId: null, walletId: null
      });
      loadData();
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể tạo giao dịch');
    }
  };

  const handleDeleteTxn = (id) => {
    Alert.alert('Xác nhận xóa', 'Bạn có chắc muốn xóa giao dịch này khỏi hệ thống?', [
      { text: 'Hủy' },
      {
        text: 'Xóa', style: 'destructive',
        onPress: async () => {
          try { await transactionApi.delete(id); loadData(); }
          catch (err) { Alert.alert('Lỗi', 'Không thể xóa'); }
        },
      },
    ]);
  };

  const renderTxn = ({ item }) => {
    let amountColor = item.type === 'INCOME' ? C.income : item.type === 'LOAN' ? C.loan : C.expense;
    let amountPrefix = item.type === 'INCOME' ? '+' : '-';
    return (
      <TouchableOpacity 
        style={st.txnItem} 
        onPress={() => navigation.navigate('TransactionDetail', { transaction: item })}
        onLongPress={() => handleDeleteTxn(item.id)}
      >
        <View style={[st.txnIcon, { backgroundColor: item.categoryColor || C.gray }]}>
          <Ionicons name={getCategoryIcon(item.categoryIcon)} size={16} color="#fff" />
        </View>
        <View style={st.txnInfo}>
          <Text style={[st.txnCategory, { color: C.text }]}>{item.categoryName}</Text>
          {item.note ? <Text style={[st.txnMeta, { color: C.textSecondary }]}>{item.note}</Text> : null}
          <Text style={[st.txnMeta, { color: C.textLight }]}>{item.walletName} • {formatDate(item.transactionDate)}</Text>
        </View>
        <Text style={[st.txnAmount, { color: amountColor }]}>
          {amountPrefix}{formatCurrency(item.amount)}
        </Text>
      </TouchableOpacity>
    );
  };

  // Styles injected with current colors
  const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: {
      paddingTop: 52, paddingBottom: 12, paddingHorizontal: SIZES.lg,
      flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
      borderBottomWidth: 1, borderBottomColor: C.border,
    },
    backBtn: { paddingRight: SIZES.md },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: C.text },
    statsContainer: {
      backgroundColor: C.surface,
      padding: SIZES.lg,
      borderBottomWidth: 1, borderBottomColor: C.border,
      alignItems: 'center',
    },
    eventIcon: { fontSize: 40, marginBottom: SIZES.sm },
    eventName: { ...FONTS.title, color: C.text, textAlign: 'center' },
    eventDateRange: { color: C.textSecondary, fontSize: 13, marginTop: 4 },
    eventNote: { color: C.textLight, fontSize: 13, fontStyle: 'italic', marginTop: SIZES.sm, textAlign: 'center' },
    detailStats: { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.md, width: '100%' },
    detailStatCard: { flex: 1, backgroundColor: C.background, borderRadius: SIZES.radiusSm, padding: SIZES.md, borderLeftWidth: 4 },
    detailStatLabel: { color: C.textSecondary, fontSize: 12 },
    detailStatAmount: { ...FONTS.bold, marginTop: SIZES.xs },
    
    listSection: { padding: SIZES.md, flex: 1 },
    sectionTitle: { ...FONTS.bold, color: C.text, marginBottom: SIZES.sm },
    empty: { ...FONTS.regular, color: C.textSecondary, textAlign: 'center', marginTop: SIZES.xl },
    
    txnItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: SIZES.radius, padding: SIZES.md, marginBottom: SIZES.sm, ...SHADOWS.sm },
    txnIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    txnInfo: { flex: 1, marginLeft: SIZES.sm },
    txnCategory: { ...FONTS.medium, fontSize: 14 },
    txnMeta: { ...FONTS.small, fontSize: 12, marginTop: 2 },
    txnAmount: { ...FONTS.bold, fontSize: 14 },
    
    fab: { position: 'absolute', bottom: SIZES.lg, right: SIZES.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', ...SHADOWS.md, zIndex: 10 },
    
    // Modal
    modalOverlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
    modalContent: { backgroundColor: C.surface, borderTopLeftRadius: SIZES.radiusLg, borderTopRightRadius: SIZES.radiusLg, padding: SIZES.lg, maxHeight: '88%' },
    modalTitle: { ...FONTS.title, textAlign: 'center', marginBottom: SIZES.md, color: C.text },
    typeRow: { flexDirection: 'row', gap: SIZES.xs, marginBottom: SIZES.md },
    typeBtn: { flex: 1, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusSm, borderWidth: 1.5, borderColor: C.border, alignItems: 'center' },
    typeBtnText: { fontWeight: '700', color: C.textSecondary, fontSize: 12 },
    amountWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.primaryBg, borderRadius: SIZES.radius, padding: SIZES.md, marginBottom: SIZES.sm },
    amountInput: { flex: 1, fontSize: 26, fontWeight: '800', color: C.primary },
    amountCurrency: { fontSize: 18, fontWeight: '700', color: C.primary },
    input: { backgroundColor: C.background, borderRadius: SIZES.radiusSm, borderWidth: 1, borderColor: C.border, padding: SIZES.md, fontSize: 15, marginBottom: SIZES.sm, color: C.text },
    pickerLabel: { color: C.text, fontSize: 13, fontWeight: '700', marginBottom: SIZES.xs, marginTop: SIZES.xs },
    inputPicker: { backgroundColor: C.background, borderRadius: SIZES.radiusSm, borderWidth: 1, borderColor: C.border, padding: SIZES.md, marginBottom: SIZES.sm, justifyContent: 'center' },
    doneBtnIOS: { alignSelf: 'flex-end', marginBottom: SIZES.sm, marginRight: SIZES.sm },
    doneBtnTextIOS: { color: C.primary, fontWeight: '700' },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.xs, marginBottom: SIZES.sm },
    chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, marginRight: SIZES.xs, marginBottom: SIZES.xs, flexDirection: 'row', alignItems: 'center', gap: 4 },
    chipActive: { backgroundColor: C.primary, borderColor: C.primary },
    chipText: { fontSize: 13, color: C.text, fontWeight: '500' },
    modalActions: { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.md },
    cancelBtn: { flex: 1, padding: SIZES.md, borderRadius: SIZES.radius, borderWidth: 1.5, borderColor: C.border, alignItems: 'center' },
    cancelText: { color: C.textSecondary, fontWeight: '700', fontSize: 15 },
    saveBtn: { flex: 1, padding: SIZES.md, borderRadius: SIZES.radius, backgroundColor: C.primary, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  });

  return (
    <View style={st.container}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Chi tiết Sự kiện</Text>
      </View>

      <View style={st.statsContainer}>
        <Text style={st.eventIcon}>{eventData.icon || '📌'}</Text>
        <Text style={st.eventName}>{eventData.name}</Text>
        <Text style={st.eventDateRange}>
          {eventData.startDate ? formatDate(eventData.startDate) : ''} 
          {eventData.endDate ? ` → ${formatDate(eventData.endDate)}` : ''}
        </Text>
        {eventData.note ? <Text style={st.eventNote}>{eventData.note}</Text> : null}

        <View style={st.detailStats}>
          <View style={[st.detailStatCard, { borderLeftColor: C.expense }]}>
            <Text style={st.detailStatLabel}>Tổng chi tiêu</Text>
            <Text style={[st.detailStatAmount, { color: C.expense }]}>
              {formatCurrency(eventData.totalExpense || 0)}
            </Text>
          </View>
          <View style={[st.detailStatCard, { borderLeftColor: C.income }]}>
            <Text style={st.detailStatLabel}>Tổng thu nhập</Text>
            <Text style={[st.detailStatAmount, { color: C.income }]}>
              {formatCurrency(eventData.totalIncome || 0)}
            </Text>
          </View>
        </View>
      </View>

      <View style={st.listSection}>
        <Text style={st.sectionTitle}>Các giao dịch thuộc sự kiện ({transactions.length})</Text>
        <FlatList
          data={transactions}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderTxn}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={st.empty}>Chưa có giao dịch nào ở đây</Text>}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      </View>

      <TouchableOpacity style={st.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={st.modalOverlay}>
          <View style={st.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={st.modalTitle}>Thêm giao dịch vào sự kiện</Text>

              <View style={st.typeRow}>
                {[
                  { key: 'EXPENSE', label: '💸 Khoản chi', color: C.expense },
                  { key: 'INCOME', label: '💰 Khoản thu', color: C.income },
                ].map((t) => (
                  <TouchableOpacity key={t.key}
                    style={[st.typeBtn, form.type === t.key && { backgroundColor: t.color, borderColor: t.color }]}
                    onPress={() => setForm((p) => ({ ...p, type: t.key, categoryId: null }))}>
                    <Text style={[st.typeBtnText, form.type === t.key && { color: '#fff' }]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={st.amountWrap}>
                <TextInput style={st.amountInput} placeholder="0" placeholderTextColor={C.textLight} keyboardType="numeric" value={form.amount} onChangeText={(v) => setForm((p) => ({ ...p, amount: v }))} />
                <Text style={st.amountCurrency}>đ</Text>
              </View>

              <TextInput style={st.input} placeholder="Ghi chú" placeholderTextColor={C.textLight} value={form.note} onChangeText={(v) => setForm((p) => ({ ...p, note: v }))} />
              
              <Text style={st.pickerLabel}>Ngày giao dịch</Text>
              <TouchableOpacity style={st.inputPicker} onPress={() => setShowPicker(true)}>
                <Text style={{ color: C.text }}>{form.transactionDate}</Text>
              </TouchableOpacity>
              {showPicker && (
                <DateTimePicker
                  value={new Date(form.transactionDate)}
                  mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowPicker(Platform.OS === 'ios');
                    if (selectedDate) setForm(p => ({ ...p, transactionDate: selectedDate.toISOString().split('T')[0] }));
                  }}
                />
              )}
              {Platform.OS === 'ios' && showPicker && (
                <TouchableOpacity onPress={() => setShowPicker(false)} style={st.doneBtnIOS}><Text style={st.doneBtnTextIOS}>Xong</Text></TouchableOpacity>
              )}

              <Text style={st.pickerLabel}>Ví</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SIZES.sm }}>
                {wallets.map((w) => (
                  <TouchableOpacity key={w.id}
                    style={[st.chip, form.walletId === w.id && { backgroundColor: WALLET_COLORS[w.type] || C.primary, borderColor: 'transparent' }]}
                    onPress={() => setForm((p) => ({ ...p, walletId: w.id }))}>
                    <Ionicons name={w.type === 'CASH' ? 'cash' : 'card'} size={13} color={form.walletId === w.id ? '#fff' : C.textSecondary} />
                    <Text style={[st.chipText, form.walletId === w.id && { color: '#fff' }]}>{w.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={st.pickerLabel}>Danh mục</Text>
              <View style={st.chipWrap}>
                {filteredCategories.map((c) => (
                  <TouchableOpacity key={c.id}
                    style={[st.chip, form.categoryId === c.id && { backgroundColor: c.color || C.primary, borderColor: 'transparent' }]}
                    onPress={() => setForm((p) => ({ ...p, categoryId: c.id }))}>
                    <Text style={[st.chipText, form.categoryId === c.id && { color: '#fff' }]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={st.modalActions}>
                <TouchableOpacity style={st.cancelBtn} onPress={() => setModalVisible(false)}><Text style={st.cancelText}>Hủy</Text></TouchableOpacity>
                <TouchableOpacity style={[st.saveBtn, { backgroundColor: form.type === 'INCOME' ? C.income : C.primary }]} onPress={handleCreateTxn}><Text style={st.saveBtnText}>Lưu</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}
