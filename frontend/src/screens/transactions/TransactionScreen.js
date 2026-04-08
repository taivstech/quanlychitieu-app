import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl, Modal,
  TextInput, ScrollView, Dimensions, SectionList, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SIZES, SHADOWS, WALLET_COLORS } from '../../constants/theme';
import { transactionApi, categoryApi, walletApi, eventApi, budgetApi } from '../../api';
import { formatCurrency, getCurrentMonth, getCurrentYear, getMonthRange, getCategoryIcon } from '../../utils/helpers';
import { useTheme } from '../../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_NAMES_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const WALLET_ICONS = { CASH: 'cash', BANK_ACCOUNT: 'business', CREDIT_CARD: 'card', E_WALLET: 'phone-portrait' };

const fmtLocal = (dt) => {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

function generateMonthTabs() {
  const now = new Date();
  const curM = now.getMonth() + 1;
  const curY = now.getFullYear();
  const tabs = [];
  for (let i = 11; i >= 2; i--) {
    let m = curM - i;
    let y = curY;
    if (m <= 0) { m += 12; y -= 1; }
    tabs.push({ label: `${String(m).padStart(2, '0')}/${y}`, month: m, year: y });
  }
  const prevM = curM === 1 ? 12 : curM - 1;
  const prevY = curM === 1 ? curY - 1 : curY;
  tabs.push({ label: 'Tháng trước', month: prevM, year: prevY });
  tabs.push({ label: 'Tháng này', month: curM, year: curY });
  return tabs;
}

export default function TransactionScreen({ navigation, route }) {
  const { isDark, colors } = useTheme();
  const C = colors || COLORS;

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [events, setEvents] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedWalletFilter, setSelectedWalletFilter] = useState(null); // null = all
  const [form, setForm] = useState({
    amount: '', type: 'EXPENSE', note: '', transactionDate: fmtLocal(new Date()),
    categoryId: null, walletId: null, eventId: null, loanSubType: null,
  });

  const [showPicker, setShowPicker] = useState(false);

  const monthTabs = useMemo(() => generateMonthTabs(), []);
  const [selectedTab, setSelectedTab] = useState(monthTabs.length - 1);
  const tabScrollRef = useRef(null);
  const initialScrollDone = useRef(false);
  const noteInputRef = useRef(null);

  const currentTab = monthTabs[selectedTab];

  React.useEffect(() => {
    if (route?.params?.openAddModal) {
      setModalVisible(true);
      if (route?.params?.preSelectedEventId) {
        setForm(p => ({ ...p, eventId: route.params.preSelectedEventId }));
      }
      navigation.setParams({ openAddModal: false, preSelectedEventId: null });
    }
    if (route?.params?.openSearch) {
      setSearchVisible(true);
      navigation.setParams({ openSearch: false });
    }
  }, [route?.params?.openAddModal, route?.params?.preSelectedEventId, route?.params?.openSearch]);
  const loadData = async (month, year) => {
    try {
      const { startDate, endDate } = getMonthRange(month, year);
      const [txnRes, catRes, walRes, evtRes, balRes, budRes] = await Promise.all([
        transactionApi.getByDateRange(startDate, endDate),
        categoryApi.getAll(),
        walletApi.getAll(),
        eventApi.getActive(),
        walletApi.getTotalBalance(),
        budgetApi.getByMonth(month, year)
      ]);
      setTransactions(txnRes.data || []);
      setCategories(catRes.data || []);
      setWallets(walRes.data || []);
      setEvents(evtRes.data || []);
      setTotalBalance(balRes.data?.totalBalance || 0);
      setBudgets(budRes.data || []);
    } catch (err) { console.error('Transaction load error:', err); }
  };

  const handleGlobalSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await transactionApi.search(query);
      setSearchResults(res.data?.content || []);
    } catch (err) {
      console.error('Global search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  React.useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchVisible && searchQuery.length > 1) {
        handleGlobalSearch(searchQuery);
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, searchVisible]);

  useFocusEffect(useCallback(() => {
    loadData(currentTab.month, currentTab.year);
    if (!initialScrollDone.current) {
      initialScrollDone.current = true;
      setTimeout(() => {
        const idx = monthTabs.length - 1;
        tabScrollRef.current?.scrollTo({ x: Math.max(0, idx * 120 - SCREEN_WIDTH / 2 + 60), animated: false });
      }, 100);
    }
  }, [selectedTab]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(currentTab.month, currentTab.year);
    setRefreshing(false);
  };

  const handleCreate = async () => {
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
      const noteText = noteInputRef.current?._lastNativeText || noteInputRef.current?.props?.value || '';
      const payload = {
        amount: parseFloat(form.amount), type: form.type, note: noteText,
        transactionDate: form.transactionDate, categoryId: form.categoryId, walletId: form.walletId,
      };
      if (form.eventId) payload.eventId = form.eventId;
      await transactionApi.create(payload);
      setModalVisible(false);
      if (noteInputRef.current) noteInputRef.current.clear();
      setForm({ amount: '', type: 'EXPENSE', note: '', transactionDate: fmtLocal(new Date()), categoryId: null, walletId: null, eventId: null, loanSubType: null });
      loadData(currentTab.month, currentTab.year);
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể tạo giao dịch');
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Xác nhận xóa', 'Bạn có chắc muốn xóa giao dịch này?', [
      { text: 'Hủy' },
      {
        text: 'Xóa', style: 'destructive',
        onPress: async () => {
          try { await transactionApi.delete(id); loadData(currentTab.month, currentTab.year); }
          catch (err) { Alert.alert('Lỗi', 'Không thể xóa'); }
        },
      },
    ]);
  };

  // Filter transactions
  const displayTransactions = useMemo(() => {
    if (searchVisible && searchQuery.trim().length > 1) {
      return searchResults;
    }
    let txns = transactions;
    if (selectedWalletFilter) {
      txns = txns.filter(t => t.walletId === selectedWalletFilter || t.walletName === wallets.find(w => w.id === selectedWalletFilter)?.name);
    }
    return txns;
  }, [transactions, selectedWalletFilter, searchQuery, searchVisible, searchResults, wallets]);

  const { totalIncome, totalExpense } = useMemo(() => {
    let inc = 0, exp = 0;
    displayTransactions.forEach(t => {
      if (t.type === 'INCOME') inc += t.amount;
      else if (t.type === 'EXPENSE') exp += t.amount;
      else if (t.type === 'LOAN') {
        if (t.categoryName === 'Cho vay') exp += t.amount;
        else inc += t.amount;
      }
    });
    return { totalIncome: inc, totalExpense: exp };
  }, [displayTransactions]);

  const sections = useMemo(() => {
    const grouped = {};
    displayTransactions.forEach(t => {
      const dateKey = t.transactionDate;
      if (!grouped[dateKey]) grouped[dateKey] = { transactions: [], total: 0 };
      grouped[dateKey].transactions.push(t);
      if (t.type === 'INCOME') grouped[dateKey].total += t.amount;
      else if (t.type === 'EXPENSE') grouped[dateKey].total -= t.amount;
      else if (t.type === 'LOAN') {
        grouped[dateKey].total += t.categoryName === 'Cho vay' ? -t.amount : t.amount;
      }
    });
    return Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a)).map(dateKey => {
      const d = new Date(dateKey);
      const dayNum = d.getDate();
      const dayName = DAY_NAMES_VI[d.getDay()];
      const monthStr = `Thg ${d.getMonth() + 1}`;
      return { dateKey, dayNum, dayName, monthStr, total: grouped[dateKey].total, data: grouped[dateKey].transactions };
    });
  }, [displayTransactions]);

  const filteredCategories = useMemo(() => {
    const byType = categories.filter((c) => c.type === form.type);
    if (form.type === 'LOAN' && form.loanSubType) {
      return byType.filter((c) =>
        form.loanSubType === 'CHO_VAY'
          ? c.name === 'Cho vay' || c.name === 'Thu nợ'
          : c.name === 'Vay' || c.name === 'Trả nợ'
      );
    }
    return byType;
  }, [categories, form.type, form.loanSubType]);

  const budgetWarning = useMemo(() => {
    if (form.type !== 'EXPENSE' || !form.categoryId || !form.amount) return null;
    const budget = budgets.find(b => b.categoryId === form.categoryId);
    if (!budget) return null;
    
    const amount = parseFloat(form.amount) || 0;
    const totalNewSpent = budget.spentAmount + amount;
    const pct = (totalNewSpent / budget.amountLimit) * 100;
    
    if (totalNewSpent > budget.amountLimit) {
      return { 
        text: `Vượt ngân sách! (${formatCurrency(totalNewSpent - budget.amountLimit)} quá mức)`, 
        color: C.expense,
        pct 
      };
    }
    if (pct > 80) {
      return { 
        text: `Sắp chạm hạn mức (${pct.toFixed(0)}%)`, 
        color: C.warning,
        pct 
      };
    }
    return null;
  }, [form.categoryId, form.amount, form.type, budgets, C]);

  const onTabSelect = (index) => {
    setSelectedTab(index);
    tabScrollRef.current?.scrollTo({ x: Math.max(0, index * 120 - SCREEN_WIDTH / 2 + 60), animated: true });
  };

  const st = makeStyles(C);

  const renderSectionHeader = ({ section }) => (
    <View style={st.dateHeader}>
      <View style={st.dateLeft}>
        <View style={st.dateNumBox}>
          <Text style={st.dateNum}>{section.dayNum}</Text>
        </View>
        <View style={st.dateMeta}>
          <Text style={st.dayName}>{section.dayName}</Text>
          <Text style={st.monthStr}>{section.monthStr}</Text>
        </View>
      </View>
      <Text style={[st.dateTotal, { color: section.total >= 0 ? C.income : C.expense }]}>
        {section.total >= 0 ? '+' : ''}{formatCurrency(Math.abs(section.total))}
      </Text>
    </View>
  );

  const renderTxn = ({ item }) => {
    let amountColor = item.type === 'INCOME' ? C.income : item.type === 'LOAN' ? C.loan : C.expense;
    let amountPrefix = item.type === 'INCOME' ? '+' : '-';
    return (
      <TouchableOpacity
        style={st.txnItem}
        onPress={() => navigation?.navigate?.('TransactionDetail', { transaction: item })}
        onLongPress={() => handleDelete(item.id)}
      >
        <View style={[st.txnIcon, { backgroundColor: item.categoryColor || C.primary }]}>
          <Ionicons name={getCategoryIcon(item.categoryIcon)} size={16} color="#fff" />
        </View>
        <View style={st.txnInfo}>
          <Text style={st.txnCategory}>{item.categoryName}</Text>
          {item.note ? <Text style={st.txnNote} numberOfLines={1}>{item.note}</Text> : null}
          {item.walletName ? <Text style={st.txnWallet}>{item.walletName}</Text> : null}
        </View>
        <Text style={[st.txnAmount, { color: amountColor }]}>
          {amountPrefix}{formatCurrency(item.amount)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={st.container}>
      {/* Header */}
      <View style={st.header}>
        <Text style={st.headerTitle}>Sổ giao dịch</Text>
        <View style={st.headerActions}>
          <TouchableOpacity onPress={() => { setSearchVisible(!searchVisible); setSearchQuery(''); }} style={st.headerBtn}>
            <Ionicons name={searchVisible ? 'close' : 'search'} size={20} color={C.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={[st.headerBtn, { backgroundColor: C.primary }]}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Wallet filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.walletFilterScroll}>
        <TouchableOpacity
          style={[st.walletFilter, !selectedWalletFilter && st.walletFilterActive]}
          onPress={() => setSelectedWalletFilter(null)}>
          <Ionicons name="globe-outline" size={14} color={!selectedWalletFilter ? '#fff' : C.textSecondary} />
          <Text style={[st.walletFilterText, !selectedWalletFilter && { color: '#fff' }]}>Tất cả</Text>
        </TouchableOpacity>
        {wallets.map(w => (
          <TouchableOpacity key={w.id}
            style={[st.walletFilter, selectedWalletFilter === w.id && { backgroundColor: WALLET_COLORS[w.type] || C.primary, borderColor: 'transparent' }]}
            onPress={() => setSelectedWalletFilter(selectedWalletFilter === w.id ? null : w.id)}>
            <Ionicons name={WALLET_ICONS[w.type] || 'wallet'} size={14}
              color={selectedWalletFilter === w.id ? '#fff' : C.textSecondary} />
            <Text style={[st.walletFilterText, selectedWalletFilter === w.id && { color: '#fff' }]}>{w.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {!searchVisible ? (
        <View style={st.tabContainer}>
          <ScrollView ref={tabScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.tabScroll}>
            {monthTabs.map((tab, index) => (
              <TouchableOpacity key={tab.label} style={[st.tab, selectedTab === index && st.tabActive]} onPress={() => onTabSelect(index)}>
                <Text style={[st.tabText, selectedTab === index && st.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={st.searchBar}>
          <Ionicons name="search" size={20} color={C.textSecondary} />
          <TextInput
            style={st.searchInput}
            placeholder="Tìm theo ghi chú hoặc danh mục..."
            placeholderTextColor={C.textLight}
            value={searchQuery}
            autoFocus
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={C.textLight} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* Income/Expense summary */}
      <View style={st.summaryRow}>
        <View style={st.summaryItem}>
          <Ionicons name="arrow-down-circle" size={16} color={C.income} style={{ marginBottom: 2 }} />
          <Text style={st.summaryLabel}>Thu</Text>
          <Text style={[st.summaryValue, { color: C.income }]}>{formatCurrency(totalIncome)}</Text>
        </View>
        <View style={st.summaryDivider} />
        <View style={st.summaryItem}>
          <Ionicons name="arrow-up-circle" size={16} color={C.expense} style={{ marginBottom: 2 }} />
          <Text style={st.summaryLabel}>Chi</Text>
          <Text style={[st.summaryValue, { color: C.expense }]}>{formatCurrency(totalExpense)}</Text>
        </View>
        <View style={st.summaryDivider} />
        <View style={st.summaryItem}>
          <Ionicons name="wallet" size={16} color={C.primary} style={{ marginBottom: 2 }} />
          <Text style={st.summaryLabel}>Còn lại</Text>
          <Text style={[st.summaryValue, { color: C.primary }]}>{formatCurrency(totalIncome - totalExpense)}</Text>
        </View>
      </View>

      {/* Transactions */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderTxn}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={st.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} tintColor={C.primary} />}
        ListEmptyComponent={
          <View style={st.emptyContainer}>
            <Ionicons name="receipt-outline" size={52} color={C.textLight} />
            <Text style={st.empty}>{searchQuery ? 'Không tìm thấy giao dịch nào' : 'Không có giao dịch trong tháng này'}</Text>
          </View>
        }
      />

      {/* Add Transaction Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={st.modalOverlay}>
          <View style={st.modalContent}>
            <ScrollView>
              <View style={st.modalHandle} />
              <Text style={st.modalTitle}>Thêm giao dịch</Text>

              {/* Type selector */}
              <View style={st.typeRow}>
                {[
                  { key: 'EXPENSE', label: '💸 Khoản chi', color: C.expense },
                  { key: 'INCOME', label: '💰 Khoản thu', color: C.income },
                  { key: 'LOAN', label: '🤝 Vay/Nợ', color: C.loan },
                ].map((t) => (
                  <TouchableOpacity key={t.key}
                    style={[st.typeBtn, form.type === t.key && { backgroundColor: t.color, borderColor: t.color }]}
                    onPress={() => setForm((p) => ({ ...p, type: t.key, categoryId: null, loanSubType: null }))}>
                    <Text style={[st.typeBtnText, form.type === t.key && { color: '#fff' }]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {form.type === 'LOAN' && (
                <View style={st.loanSubRow}>
                  {[{ key: 'VAY', label: '🏦 Đi vay', color: C.loan },
                    { key: 'CHO_VAY', label: '📤 Cho vay', color: '#8B5CF6' }].map(sub => (
                    <TouchableOpacity key={sub.key}
                      style={[st.loanSubBtn, form.loanSubType === sub.key && { backgroundColor: sub.color, borderColor: sub.color }]}
                      onPress={() => setForm(p => ({ ...p, loanSubType: sub.key, categoryId: null }))}>
                      <Text style={[st.loanSubText, form.loanSubType === sub.key && { color: '#fff' }]}>{sub.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Amount */}
              <View style={st.amountWrap}>
                <TextInput style={st.amountInput} placeholder="0"
                  placeholderTextColor={C.textLight}
                  keyboardType="numeric" value={form.amount}
                  onChangeText={(v) => setForm((p) => ({ ...p, amount: v }))} />
                <Text style={st.amountCurrency}>đ</Text>
              </View>

              <TextInput ref={noteInputRef} style={st.input} placeholder="Ghi chú" placeholderTextColor={C.textLight} />
              
              <Text style={st.pickerLabel}>Ngày giao dịch</Text>
              <TouchableOpacity style={st.inputPicker} onPress={() => setShowPicker(true)}>
                <Text style={{ color: C.text }}>{form.transactionDate}</Text>
              </TouchableOpacity>
              {showPicker && (
                <DateTimePicker
                  value={new Date(form.transactionDate)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowPicker(Platform.OS === 'ios');
                    if (selectedDate) setForm(p => ({ ...p, transactionDate: selectedDate.toISOString().split('T')[0] }));
                  }}
                />
              )}
              {Platform.OS === 'ios' && showPicker && (
                <TouchableOpacity onPress={() => setShowPicker(false)} style={st.doneBtnIOS}>
                  <Text style={st.doneBtnTextIOS}>Xong</Text>
                </TouchableOpacity>
              )}

              <Text style={st.pickerLabel}>Ví</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SIZES.sm }}>
                {wallets.map((w) => (
                  <TouchableOpacity key={w.id}
                    style={[st.chip, form.walletId === w.id && { backgroundColor: WALLET_COLORS[w.type] || C.primary, borderColor: 'transparent' }]}
                    onPress={() => setForm((p) => ({ ...p, walletId: w.id }))}>
                    <Ionicons name={WALLET_ICONS[w.type] || 'wallet'} size={13}
                      color={form.walletId === w.id ? '#fff' : C.textSecondary} />
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

              {budgetWarning && (
                <View style={[st.budgetWarning, { borderColor: budgetWarning.color + '40' }]}>
                  <Ionicons name="warning" size={16} color={budgetWarning.color} />
                  <Text style={[st.budgetWarningText, { color: budgetWarning.color }]}>{budgetWarning.text}</Text>
                </View>
              )}

              {events.length > 0 && (
                <>
                  <Text style={st.pickerLabel}>Sự kiện (tùy chọn)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SIZES.sm }}>
                    <TouchableOpacity style={[st.chip, !form.eventId && st.chipActive]}
                      onPress={() => setForm((p) => ({ ...p, eventId: null }))}>
                      <Text style={[st.chipText, !form.eventId && { color: '#fff' }]}>Không</Text>
                    </TouchableOpacity>
                    {events.map((e) => (
                      <TouchableOpacity key={e.id} style={[st.chip, form.eventId === e.id && st.chipActive]}
                        onPress={() => setForm((p) => ({ ...p, eventId: e.id }))}>
                        <Text style={[st.chipText, form.eventId === e.id && { color: '#fff' }]}>
                          {e.icon || '📌'} {e.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              <View style={st.modalActions}>
                <TouchableOpacity style={st.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={st.cancelText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[st.saveBtn, {
                  backgroundColor: form.type === 'INCOME' ? C.income : form.type === 'LOAN' ? C.loan : C.primary,
                }]} onPress={handleCreate}>
                  <Text style={st.saveBtnText}>Lưu</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },

  // Header
  header: {
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: SIZES.md,
    backgroundColor: C.surface,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { color: C.text, fontSize: 20, fontWeight: '800' },
  headerActions: { flexDirection: 'row', gap: SIZES.sm },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.background, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.sm,
    backgroundColor: C.surface, paddingHorizontal: SIZES.md, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: C.text },

  // Wallet filter chips
  walletFilterScroll: { backgroundColor: C.surface, paddingVertical: 8, paddingHorizontal: SIZES.md },
  walletFilter: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: C.border, marginRight: SIZES.sm,
  },
  walletFilterActive: { backgroundColor: C.primary, borderColor: C.primary },
  walletFilterText: { color: C.textSecondary, fontSize: 12, fontWeight: '600' },

  // Month tabs
  tabContainer: { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  tabScroll: { paddingHorizontal: SIZES.sm },
  tab: { paddingHorizontal: SIZES.md, paddingVertical: 12, marginRight: 4 },
  tabActive: { borderBottomWidth: 3, borderBottomColor: C.primary },
  tabText: { color: C.textSecondary, fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: C.primary, fontWeight: '700' },

  // Summary
  summaryRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    paddingVertical: 12, paddingHorizontal: SIZES.md,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { color: C.textSecondary, fontSize: 11, fontWeight: '600', marginBottom: 2 },
  summaryValue: { fontSize: 13, fontWeight: '700' },
  summaryDivider: { width: 1, height: 30, backgroundColor: C.border },

  // List
  list: { paddingBottom: 80 },
  dateHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.md, paddingVertical: 10,
    backgroundColor: C.background,
  },
  dateLeft: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
  dateNumBox: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: C.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  dateNum: { fontSize: 16, fontWeight: '800', color: C.primary },
  dateMeta: {},
  dayName: { color: C.text, fontSize: 13, fontWeight: '700' },
  monthStr: { color: C.textSecondary, fontSize: 11 },
  dateTotal: { fontSize: 14, fontWeight: '700' },

  budgetWarning: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.surface, padding: 12, borderRadius: SIZES.radius,
    borderWidth: 1, marginTop: SIZES.md,
  },
  budgetWarningText: { fontSize: 13, fontWeight: '700' },

  txnItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SIZES.md, paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.borderLight,
  },
  txnIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  txnInfo: { flex: 1, marginLeft: SIZES.sm },
  txnCategory: { color: C.text, fontSize: 14, fontWeight: '600' },
  txnNote: { color: C.textSecondary, fontSize: 12, marginTop: 1 },
  txnWallet: { color: C.textLight, fontSize: 11, marginTop: 1 },
  txnAmount: { fontSize: 14, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', paddingVertical: SIZES.xxl, gap: SIZES.sm },
  empty: { color: C.textSecondary, fontSize: 15, textAlign: 'center', fontWeight: '500' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: C.surface, borderTopLeftRadius: SIZES.radiusLg,
    borderTopRightRadius: SIZES.radiusLg, padding: SIZES.lg, maxHeight: '88%',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: SIZES.md },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.text, textAlign: 'center', marginBottom: SIZES.md },
  typeRow: { flexDirection: 'row', gap: SIZES.xs, marginBottom: SIZES.md },
  typeBtn: {
    flex: 1, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusSm,
    borderWidth: 1.5, borderColor: C.border, alignItems: 'center',
  },
  typeBtnText: { fontWeight: '700', color: C.textSecondary, fontSize: 12 },
  loanSubRow: { flexDirection: 'row', gap: SIZES.sm, marginBottom: SIZES.md },
  loanSubBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: SIZES.sm,
    borderRadius: SIZES.radiusSm, borderWidth: 1.5, borderColor: C.border,
  },
  loanSubText: { fontWeight: '700', color: C.text, fontSize: 13 },
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
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.border, marginRight: SIZES.xs, marginBottom: SIZES.xs,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.text, fontWeight: '500' },
  modalActions: { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.md },
  cancelBtn: {
    flex: 1, padding: SIZES.md, borderRadius: SIZES.radius,
    borderWidth: 1.5, borderColor: C.border, alignItems: 'center',
  },
  cancelText: { color: C.textSecondary, fontWeight: '700', fontSize: 15 },
  saveBtn: { flex: 1, padding: SIZES.md, borderRadius: SIZES.radius, backgroundColor: C.primary, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  inputPicker: { backgroundColor: C.background, borderRadius: SIZES.radiusSm, borderWidth: 1, borderColor: C.border, padding: SIZES.md, marginBottom: SIZES.sm, justifyContent: 'center' },
  doneBtnIOS: { alignSelf: 'flex-end', marginBottom: SIZES.sm, marginRight: SIZES.sm },
  doneBtnTextIOS: { color: C.primary, fontWeight: '700' },
});
