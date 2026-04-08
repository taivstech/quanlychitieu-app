import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Circle as SvgCircle, G } from 'react-native-svg';
import { BarChart } from 'react-native-chart-kit';
import { COLORS, SIZES } from '../../constants/theme';
import { reportApi, transactionApi, walletApi } from '../../api';
import { formatCurrency, getCurrentMonth, getCurrentYear, getCategoryIcon } from '../../utils/helpers';
import { useTheme } from '../../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Helpers ──

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
    let m = curM - i, y = curY;
    if (m <= 0) { m += 12; y -= 1; }
    tabs.push({ label: `${String(m).padStart(2, '0')}/${y}`, month: m, year: y });
  }
  const prevM = curM === 1 ? 12 : curM - 1;
  const prevY = curM === 1 ? curY - 1 : curY;
  tabs.push({ label: 'THÁNG TRƯỚC', month: prevM, year: prevY });
  tabs.push({ label: 'THÁNG NÀY', month: curM, year: curY });
  return tabs;
}

function getMonthRange(month, year) {
  const s = `${year}-${String(month).padStart(2, '0')}-01`;
  const last = new Date(year, month, 0).getDate();
  return { start: s, end: `${year}-${String(month).padStart(2, '0')}-${String(last).padStart(2, '0')}` };
}

function getWeekRange(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMon);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: fmtLocal(monday), end: fmtLocal(sunday) };
}

function generateWeekTabs() {
  const tabs = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i * 7);
    const range = getWeekRange(d);
    const start = new Date(range.start + 'T00:00:00');
    const end = new Date(range.end + 'T00:00:00');
    const fmt = (dt) => `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`;
    let label;
    if (i === 0) label = 'TUẦN NÀY';
    else if (i === 1) label = 'TUẦN TRƯỚC';
    else label = `${fmt(start)} - ${fmt(end)}`;
    tabs.push({ label, ...range });
  }
  return tabs;
}

function groupByDate(transactions) {
  const groups = {};
  transactions.forEach((txn) => {
    const date = txn.transactionDate;
    if (!groups[date]) groups[date] = { date, transactions: [], totalExpense: 0, totalIncome: 0 };
    groups[date].transactions.push(txn);
    if (txn.type === 'EXPENSE') groups[date].totalExpense += Number(txn.amount) || 0;
    else if (txn.type === 'INCOME') groups[date].totalIncome += Number(txn.amount) || 0;
    else if (txn.type === 'LOAN') {
      if (txn.categoryName === 'Cho vay') groups[date].totalExpense += Number(txn.amount) || 0;
      else groups[date].totalIncome += Number(txn.amount) || 0;
    }
  });
  return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
}

function formatDayHeader(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today - d) / (1000 * 60 * 60 * 24));
  const dayOfWeek = d.toLocaleDateString('vi-VN', { weekday: 'long' });
  const dayMonthYear = d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
  if (diff === 0) return { main: 'Hôm nay', sub: dayMonthYear };
  if (diff === 1) return { main: 'Hôm qua', sub: dayMonthYear };
  return { main: dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1), sub: dayMonthYear };
}

// ── Donut Chart Component ──

const DONUT_SIZE = 160;
const DONUT_STROKE = 28;
const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE) / 2;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

function DonutChart({ data, centerLabel, centerValue }) {
  let cumulativeAngle = 0;
  const arcs = data.map((item) => {
    const angle = (item.percentage / 100) * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    return { ...item, startAngle, angle };
  });

  const describeArc = (cx, cy, r, startAngle, endAngle) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  const polarToCartesian = (cx, cy, r, angleDeg) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const center = DONUT_SIZE / 2;

  return (
    <View style={{ alignItems: 'center', marginVertical: SIZES.sm }}>
      <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
        {/* Background circle */}
        <SvgCircle cx={center} cy={center} r={DONUT_RADIUS} stroke={COLORS.border}
          strokeWidth={DONUT_STROKE} fill="none" />
        {arcs.map((arc, i) =>
          arc.angle > 0.5 ? (
            <Path key={i} d={describeArc(center, center, DONUT_RADIUS, arc.startAngle, arc.startAngle + arc.angle)}
              stroke={arc.color || COLORS.gray} strokeWidth={DONUT_STROKE} fill="none" strokeLinecap="butt" />
          ) : null
        )}
      </Svg>
      <View style={styles.donutCenter}>
        <Text style={styles.donutCenterLabel}>{centerLabel}</Text>
        <Text style={styles.donutCenterValue} numberOfLines={1}>{centerValue}</Text>
      </View>
    </View>
  );
}

// ── Component ──

export default function ReportDetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const C = colors || COLORS;
  const initialMode = route?.params?.initialMode || 'Tháng';
  const [viewMode, setViewMode] = useState(initialMode);
  const [reportView, setReportView] = useState('Chi tiết'); // 'Chi tiết' | 'Xu hướng'
  const [report, setReport] = useState(null);
  const [trendPeriods, setTrendPeriods] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const monthTabs = useMemo(() => generateMonthTabs(), []);
  const weekTabs = useMemo(() => generateWeekTabs(), []);

  const [selectedMonthTab, setSelectedMonthTab] = useState(monthTabs.length - 1);
  const [selectedWeekTab, setSelectedWeekTab] = useState(weekTabs.length - 1);

  const tabScrollRef = useRef(null);
  const initialScrollDone = useRef(false);

  const isWeek = viewMode === 'Tuần';
  const activeTabs = isWeek ? weekTabs : monthTabs;
  const selectedTab = isWeek ? selectedWeekTab : selectedMonthTab;
  const setSelectedTab = isWeek ? setSelectedWeekTab : setSelectedMonthTab;
  const currentTab = activeTabs[selectedTab];

  const getDateRange = useCallback(() => {
    if (isWeek) return { start: currentTab.start, end: currentTab.end };
    return getMonthRange(currentTab.month, currentTab.year);
  }, [isWeek, currentTab]);

  const loadData = async () => {
    try {
      const range = getDateRange();
      const [repRes, txnRes, balRes] = await Promise.all([
        reportApi.getByDateRange(range.start, range.end),
        transactionApi.getByDateRange(range.start, range.end),
        walletApi.getTotalBalance(),
      ]);
      setReport(repRes.data);
      setTransactions(txnRes.data || []);
      setTotalBalance(balRes.data?.totalBalance || 0);

      // Load trend comparison: fetch last 6 periods centered around selected tab
      const periods = [];
      if (isWeek) {
        // Use the selected tab's week as anchor
        const anchorDate = new Date(range.start + 'T00:00:00');
        for (let i = 5; i >= 0; i--) {
          const d = new Date(anchorDate);
          d.setDate(anchorDate.getDate() - i * 7);
          const wr = getWeekRange(d);
          const sDate = new Date(wr.start + 'T00:00:00');
          const eDate = new Date(wr.end + 'T00:00:00');
          const fmtD = (dt) => `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}`;
          const label = i === 0 ? 'Tuần chọn'
            : `${fmtD(sDate)}-${fmtD(eDate)}`;
          periods.push({ ...wr, label });
        }
      } else {
        // Use the selected tab's month as anchor
        const anchorM = currentTab.month;
        const anchorY = currentTab.year;
        for (let i = 5; i >= 0; i--) {
          let m = anchorM - i, y = anchorY;
          while (m <= 0) { m += 12; y -= 1; }
          const mr = getMonthRange(m, y);
          const label = i === 0 ? 'T.chọn' : `T${m}`;
          periods.push({ start: mr.start, end: mr.end, label, month: m, year: y });
        }
      }
      const periodReports = await Promise.all(
        periods.map(p => reportApi.getByDateRange(p.start, p.end).then(r => r.data).catch(() => null))
      );
      setTrendPeriods(periods.map((p, i) => ({
        ...p,
        income: Number(periodReports[i]?.totalIncome) || 0,
        expense: Number(periodReports[i]?.totalExpense) || 0,
        net: (Number(periodReports[i]?.totalIncome) || 0) - (Number(periodReports[i]?.totalExpense) || 0),
      })));
    } catch (err) {
      console.error('Report load error:', err);
    }
  };

  useFocusEffect(useCallback(() => {
    loadData();
    if (!initialScrollDone.current) {
      initialScrollDone.current = true;
      setTimeout(() => {
        const idx = activeTabs.length - 1;
        tabScrollRef.current?.scrollTo({ x: Math.max(0, idx * 120 - SCREEN_WIDTH / 2 + 60), animated: false });
      }, 100);
    }
  }, [selectedTab, viewMode]));

  useEffect(() => {
    initialScrollDone.current = false;
    const idx = isWeek ? weekTabs.length - 1 : monthTabs.length - 1;
    setSelectedTab(idx);
    setTimeout(() => {
      tabScrollRef.current?.scrollTo({ x: Math.max(0, idx * 120 - SCREEN_WIDTH / 2 + 60), animated: true });
      initialScrollDone.current = true;
    }, 150);
  }, [viewMode]);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const onTabSelect = (index) => {
    setSelectedTab(index);
    tabScrollRef.current?.scrollTo({ x: Math.max(0, index * 120 - SCREEN_WIDTH / 2 + 60), animated: true });
  };

  // Computed values
  const totalIncome = Number(report?.totalIncome) || 0;
  const totalExpense = Number(report?.totalExpense) || 0;
  const netAmount = totalIncome - totalExpense;
  const openingBalance = Number(report?.openingBalance) || 0;
  const endingBalance = Number(report?.endingBalance) || 0;
  const dailyAvgExpense = Number(report?.dailyAverageExpense) || 0;
  const expenseByCategory = report?.expenseByCategory || [];
  const incomeByCategory = report?.incomeByCategory || [];
  const dailyGroups = groupByDate(transactions);

  // Separate loan transactions
  const loanTransactions = transactions.filter(t => t.type === 'LOAN');
  const loanBorrow = loanTransactions.filter(t => t.categoryName !== 'Cho vay');
  const loanLend = loanTransactions.filter(t => t.categoryName === 'Cho vay');
  const totalLoanBorrow = loanBorrow.reduce((s, t) => s + Number(t.amount), 0);
  const totalLoanLend = loanLend.reduce((s, t) => s + Number(t.amount), 0);

  const navigateToCategory = (cat) => {
    const range = getDateRange();
    navigation.navigate('CategoryDetail', {
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      categoryColor: cat.categoryColor,
      categoryIcon: cat.categoryIcon,
      startDate: range.start,
      endDate: range.end,
      periodLabel: isWeek ? 'Tuần này' : 'Tháng này',
    });
  };

  // Prepare donut data for expense
  const expenseDonutData = expenseByCategory.map(cat => ({
    color: cat.categoryColor || COLORS.gray,
    percentage: Number(cat.percentage) || 0,
  }));

  const incomeDonutData = incomeByCategory.map(cat => ({
    color: cat.categoryColor || COLORS.gray,
    percentage: Number(cat.percentage) || 0,
  }));

  // Trend chart data — compare periods
  const barChartData = trendPeriods.length > 0 ? {
    labels: trendPeriods.map(p => p.label),
    datasets: [
      { data: trendPeriods.map(p => p.expense || 0) },
    ],
  } : null;
  const trendTotalIncome = trendPeriods.reduce((s, p) => s + p.income, 0);
  const trendTotalExpense = trendPeriods.reduce((s, p) => s + p.expense, 0);

  // ─── Render ───

  const renderDetailView = () => (
    <>
      {/* Balance Summary — Money Lover style */}
      <View style={styles.card}>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Số dư đầu</Text>
          <Text style={styles.balanceValue}>{formatCurrency(openingBalance)}</Text>
        </View>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Số dư cuối</Text>
          <Text style={[styles.balanceValue, { fontWeight: '700' }]}>{formatCurrency(endingBalance)}</Text>
        </View>
        <View style={[styles.balanceRow, styles.balanceDivider]} />
      </View>

      {/* Net Income section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Thu nhập ròng</Text>
        <View style={styles.netIncomeRow}>
          <View style={styles.netBar}>
            <View style={[styles.netBarSegment, {
              backgroundColor: COLORS.income,
              flex: Math.max(totalIncome, 1),
            }]} />
          </View>
          <Text style={[styles.netBarLabel, { color: COLORS.income }]}>+{formatCurrency(totalIncome)}</Text>
        </View>
        <View style={styles.netIncomeRow}>
          <View style={styles.netBar}>
            <View style={[styles.netBarSegment, {
              backgroundColor: COLORS.expense,
              flex: Math.max(totalExpense, 1),
            }]} />
          </View>
          <Text style={[styles.netBarLabel, { color: COLORS.expense }]}>-{formatCurrency(totalExpense)}</Text>
        </View>
        <View style={styles.netTotalRow}>
          <Text style={styles.summaryLabel}>Tổng cộng</Text>
          <Text style={[styles.netTotalAmount, { color: netAmount >= 0 ? COLORS.income : COLORS.expense }]}>
            {netAmount >= 0 ? '+' : ''}{formatCurrency(netAmount)}
          </Text>
        </View>
        <Text style={styles.avgText}>Chi tiêu trung bình/ngày: {formatCurrency(dailyAvgExpense)}</Text>
      </View>

      {/* Expense by Category with Donut */}
      {expenseByCategory.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Báo cáo chi tiêu</Text>
          <DonutChart
            data={expenseDonutData}
            centerLabel="Tổng chi"
            centerValue={formatCurrency(totalExpense)}
          />
          {expenseByCategory.map((cat, idx) => {
            const pct = Number(cat.percentage) || 0;
            return (
              <TouchableOpacity key={idx} style={styles.catRow} onPress={() => navigateToCategory(cat)}>
                <View style={[styles.catDot, { backgroundColor: cat.categoryColor || COLORS.gray }]}>
                  <Ionicons name={getCategoryIcon(cat.categoryIcon)} size={16} color={COLORS.white} />
                </View>
                <View style={styles.catInfo}>
                  <Text style={styles.catName} numberOfLines={1}>{cat.categoryName}</Text>
                  <View style={styles.catBarBg}>
                    <View style={[styles.catBarFill, {
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: cat.categoryColor || COLORS.expense,
                    }]} />
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.catAmount}>{formatCurrency(cat.amount)}</Text>
                  <Text style={styles.catPct}>{pct.toFixed(1)}%</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Income by Category with Donut */}
      {incomeByCategory.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Báo cáo thu nhập</Text>
          <DonutChart
            data={incomeDonutData}
            centerLabel="Tổng thu"
            centerValue={formatCurrency(totalIncome)}
          />
          {incomeByCategory.map((cat, idx) => {
            const pct = Number(cat.percentage) || 0;
            return (
              <TouchableOpacity key={idx} style={styles.catRow} onPress={() => navigateToCategory(cat)}>
                <View style={[styles.catDot, { backgroundColor: cat.categoryColor || COLORS.gray }]}>
                  <Ionicons name={getCategoryIcon(cat.categoryIcon)} size={16} color={COLORS.white} />
                </View>
                <View style={styles.catInfo}>
                  <Text style={styles.catName} numberOfLines={1}>{cat.categoryName}</Text>
                  <View style={styles.catBarBg}>
                    <View style={[styles.catBarFill, {
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: cat.categoryColor || COLORS.income,
                    }]} />
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.catAmount, { color: COLORS.income }]}>{formatCurrency(cat.amount)}</Text>
                  <Text style={styles.catPct}>{pct.toFixed(1)}%</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Loan Section */}
      {loanTransactions.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nợ / Cho vay</Text>
          {totalLoanBorrow > 0 && (
            <View style={styles.loanRow}>
              <Ionicons name="arrow-down-circle" size={20} color="#FF6B9D" />
              <Text style={styles.loanLabel}>Đi vay</Text>
              <Text style={[styles.loanAmount, { color: '#FF6B9D' }]}>+{formatCurrency(totalLoanBorrow)}</Text>
            </View>
          )}
          {totalLoanLend > 0 && (
            <View style={styles.loanRow}>
              <Ionicons name="arrow-up-circle" size={20} color={COLORS.warning} />
              <Text style={styles.loanLabel}>Cho vay</Text>
              <Text style={[styles.loanAmount, { color: COLORS.warning }]}>-{formatCurrency(totalLoanLend)}</Text>
            </View>
          )}
          <View style={[styles.loanRow, { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SIZES.sm }]}>
            <Text style={styles.loanLabel}>Tổng nợ ròng</Text>
            <Text style={[styles.loanAmount, { color: COLORS.text, fontWeight: '700' }]}>
              {formatCurrency(totalLoanBorrow - totalLoanLend)}
            </Text>
          </View>
        </View>
      )}

      {/* Daily transaction groups */}
      <Text style={styles.sectionLabel}>Chi tiết giao dịch</Text>
      {dailyGroups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={48} color={COLORS.textLight} />
          <Text style={styles.emptyText}>Không có giao dịch</Text>
        </View>
      ) : (
        dailyGroups.map((group) => {
          const header = formatDayHeader(group.date);
          return (
            <View key={group.date} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <View>
                  <Text style={styles.dayMain}>{header.main}</Text>
                  <Text style={styles.daySub}>{header.sub}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  {group.totalExpense > 0 && (
                    <Text style={[styles.dayTotal, { color: COLORS.expense }]}>
                      -{formatCurrency(group.totalExpense)}
                    </Text>
                  )}
                  {group.totalIncome > 0 && (
                    <Text style={[styles.dayTotal, { color: COLORS.income }]}>
                      +{formatCurrency(group.totalIncome)}
                    </Text>
                  )}
                </View>
              </View>
              {group.transactions.map((txn) => (
                <TouchableOpacity 
                  key={txn.id} 
                  style={styles.txnRow}
                  onPress={() => navigation.navigate('TransactionDetail', { transaction: txn })}
                >
                  <View style={[styles.txnIcon, { backgroundColor: txn.categoryColor || COLORS.gray }]}>
                    <Ionicons name={getCategoryIcon(txn.categoryIcon)} size={16} color={COLORS.white} />
                  </View>
                  <View style={styles.txnInfo}>
                    <Text style={styles.txnCategory}>{txn.categoryName}</Text>
                    <Text style={styles.txnNote} numberOfLines={1}>{txn.note || ''}</Text>
                  </View>
                  <Text style={[styles.txnAmount, {
                    color: txn.type === 'INCOME' ? COLORS.income
                      : txn.type === 'LOAN' ? '#FF6B9D'
                      : COLORS.expense,
                  }]}>
                    {txn.type === 'INCOME' || (txn.type === 'LOAN' && txn.categoryName !== 'Cho vay') ? '+' : '-'}{formatCurrency(txn.amount)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          );
        })
      )}
    </>
  );

  const renderTrendView = () => (
    <>
      {/* Summary of all trend periods */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Xu hướng {isWeek ? 'theo tuần' : 'theo tháng'}</Text>
        <View style={styles.trendSummaryRow}>
          <View style={styles.trendSummaryItem}>
            <Text style={styles.summaryLabel}>Tổng thu (6 kỳ)</Text>
            <Text style={[styles.trendAmount, { color: COLORS.income }]}>
              {formatCurrency(trendTotalIncome)}
            </Text>
          </View>
          <View style={styles.trendSummaryItem}>
            <Text style={styles.summaryLabel}>Tổng chi (6 kỳ)</Text>
            <Text style={[styles.trendAmount, { color: COLORS.expense }]}>
              {formatCurrency(trendTotalExpense)}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: SIZES.sm, paddingTop: SIZES.sm, borderTopWidth: 1, borderTopColor: COLORS.border }}>
          <Text style={styles.summaryLabel}>Chênh lệch</Text>
          <Text style={[styles.trendAmount, { color: (trendTotalIncome - trendTotalExpense) >= 0 ? COLORS.income : COLORS.expense }]}>
            {(trendTotalIncome - trendTotalExpense) >= 0 ? '+' : ''}{formatCurrency(trendTotalIncome - trendTotalExpense)}
          </Text>
        </View>
      </View>

      {/* Bar Chart — compare across periods */}
      {barChartData && trendPeriods.length > 0 ? (
        <View style={styles.card}>
          <BarChart
            data={barChartData}
            width={SCREEN_WIDTH - SIZES.md * 4}
            height={220}
            fromZero
            showValuesOnTopOfBars={false}
            withInnerLines
            chartConfig={{
              backgroundColor: COLORS.surface,
              backgroundGradientFrom: COLORS.surface,
              backgroundGradientTo: COLORS.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
              labelColor: () => COLORS.textSecondary,
              barPercentage: 0.5,
              propsForLabels: { fontSize: 10 },
              propsForBackgroundLines: { stroke: COLORS.border, strokeDasharray: '4,4' },
              formatYLabel: (v) => {
                const n = Number(v);
                if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
                if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
                return String(n);
              },
            }}
            style={{ borderRadius: SIZES.radiusSm }}
          />
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="bar-chart-outline" size={48} color={COLORS.textLight} />
          <Text style={styles.emptyText}>Chưa có dữ liệu xu hướng</Text>
        </View>
      )}

      {/* Period breakdown list */}
      {trendPeriods.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Chi tiết {isWeek ? 'theo tuần' : 'theo tháng'}</Text>
          {trendPeriods.map((p, i) => (
            <View key={i} style={styles.weekRow}>
              <Text style={styles.weekLabel}>{p.label}</Text>
              <View style={styles.weekAmounts}>
                <Text style={[styles.weekAmount, { color: COLORS.income }]}>+{formatCurrency(p.income)}</Text>
                <Text style={[styles.weekAmount, { color: COLORS.expense }]}>-{formatCurrency(p.expense)}</Text>
              </View>
              <Text style={[styles.weekNet, {
                color: p.net >= 0 ? COLORS.income : COLORS.expense,
              }]}>
                {p.net >= 0 ? '+' : ''}{formatCurrency(p.net)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>📊 Báo cáo</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tuần/Tháng Toggle */}
      <View style={styles.toggleContainer}>
        <View style={styles.toggleRow}>
          {['Tuần', 'Tháng'].map(mode => (
            <TouchableOpacity key={mode}
              style={[styles.toggleBtn, viewMode === mode && styles.toggleBtnActive]}
              onPress={() => setViewMode(mode)}>
              <Text style={[styles.toggleBtnText, viewMode === mode && styles.toggleBtnTextActive]}>{mode}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Period tabs */}
      <View style={styles.tabContainer}>
        <ScrollView ref={tabScrollRef} horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}>
          {activeTabs.map((tab, i) => (
            <TouchableOpacity key={i} style={[styles.tab, selectedTab === i && styles.tabActive]}
              onPress={() => onTabSelect(i)}>
              <Text style={[styles.tabText, selectedTab === i && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.jumpBtn}
          onPress={() => onTabSelect(activeTabs.length - 1)}>
          <Ionicons name="play-forward" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Chi tiết / Xu hướng Toggle */}
      <View style={styles.subToggleContainer}>
        {['Chi tiết', 'Xu hướng'].map(mode => (
          <TouchableOpacity key={mode}
            style={[styles.subToggleBtn, reportView === mode && styles.subToggleBtnActive]}
            onPress={() => setReportView(mode)}>
            <Ionicons name={mode === 'Chi tiết' ? 'list' : 'trending-up'} size={16}
              color={reportView === mode ? COLORS.primary : COLORS.textSecondary} />
            <Text style={[styles.subToggleText, reportView === mode && styles.subToggleTextActive]}>{mode}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        contentContainerStyle={styles.content}
      >
        {reportView === 'Chi tiết' ? renderDetailView() : renderTrendView()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 52, paddingBottom: 10, paddingHorizontal: SIZES.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  backBtn: { width: 36 },
  headerTitle: { fontSize: 18, fontWeight: '700' },

  // Toggle
  toggleContainer: { paddingHorizontal: SIZES.lg, paddingBottom: SIZES.sm },
  toggleRow: {
    flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: SIZES.radiusSm,
    padding: 3,
  },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: SIZES.radiusSm },
  toggleBtnActive: { backgroundColor: COLORS.primary },
  toggleBtnText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '500' },
  toggleBtnTextActive: { color: COLORS.white, fontWeight: '600' },

  // Sub toggle (Chi tiết / Xu hướng)
  subToggleContainer: {
    flexDirection: 'row', paddingHorizontal: SIZES.md, paddingVertical: SIZES.xs,
    gap: SIZES.md, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  subToggleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: SIZES.xs, paddingHorizontal: SIZES.sm,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  subToggleBtnActive: { borderBottomColor: COLORS.primary },
  subToggleText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },
  subToggleTextActive: { color: COLORS.primary, fontWeight: '600' },

  // Tabs
  tabContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabScroll: { paddingHorizontal: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 12 },
  tabActive: { borderBottomWidth: 3, borderBottomColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: COLORS.text, fontWeight: '700' },
  jumpBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },

  content: { padding: SIZES.md },

  // Card
  card: { backgroundColor: COLORS.surface, borderRadius: SIZES.radius, padding: SIZES.md, marginBottom: SIZES.md },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: SIZES.sm },

  // Balance section
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  balanceLabel: { color: COLORS.textSecondary, fontSize: 14 },
  balanceValue: { color: COLORS.text, fontSize: 14 },
  balanceDivider: { borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 4 },

  // Net income
  netIncomeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.xs },
  netBar: { flex: 1, height: 14, backgroundColor: COLORS.border, borderRadius: 7, overflow: 'hidden', marginRight: SIZES.sm },
  netBarSegment: { height: '100%', borderRadius: 7 },
  netBarLabel: { fontSize: 13, fontWeight: '600', width: 120, textAlign: 'right' },
  netTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: SIZES.sm, paddingTop: SIZES.sm, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  netTotalAmount: { fontSize: 16, fontWeight: '700' },
  summaryLabel: { color: COLORS.textSecondary, fontSize: 13 },
  avgText: { color: COLORS.textSecondary, fontSize: 12, marginTop: SIZES.xs },

  // Donut
  donutCenter: {
    position: 'absolute', top: SIZES.sm, left: 0, right: 0,
    height: DONUT_SIZE, alignItems: 'center', justifyContent: 'center',
  },
  donutCenterLabel: { color: COLORS.textSecondary, fontSize: 11 },
  donutCenterValue: { color: COLORS.text, fontSize: 14, fontWeight: '700', maxWidth: DONUT_RADIUS * 1.5 },

  // Category rows
  catRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: SIZES.sm,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  catDot: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginRight: SIZES.sm,
  },
  catInfo: { flex: 1, marginRight: SIZES.sm },
  catName: { color: COLORS.text, fontSize: 14, fontWeight: '500' },
  catBarBg: { height: 4, backgroundColor: COLORS.border, borderRadius: 2, marginTop: 4 },
  catBarFill: { height: 4, borderRadius: 2 },
  catAmount: { color: COLORS.expense, fontSize: 13, fontWeight: '600' },
  catPct: { color: COLORS.textSecondary, fontSize: 11, marginTop: 1 },

  // Loan section
  loanRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, paddingVertical: SIZES.xs },
  loanLabel: { flex: 1, color: COLORS.text, fontSize: 14 },
  loanAmount: { fontSize: 14, fontWeight: '600' },

  // Section label
  sectionLabel: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: SIZES.sm, marginTop: SIZES.xs },

  // Daily groups
  dayCard: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius,
    padding: SIZES.md, marginBottom: SIZES.sm,
  },
  dayHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: SIZES.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    marginBottom: SIZES.sm,
  },
  dayMain: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  daySub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  dayTotal: { fontSize: 13, fontWeight: '600' },

  txnRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SIZES.xs },
  txnIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  txnInfo: { flex: 1, marginLeft: SIZES.sm },
  txnCategory: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  txnNote: { color: COLORS.textSecondary, fontSize: 12, marginTop: 1 },
  txnAmount: { fontSize: 14, fontWeight: '700' },

  // Trend view
  trendSummaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  trendSummaryItem: { flex: 1 },
  trendAmount: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  weekRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: SIZES.sm,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  weekLabel: { color: COLORS.text, fontSize: 13, fontWeight: '600', width: 80 },
  weekAmounts: { flex: 1, marginHorizontal: SIZES.sm },
  weekAmount: { fontSize: 12 },
  weekNet: { fontSize: 14, fontWeight: '600', width: 100, textAlign: 'right' },

  // Empty
  emptyContainer: { alignItems: 'center', paddingVertical: SIZES.xxl },
  emptyText: { color: COLORS.textSecondary, marginTop: SIZES.sm },
});
