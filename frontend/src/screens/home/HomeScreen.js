import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  Modal, TextInput, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SIZES, SHADOWS, WALLET_COLORS } from '../../constants/theme';
import { walletApi, reportApi, transactionApi, categoryApi, eventApi, notificationApi, authApi } from '../../api';
import { formatCurrency, getCurrentMonth, getCurrentYear, getCategoryIcon, getMonthRange } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { registerForPushNotificationsAsync } from '../../utils/pushNotifications';

const WALLET_ICONS = { CASH: 'cash', BANK_ACCOUNT: 'business', CREDIT_CARD: 'card', E_WALLET: 'phone-portrait' };
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const fmtLocal = (dt) => {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getWeekRange = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMon);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: fmtLocal(monday), end: fmtLocal(sunday) };
};

const getPrevWeekRange = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return getWeekRange(d);
};

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { isDark, colors } = useTheme();
  const C = colors || COLORS;

  const [totalBalance, setTotalBalance] = useState(0);
  const [wallets, setWallets] = useState([]);
  const [report, setReport] = useState(null);
  const [prevReport, setPrevReport] = useState(null);
  const [weekReport, setWeekReport] = useState(null);
  const [prevWeekReport, setPrevWeekReport] = useState(null);
  const [recentTxns, setRecentTxns] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [reportViewMode, setReportViewMode] = useState('Tháng');
  const [unreadCount, setUnreadCount] = useState(0);

  const [weekPeriods, setWeekPeriods] = useState([]);
  const [monthPeriods, setMonthPeriods] = useState([]);

  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [quickAddType, setQuickAddType] = useState('EXPENSE');
  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({
    amount: '', type: 'EXPENSE', note: '', transactionDate: fmtLocal(new Date()),
    categoryId: null, walletId: null, eventId: null,
  });

  const [transferVisible, setTransferVisible] = useState(false);
  const [transferForm, setTransferForm] = useState({ fromWalletId: null, toWalletId: null, amount: '', note: '' });
  const quickNoteInputRef = useRef(null);
  const transferNoteInputRef = useRef(null);

  const loadData = async () => {
    try {
      const curMonth = getCurrentMonth();
      const curYear = getCurrentYear();
      const prevMonth = curMonth === 1 ? 12 : curMonth - 1;
      const prevYear = curMonth === 1 ? curYear - 1 : curYear;
      const curWeek = getWeekRange();
      const prevWeek = getPrevWeekRange();

      const [balRes, walRes, repRes, prevRepRes, weekRes, prevWeekRes, txnRes, notiRes] = await Promise.all([
        walletApi.getTotalBalance(),
        walletApi.getAll(),
        reportApi.getMonthly(curMonth, curYear),
        reportApi.getMonthly(prevMonth, prevYear),
        reportApi.getByDateRange(curWeek.start, curWeek.end),
        reportApi.getByDateRange(prevWeek.start, prevWeek.end),
        transactionApi.getAll(0, 5),
        notificationApi.getUnreadCount().catch(() => ({ data: { count: 0 } })),
      ]);
      setTotalBalance(balRes.data?.totalBalance || 0);
      setWallets(walRes.data || []);
      setReport(repRes.data);
      setPrevReport(prevRepRes.data);
      setWeekReport(weekRes.data);
      setPrevWeekReport(prevWeekRes.data);
      setRecentTxns(txnRes.data?.content || txnRes.data || []);
      setUnreadCount(notiRes.data?.count || 0);

      // Last 4 weeks
      const weekRanges = [];
      for (let i = 3; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i * 7);
        const wr = getWeekRange(d);
        const sDate = new Date(wr.start + 'T00:00:00');
        const label = i === 0 ? 'T.này' : i === 1 ? 'T.trước'
          : `${String(sDate.getDate()).padStart(2,'0')}/${String(sDate.getMonth()+1).padStart(2,'0')}`;
        weekRanges.push({ ...wr, label });
      }
      const weekResults = await Promise.all(
        weekRanges.map(w => reportApi.getByDateRange(w.start, w.end).then(r => r.data).catch(() => null))
      );
      setWeekPeriods(weekRanges.map((w, i) => ({
        label: w.label,
        expense: Number(weekResults[i]?.totalExpense) || 0,
        income: Number(weekResults[i]?.totalIncome) || 0,
      })));

      // Last 6 months
      const monthRanges = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        let m = now.getMonth() + 1 - i, y = now.getFullYear();
        if (m <= 0) { m += 12; y -= 1; }
        const mr = getMonthRange(m, y);
        monthRanges.push({ start: mr.startDate, end: mr.endDate, label: i === 0 ? 'T.này' : `T${m}`, month: m, year: y });
      }
      const monthResults = await Promise.all(
        monthRanges.map(mr => reportApi.getByDateRange(mr.start, mr.end).then(r => r.data).catch(() => null))
      );
      setMonthPeriods(monthRanges.map((mr, i) => ({
        label: mr.label,
        expense: Number(monthResults[i]?.totalExpense) || 0,
        income: Number(monthResults[i]?.totalIncome) || 0,
      })));
    } catch (err) {
      console.error('Home load error:', err);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        authApi.updatePushToken(token).catch(console.error);
      }
    });
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openQuickAdd = async (type) => {
    setQuickAddType(type);
    setForm(f => ({ ...f, type, categoryId: null, eventId: null }));
    try {
      const [catRes, evtRes] = await Promise.all([categoryApi.getAll(), eventApi.getActive()]);
      setCategories(catRes.data || []);
      setEvents(evtRes.data || []);
    } catch (err) { console.error(err); }
    setQuickAddVisible(true);
  };

  const handleQuickAdd = async () => {
    if (!form.amount || !form.categoryId || !form.walletId) {
      alert('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    const amountVal = parseFloat(form.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('Số tiền phải lớn hơn 0');
      return;
    }

    const selectedDate = new Date(form.transactionDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    selectedDate.setHours(0,0,0,0);
    if (selectedDate > today) {
      alert('Ngày giao dịch không được vượt quá hôm nay');
      return;
    }
    try {
      const noteText = quickNoteInputRef.current?._lastNativeText || '';
      const payload = {
        amount: amountVal, type: form.type, note: noteText,
        transactionDate: form.transactionDate, categoryId: form.categoryId, walletId: form.walletId,
      };
      if (form.eventId) payload.eventId = form.eventId;
      await transactionApi.create(payload);
      setQuickAddVisible(false);
      if (quickNoteInputRef.current) quickNoteInputRef.current.clear();
      setForm({ amount: '', type: 'EXPENSE', note: '', transactionDate: fmtLocal(new Date()), categoryId: null, walletId: null, eventId: null });
      loadData();
    } catch (err) { console.error('Quick add error:', err); }
  };

  const handleTransfer = async () => {
    const { fromWalletId, toWalletId, amount } = transferForm;
    if (!fromWalletId || !toWalletId || !amount || fromWalletId === toWalletId) return;
    try {
      const transferNote = transferNoteInputRef.current?._lastNativeText || '';
      await walletApi.transfer({ fromWalletId, toWalletId, amount: parseFloat(amount), note: transferNote });
      setTransferVisible(false);
      if (transferNoteInputRef.current) transferNoteInputRef.current.clear();
      setTransferForm({ fromWalletId: null, toWalletId: null, amount: '', note: '' });
      loadData();
    } catch (err) { console.error('Transfer error:', err); }
  };

  const filteredCategories = categories.filter((c) => c.type === form.type);
  const activeReport = reportViewMode === 'Tuần' ? weekReport : report;
  const activePrevReport = reportViewMode === 'Tuần' ? prevWeekReport : prevReport;
  const curExpense = Number(activeReport?.totalExpense) || 0;
  const curIncome = Number(activeReport?.totalIncome) || 0;
  const prevExpense = Number(activePrevReport?.totalExpense) || 0;
  const expenseChange = prevExpense > 0 ? Math.round(((curExpense - prevExpense) / prevExpense) * 100) : 0;
  const chartPeriods = reportViewMode === 'Tuần' ? weekPeriods : monthPeriods;
  const chartHasData = chartPeriods.some(p => p.expense > 0 || p.income > 0);
  const formatChartVal = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(0) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
    return String(val);
  };

  const st = makeStyles(C);
  const initials = (user?.fullName || user?.username || 'U').slice(0, 2).toUpperCase();

  return (
    <View style={st.container}>
      {/* ===== HEADER ===== */}
      <View style={st.header}>
        <View style={st.headerLeft}>
          <View style={st.avatar}>
            <Text style={st.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={st.greeting}>Xin chào 👋</Text>
            <Text style={st.username}>{user?.fullName || user?.username || 'Bạn'}</Text>
          </View>
        </View>
        <View style={st.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions', { openSearch: true })} style={st.headerBtn}>
            <Ionicons name="search-outline" size={22} color={C.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={st.headerBtn}>
            <Ionicons name="notifications-outline" size={22} color={C.textSecondary} />
            {unreadCount > 0 && (
              <View style={st.badge}>
                <Text style={st.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} tintColor={C.primary} />}
      >
        {/* ===== BALANCE CARD ===== */}
        <View style={st.balanceCard}>
          <View style={st.balanceTop}>
            <Text style={st.balanceLabel}>Tổng số dư</Text>
            <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}>
              <Ionicons name={balanceVisible ? 'eye-outline' : 'eye-off-outline'} size={20} color={C.white} />
            </TouchableOpacity>
          </View>
          <Text style={st.balanceAmount}>
            {balanceVisible ? formatCurrency(totalBalance) : '••••••••'}
          </Text>
          {/* Income / Expense row */}
          <View style={st.balanceStatRow}>
            <View style={st.balanceStat}>
              <View style={st.balanceStatIcon}>
                <Ionicons name="arrow-down" size={14} color={C.income} />
              </View>
              <View>
                <Text style={st.balanceStatLabel}>Thu nhập</Text>
                <Text style={st.balanceStatValue}>{formatCurrency(curIncome)}</Text>
              </View>
            </View>
            <View style={[st.balanceStat, { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)', paddingLeft: SIZES.lg }]}>
              <View style={[st.balanceStatIcon, { backgroundColor: 'rgba(239,68,68,0.25)' }]}>
                <Ionicons name="arrow-up" size={14} color="#FCA5A5" />
              </View>
              <View>
                <Text style={st.balanceStatLabel}>Chi tiêu</Text>
                <Text style={st.balanceStatValue}>{formatCurrency(curExpense)}</Text>
              </View>
            </View>
          </View>
          {/* Quick actions */}
          <View style={st.quickActions}>
            <TouchableOpacity style={st.quickBtn} onPress={() => openQuickAdd('EXPENSE')}>
              <Ionicons name="remove-circle-outline" size={18} color={C.white} />
              <Text style={st.quickBtnText}>Chi tiêu</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.quickBtn} onPress={() => openQuickAdd('INCOME')}>
              <Ionicons name="add-circle-outline" size={18} color={C.white} />
              <Text style={st.quickBtnText}>Thu nhập</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.quickBtn} onPress={() => setTransferVisible(true)}>
              <Ionicons name="swap-horizontal-outline" size={18} color={C.white} />
              <Text style={st.quickBtnText}>Chuyển</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.quickBtn} onPress={() => navigation.navigate('Account', { screen: 'Reports' })}>
              <Ionicons name="bar-chart-outline" size={18} color={C.white} />
              <Text style={st.quickBtnText}>Báo cáo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== VÍ CỦA TÔI ===== */}
        <View style={st.section}>
          <View style={st.sectionHeader}>
            <Text style={st.sectionTitle}>Ví của tôi</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Account', { screen: 'Wallets' })}>
              <Text style={st.seeAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.walletScroll}>
            {wallets.length === 0 ? (
              <View style={st.walletCardEmpty}>
                <Ionicons name="wallet-outline" size={24} color={C.textLight} />
                <Text style={st.emptySmall}>Chưa có ví</Text>
              </View>
            ) : (
              wallets.map((w) => {
                const wc = WALLET_COLORS[w.type] || C.primary;
                return (
                  <View key={w.id} style={[st.walletCard, { backgroundColor: wc }]}>
                    <Ionicons name={WALLET_ICONS[w.type] || 'wallet'} size={22} color={C.white} />
                    <Text style={st.walletCardName} numberOfLines={1}>{w.name}</Text>
                    <Text style={st.walletCardBalance}>
                      {balanceVisible ? formatCurrency(w.balance) : '••••••'}
                    </Text>
                    <Text style={st.walletCardType}>
                      {w.type === 'CASH' ? 'Tiền mặt' : w.type === 'BANK_ACCOUNT' ? 'Ngân hàng' : w.type === 'CREDIT_CARD' ? 'Thẻ tín dụng' : 'Ví điện tử'}
                    </Text>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>

        {/* ===== BÁO CÁO ===== */}
        <View style={st.section}>
          <View style={st.sectionHeader}>
            <Text style={st.sectionTitle}>Báo cáo chi tiêu</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Account', { screen: 'Reports', params: { initialMode: reportViewMode } })}>
              <Text style={st.seeAll}>Xem báo cáo</Text>
            </TouchableOpacity>
          </View>
          <View style={st.card}>
            {/* Toggle */}
            <View style={st.toggleRow}>
              {['Tuần', 'Tháng'].map(mode => (
                <TouchableOpacity key={mode}
                  style={[st.toggleBtn, reportViewMode === mode && st.toggleBtnActive]}
                  onPress={() => setReportViewMode(mode)}>
                  <Text style={[st.toggleBtnText, reportViewMode === mode && st.toggleBtnTextActive]}>{mode}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Stats */}
            <View style={st.reportStats}>
              <View style={st.reportStatItem}>
                <Text style={st.reportStatLabel}>Tổng chi</Text>
                <Text style={[st.reportStatAmount, { color: C.expense }]}>{formatCurrency(curExpense)}</Text>
                {prevExpense > 0 && (
                  <View style={st.changeBadge}>
                    <Ionicons name={expenseChange <= 0 ? 'trending-down' : 'trending-up'} size={12}
                      color={expenseChange <= 0 ? C.income : C.expense} />
                    <Text style={[st.changePct, { color: expenseChange <= 0 ? C.income : C.expense }]}>
                      {Math.abs(expenseChange)}%
                    </Text>
                  </View>
                )}
              </View>
              <View style={[st.reportStatItem, { borderLeftWidth: 1, borderLeftColor: C.border, paddingLeft: SIZES.lg }]}>
                <Text style={st.reportStatLabel}>Tổng thu</Text>
                <Text style={[st.reportStatAmount, { color: C.income }]}>{formatCurrency(curIncome)}</Text>
              </View>
            </View>

            {/* Bar Chart */}
            {chartHasData && chartPeriods.length > 0 && (
              <View style={st.chartWrap}>
                <BarChart
                  data={{
                    labels: chartPeriods.map(p => p.label),
                    datasets: [{ data: chartPeriods.map(p => p.expense || 0) }],
                  }}
                  width={SCREEN_WIDTH - 80}
                  height={160}
                  fromZero
                  showValuesOnTopOfBars={false}
                  withInnerLines={false}
                  chartConfig={{
                    backgroundColor: C.surface,
                    backgroundGradientFrom: C.surface,
                    backgroundGradientTo: C.surface,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(99,102,241,${opacity})`,
                    labelColor: () => C.textSecondary,
                    barPercentage: 0.55,
                    formatYLabel: formatChartVal,
                    propsForLabels: { fontSize: 10 },
                    propsForBackgroundLines: { stroke: C.borderLight, strokeDasharray: '' },
                    fillShadowGradient: '#6366F1',
                    fillShadowGradientOpacity: 1,
                  }}
                  style={{ borderRadius: SIZES.radiusSm, marginTop: SIZES.sm }}
                />
              </View>
            )}
          </View>
        </View>

        {/* ===== GIAO DỊCH GẦN ĐÂY ===== */}
        <View style={st.section}>
          <View style={st.sectionHeader}>
            <Text style={st.sectionTitle}>Giao dịch gần đây</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={st.seeAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <View style={st.card}>
            {recentTxns.length === 0 ? (
              <View style={st.emptyContainer}>
                <Ionicons name="receipt-outline" size={36} color={C.textLight} />
                <Text style={st.emptyText}>Chưa có giao dịch nào</Text>
              </View>
            ) : (
              recentTxns.map((txn, idx) => (
                <TouchableOpacity key={txn.id} style={[st.txnRow, idx < recentTxns.length - 1 && st.txnBorder]}
                  onPress={() => navigation.navigate('Transactions', { screen: 'TransactionDetail', params: { transaction: txn } })}>
                  <View style={[st.txnIcon, { backgroundColor: txn.categoryColor || C.primary }]}>
                    <Ionicons name={getCategoryIcon(txn.categoryIcon)} size={16} color={C.white} />
                  </View>
                  <View style={st.txnInfo}>
                    <Text style={st.txnCategory}>{txn.categoryName}</Text>
                    {txn.note ? <Text style={st.txnNote} numberOfLines={1}>{txn.note}</Text> : null}
                    <Text style={st.txnDate}>
                      {new Date(txn.transactionDate).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long' })}
                    </Text>
                  </View>
                  <Text style={[st.txnAmount, {
                    color: txn.type === 'INCOME' ? C.income : txn.type === 'LOAN' ? C.loan : C.expense,
                  }]}>
                    {txn.type === 'INCOME' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ===== QUICK ADD MODAL ===== */}
      <Modal visible={quickAddVisible} animationType="slide" transparent>
        <View style={st.modalOverlay}>
          <View style={st.modalContent}>
            <ScrollView>
              <View style={st.modalHandle} />
              <Text style={st.modalTitle}>
                {quickAddType === 'INCOME' ? '💰 Thêm thu nhập' : '💸 Thêm chi tiêu'}
              </Text>

              {/* Amount */}
              <View style={st.amountInputWrap}>
                <TextInput style={st.amountInput} placeholder="0"
                  placeholderTextColor={C.textLight}
                  keyboardType="numeric" value={form.amount}
                  onChangeText={(v) => setForm((p) => ({ ...p, amount: v }))} />
                <Text style={st.amountCurrency}>đ</Text>
              </View>

              <TextInput ref={quickNoteInputRef} style={st.input} placeholder="Ghi chú..."
                placeholderTextColor={C.textLight} />
              <TextInput style={st.input} placeholder="Ngày (YYYY-MM-DD)"
                placeholderTextColor={C.textLight} autoCorrect={false}
                value={form.transactionDate}
                onChangeText={(v) => setForm((p) => ({ ...p, transactionDate: v }))} />

              <Text style={st.pickerLabel}>Ví thanh toán</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SIZES.sm }}>
                {wallets.map((w) => (
                  <TouchableOpacity key={w.id}
                    style={[st.chip, form.walletId === w.id && { backgroundColor: WALLET_COLORS[w.type] || C.primary, borderColor: 'transparent' }]}
                    onPress={() => setForm((p) => ({ ...p, walletId: w.id }))}>
                    <Ionicons name={WALLET_ICONS[w.type] || 'wallet'} size={14} color={form.walletId === w.id ? C.white : C.textSecondary} />
                    <Text style={[st.chipText, form.walletId === w.id && { color: C.white }]}>{w.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={st.pickerLabel}>Danh mục</Text>
              <View style={st.chipWrap}>
                {filteredCategories.map((c) => (
                  <TouchableOpacity key={c.id}
                    style={[st.chip, form.categoryId === c.id && { backgroundColor: c.color || C.primary, borderColor: 'transparent' }]}
                    onPress={() => setForm((p) => ({ ...p, categoryId: c.id }))}>
                    <Text style={[st.chipText, form.categoryId === c.id && { color: C.white }]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {events.length > 0 && (
                <>
                  <Text style={st.pickerLabel}>Sự kiện (tùy chọn)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SIZES.sm }}>
                    <TouchableOpacity style={[st.chip, !form.eventId && st.chipActive]}
                      onPress={() => setForm((p) => ({ ...p, eventId: null }))}>
                      <Text style={[st.chipText, !form.eventId && { color: C.white }]}>Không</Text>
                    </TouchableOpacity>
                    {events.map((e) => (
                      <TouchableOpacity key={e.id} style={[st.chip, form.eventId === e.id && st.chipActive]}
                        onPress={() => setForm((p) => ({ ...p, eventId: e.id }))}>
                        <Text style={[st.chipText, form.eventId === e.id && { color: C.white }]}>
                          {e.icon || '📌'} {e.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              <View style={st.modalActions}>
                <TouchableOpacity style={st.cancelBtn} onPress={() => setQuickAddVisible(false)}>
                  <Text style={st.cancelText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[st.saveBtn, { backgroundColor: quickAddType === 'INCOME' ? C.income : C.primary }]} onPress={handleQuickAdd}>
                  <Text style={st.saveBtnText}>Lưu</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ===== TRANSFER MODAL ===== */}
      <Modal visible={transferVisible} animationType="slide" transparent>
        <View style={st.modalOverlay}>
          <View style={st.modalContent}>
            <ScrollView>
              <View style={st.modalHandle} />
              <Text style={st.modalTitle}>↔️ Chuyển tiền</Text>

              <TextInput style={st.amountInputWrap} />
              <View style={st.amountInputWrap}>
                <TextInput style={st.amountInput} placeholder="0" placeholderTextColor={C.textLight}
                  keyboardType="numeric" value={transferForm.amount}
                  onChangeText={(v) => setTransferForm((p) => ({ ...p, amount: v }))} />
                <Text style={st.amountCurrency}>đ</Text>
              </View>

              <Text style={st.pickerLabel}>Từ ví</Text>
              <View style={st.chipWrap}>
                {wallets.map((w) => (
                  <TouchableOpacity key={w.id}
                    style={[st.chip, transferForm.fromWalletId === w.id && st.chipActive]}
                    onPress={() => setTransferForm((p) => ({ ...p, fromWalletId: w.id }))}>
                    <Text style={[st.chipText, transferForm.fromWalletId === w.id && { color: C.white }]}>{w.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={st.pickerLabel}>Đến ví</Text>
              <View style={st.chipWrap}>
                {wallets.map((w) => (
                  <TouchableOpacity key={w.id}
                    style={[st.chip, transferForm.toWalletId === w.id && st.chipActive]}
                    onPress={() => setTransferForm((p) => ({ ...p, toWalletId: w.id }))}>
                    <Text style={[st.chipText, transferForm.toWalletId === w.id && { color: C.white }]}>{w.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput ref={transferNoteInputRef} style={st.input} placeholder="Ghi chú"
                placeholderTextColor={C.textLight} />

              <View style={st.modalActions}>
                <TouchableOpacity style={st.cancelBtn} onPress={() => setTransferVisible(false)}>
                  <Text style={st.cancelText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={st.saveBtn} onPress={handleTransfer}>
                  <Text style={st.saveBtnText}>Chuyển</Text>
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: SIZES.md,
    backgroundColor: C.background,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: C.white, fontWeight: '800', fontSize: 15 },
  greeting: { color: C.textSecondary, fontSize: 12 },
  username: { color: C.text, fontSize: 15, fontWeight: '700' },
  headerRight: { flexDirection: 'row', gap: 4 },
  headerBtn: { padding: 8, borderRadius: 20, backgroundColor: C.surface, ...SHADOWS.xs, marginLeft: 6, position: 'relative' },
  badge: {
    position: 'absolute', top: 2, right: 2, backgroundColor: COLORS.error,
    borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },

  // Balance Card (gradient simulation)
  balanceCard: {
    backgroundColor: C.primary,
    marginHorizontal: SIZES.md,
    marginBottom: SIZES.sm,
    borderRadius: SIZES.radius,
    padding: SIZES.lg,
    ...SHADOWS.lg,
  },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  balanceLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  balanceAmount: { color: C.white, fontSize: 30, fontWeight: '800', marginBottom: SIZES.md },
  balanceStatRow: { flexDirection: 'row', marginBottom: SIZES.md },
  balanceStat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SIZES.xs },
  balanceStatIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(16,185,129,0.25)', alignItems: 'center', justifyContent: 'center' },
  balanceStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  balanceStatValue: { color: C.white, fontSize: 13, fontWeight: '700' },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: SIZES.xs },
  quickBtn: { alignItems: 'center', gap: 4, flex: 1 },
  quickBtnText: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600' },

  // Sections
  section: { marginBottom: SIZES.sm },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.xs, marginBottom: 4,
  },
  sectionTitle: { color: C.text, fontSize: 15, fontWeight: '700' },
  seeAll: { color: C.primary, fontSize: 13, fontWeight: '600' },

  // Wallet horizontally scrolling cards
  walletScroll: { paddingLeft: SIZES.md },
  walletCard: {
    width: 140, borderRadius: SIZES.radius, padding: SIZES.md,
    marginRight: SIZES.sm, gap: 4, ...SHADOWS.md,
  },
  walletCardEmpty: {
    width: 140, height: 90, borderRadius: SIZES.radius, borderWidth: 1.5, borderColor: C.border,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6, marginRight: SIZES.sm,
  },
  walletCardName: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600', marginTop: 6 },
  walletCardBalance: { color: C.white, fontSize: 16, fontWeight: '800' },
  walletCardType: { color: 'rgba(255,255,255,0.65)', fontSize: 10, marginTop: 2 },
  emptySmall: { color: C.textLight, fontSize: 13 },

  // Card container
  card: {
    backgroundColor: C.card, borderRadius: SIZES.radius,
    marginHorizontal: SIZES.md, padding: SIZES.md, ...SHADOWS.sm,
  },

  // Report
  toggleRow: {
    flexDirection: 'row', backgroundColor: C.background, borderRadius: SIZES.radiusSm,
    padding: 3, marginBottom: SIZES.md, alignSelf: 'flex-start',
  },
  toggleBtn: { paddingHorizontal: SIZES.lg, paddingVertical: 7, borderRadius: SIZES.radiusXs },
  toggleBtnActive: { backgroundColor: C.primary, ...SHADOWS.xs },
  toggleBtnText: { color: C.textSecondary, fontSize: 13, fontWeight: '600' },
  toggleBtnTextActive: { color: C.white },
  reportStats: { flexDirection: 'row', marginBottom: SIZES.sm },
  reportStatItem: { flex: 1 },
  reportStatLabel: { color: C.textSecondary, fontSize: 12 },
  reportStatAmount: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  changeBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  changePct: { fontSize: 12, fontWeight: '700' },
  chartWrap: { alignItems: 'center' },

  // Transactions
  txnRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  txnBorder: { borderBottomWidth: 1, borderBottomColor: C.borderLight },
  txnIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  txnInfo: { flex: 1, marginLeft: SIZES.sm },
  txnCategory: { color: C.text, fontSize: 14, fontWeight: '600' },
  txnNote: { color: C.textSecondary, fontSize: 12, marginTop: 1 },
  txnDate: { color: C.textLight, fontSize: 11, marginTop: 1 },
  txnAmount: { fontSize: 14, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', paddingVertical: SIZES.lg, gap: SIZES.sm },
  emptyText: { color: C.textLight, fontSize: 14 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: C.surface, borderTopLeftRadius: SIZES.radiusLg, borderTopRightRadius: SIZES.radiusLg,
    padding: SIZES.lg, maxHeight: '88%',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: SIZES.md },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.text, textAlign: 'center', marginBottom: SIZES.md },
  amountInputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.primaryBg,
    borderRadius: SIZES.radius, padding: SIZES.md, marginBottom: SIZES.sm,
  },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '800', color: C.primary },
  amountCurrency: { fontSize: 18, fontWeight: '700', color: C.primary, marginLeft: 4 },
  input: {
    backgroundColor: C.background, borderRadius: SIZES.radiusSm, borderWidth: 1,
    borderColor: C.border, padding: SIZES.md, fontSize: 15, marginBottom: SIZES.sm, color: C.text,
  },
  pickerLabel: { color: C.text, fontSize: 13, fontWeight: '600', marginBottom: SIZES.xs, marginTop: SIZES.xs },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.xs, marginBottom: SIZES.sm },
  chip: {
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderRadius: SIZES.radius,
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
  saveBtnText: { color: C.white, fontWeight: '800', fontSize: 15 },
});
