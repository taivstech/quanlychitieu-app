import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
  Modal, TextInput, RefreshControl, ScrollView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { eventApi } from '../../api';
import { formatCurrency, formatDate, getCategoryIcon } from '../../utils/helpers';
import { useTheme } from '../../contexts/ThemeContext';

export default function EventScreen({ navigation }) {
  const { colors } = useTheme();
  const C = colors || COLORS;
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('ACTIVE');
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '✈️', note: '', startDate: '', endDate: '' });

  // Date picker states for Start Date
  const [showPickerStart, setShowPickerStart] = useState(false);
  // Date picker states for End Date
  const [showPickerEnd, setShowPickerEnd] = useState(false);

  const loadData = async () => {
    try {
      const res = filter === 'ACTIVE' ? await eventApi.getActive() : await eventApi.getAll();
      setEvents(res.data || []);
    } catch (err) { console.error('Event load error:', err); }
  };

  useFocusEffect(useCallback(() => { loadData(); }, [filter]));

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleCreate = async () => {
    if (!form.name.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập tên sự kiện'); return; }
    try {
      await eventApi.create({
        name: form.name.trim(), icon: form.icon, note: form.note,
        startDate: form.startDate || null, endDate: form.endDate || null,
      });
      setModalVisible(false);
      setForm({ name: '', icon: '✈️', note: '', startDate: '', endDate: '' });
      setShowPickerStart(false);
      setShowPickerEnd(false);
      loadData();
    } catch (err) { Alert.alert('Lỗi', err.message || 'Không thể tạo sự kiện'); }
  };

  const handleToggle = async (id) => {
    try { await eventApi.toggle(id); loadData(); }
    catch (err) { Alert.alert('Lỗi', 'Thất bại'); }
  };

  const handleDelete = (id) => {
    Alert.alert('Xác nhận', 'Xóa sự kiện này?', [
      { text: 'Hủy' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        try { await eventApi.delete(id); loadData(); }
        catch (e) { Alert.alert('Lỗi', 'Không thể xóa'); }
      }},
    ]);
  };

  const openDetail = (event) => {
    navigation.navigate('EventDetail', { event });
  };

  const ICONS = ['✈️', '🏖️', '🎂', '🎄', '🏕️', '🎓', '💼', '🎉', '🏠', '🚗'];

  const renderEvent = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openDetail(item)} onLongPress={() => handleDelete(item.id)}>
      <View style={styles.cardHeader}>
        <Text style={styles.eventIcon}>{item.icon || '📌'}</Text>
        <View style={{ flex: 1, marginLeft: SIZES.sm }}>
          <Text style={styles.eventName}>{item.name}</Text>
          <Text style={styles.eventDate}>
            {item.startDate ? formatDate(item.startDate) : ''} 
            {item.endDate ? ` → ${formatDate(item.endDate)}` : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={() => handleToggle(item.id)}>
          <Ionicons
            name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={item.completed ? COLORS.success : COLORS.textLight}
          />
        </TouchableOpacity>
      </View>
      {item.note ? <Text style={styles.eventNote}>{item.note}</Text> : null}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name="receipt-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.statText}>{item.transactionCount || 0} giao dịch</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="arrow-up-circle-outline" size={14} color={COLORS.expense} />
          <Text style={[styles.statText, { color: COLORS.expense }]}>
            {formatCurrency(item.totalExpense || 0)}
          </Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="arrow-down-circle-outline" size={14} color={COLORS.income} />
          <Text style={[styles.statText, { color: COLORS.income }]}>
            {formatCurrency(item.totalIncome || 0)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <Text style={[styles.headerTitle, { color: C.text }]}>🌟 Sự kiện & Chuyến đi</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={[styles.addBtn, { backgroundColor: C.primary }]}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {[{ key: 'ACTIVE', label: 'Đang diễn ra' }, { key: 'ALL', label: 'Tất cả' }].map((f) => (
          <TouchableOpacity key={f.key} style={[styles.filterBtn, filter === f.key && styles.filterActive]}
            onPress={() => setFilter(f.key)}>
            <Text style={[styles.filterText, filter === f.key && { color: COLORS.white }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderEvent}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={<Text style={styles.empty}>Chưa có sự kiện nào</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>

      {/* Create Event Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Thêm sự kiện</Text>
              <TextInput style={styles.input} placeholder="Tên sự kiện *" placeholderTextColor={COLORS.textLight}
                value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} />
              <Text style={styles.pickerLabel}>Icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SIZES.sm }}>
                {ICONS.map((ic) => (
                  <TouchableOpacity key={ic}
                    style={[styles.iconChip, form.icon === ic && styles.iconChipActive]}
                    onPress={() => setForm((p) => ({ ...p, icon: ic }))}>
                    <Text style={{ fontSize: 24 }}>{ic}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              {/* Bắt đầu: START DATE */}
              <Text style={styles.pickerLabel}>Ngày bắt đầu</Text>
              <TouchableOpacity style={styles.inputPicker} onPress={() => setShowPickerStart(true)}>
                <Text style={{ color: form.startDate ? COLORS.text : COLORS.textLight }}>
                  {form.startDate ? form.startDate : "Chọn ngày bắt đầu"}
                </Text>
              </TouchableOpacity>
              {showPickerStart && (
                <DateTimePicker
                  value={form.startDate ? new Date(form.startDate) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowPickerStart(Platform.OS === 'ios');
                    if (selectedDate) setForm(p => ({ ...p, startDate: selectedDate.toISOString().split('T')[0] }));
                  }}
                />
              )}
              {Platform.OS === 'ios' && showPickerStart && (
                <TouchableOpacity onPress={() => setShowPickerStart(false)} style={styles.doneBtnIOS}>
                  <Text style={styles.doneBtnTextIOS}>Xong</Text>
                </TouchableOpacity>
              )}

              {/* Bắt đầu: END DATE */}
              <Text style={styles.pickerLabel}>Ngày kết thúc</Text>
              <TouchableOpacity style={styles.inputPicker} onPress={() => setShowPickerEnd(true)}>
                <Text style={{ color: form.endDate ? COLORS.text : COLORS.textLight }}>
                  {form.endDate ? form.endDate : "Chọn ngày kết thúc"}
                </Text>
              </TouchableOpacity>
              {showPickerEnd && (
                <DateTimePicker
                  value={form.endDate ? new Date(form.endDate) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowPickerEnd(Platform.OS === 'ios');
                    if (selectedDate) setForm(p => ({ ...p, endDate: selectedDate.toISOString().split('T')[0] }));
                  }}
                />
              )}
              {Platform.OS === 'ios' && showPickerEnd && (
                <TouchableOpacity onPress={() => setShowPickerEnd(false)} style={styles.doneBtnIOS}>
                  <Text style={styles.doneBtnTextIOS}>Xong</Text>
                </TouchableOpacity>
              )}

              <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top', marginTop: SIZES.sm }]}
                placeholder="Ghi chú" placeholderTextColor={COLORS.textLight} multiline
                value={form.note} onChangeText={(v) => setForm((p) => ({ ...p, note: v }))} />
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
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  filterRow: { flexDirection: 'row', padding: SIZES.md, gap: SIZES.sm },
  filterBtn: { flex: 1, padding: SIZES.sm, borderRadius: SIZES.radiusSm, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  filterActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontWeight: '600', color: COLORS.text },
  list: { padding: SIZES.md },
  card: { backgroundColor: COLORS.surface, borderRadius: SIZES.radius, padding: SIZES.md, marginBottom: SIZES.sm, ...SHADOWS.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  eventIcon: { fontSize: 28 },
  eventName: { ...FONTS.bold },
  eventDate: { ...FONTS.small, marginTop: 2 },
  eventNote: { ...FONTS.small, fontStyle: 'italic', marginTop: SIZES.xs, marginLeft: 44 },
  statsRow: { flexDirection: 'row', marginTop: SIZES.sm, gap: SIZES.md },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { ...FONTS.small, fontSize: 12 },
  empty: { ...FONTS.regular, color: COLORS.textSecondary, textAlign: 'center', marginTop: SIZES.xxl },
  fab: { position: 'absolute', bottom: SIZES.lg, right: SIZES.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOWS.md },
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: SIZES.radiusLg, borderTopRightRadius: SIZES.radiusLg, padding: SIZES.lg, maxHeight: '80%' },
  modalTitle: { ...FONTS.title, textAlign: 'center', marginBottom: SIZES.md },
  input: { backgroundColor: COLORS.background, borderRadius: SIZES.radiusSm, padding: SIZES.md, fontSize: 16, marginBottom: SIZES.sm, color: COLORS.text },
  pickerLabel: { ...FONTS.medium, marginBottom: SIZES.xs, marginTop: SIZES.xs },
  iconChip: { width: 48, height: 48, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginRight: SIZES.xs },
  iconChipActive: { borderColor: COLORS.primary, borderWidth: 2, backgroundColor: COLORS.background },
  modalActions: { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.md },
  cancelBtn: { flex: 1, padding: SIZES.md, borderRadius: SIZES.radiusSm, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelText: { color: COLORS.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1, padding: SIZES.md, borderRadius: SIZES.radiusSm, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveBtnText: { color: COLORS.white, fontWeight: '700' },
});
