import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { transactionApi } from '../../api';
import { formatCurrency, formatDate, getCurrentMonth, getCurrentYear, getCategoryIcon } from '../../utils/helpers';
import { useTheme } from '../../contexts/ThemeContext';

// Group transactions by date
const groupByDate = (transactions) => {
  const groups = {};
  transactions.forEach((txn) => {
    const date = txn.transactionDate;
    if (!groups[date]) {
      groups[date] = { date, transactions: [], total: 0 };
    }
    groups[date].transactions.push(txn);
    groups[date].total += Number(txn.amount) || 0;
  });
  return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
};

const formatDayHeader = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today - d) / (1000 * 60 * 60 * 24));

  const dayOfWeek = d.toLocaleDateString('vi-VN', { weekday: 'long' });
  const dayMonth = d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });

  if (diff === 0) return { main: 'Hôm nay', sub: dayMonth };
  if (diff === 1) return { main: 'Hôm qua', sub: dayMonth };
  return { main: dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1), sub: dayMonth };
};

export default function CategoryDetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const C = colors || COLORS;
  const { categoryId, categoryName, categoryColor, categoryIcon, startDate, endDate, periodLabel } = route.params;
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  const loadData = async () => {
    try {
      const res = await transactionApi.getByCategory(categoryId, startDate, endDate);
      const data = res.data || [];
      setTransactions(data);
      setTotalAmount(data.reduce((sum, t) => sum + (Number(t.amount) || 0), 0));
    } catch (err) {
      console.error('CategoryDetail load error:', err);
    }
  };

  useEffect(() => { loadData(); }, [categoryId, startDate, endDate]);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const groups = groupByDate(transactions);

  const renderTransaction = (txn) => (
    <TouchableOpacity 
      key={txn.id} 
      style={styles.txnRow}
      onPress={() => navigation.navigate('TransactionDetail', { transaction: txn })}
    >
      <View style={styles.txnInfo}>
        <Text style={[styles.txnNote, { color: C.text }]} numberOfLines={1}>{txn.note || categoryName}</Text>
        <Text style={[styles.txnWallet, { color: C.textSecondary }]}>{txn.walletName}</Text>
      </View>
      <Text style={[styles.txnAmount, {
        color: txn.type === 'INCOME' ? COLORS.income : COLORS.expense,
      }]}>
        {txn.type === 'INCOME' ? '+' : '-'}{formatCurrency(txn.amount)}
      </Text>
    </TouchableOpacity>
  );

  const renderGroup = ({ item }) => {
    const header = formatDayHeader(item.date);
    return (
      <View style={[styles.dayGroup, { backgroundColor: C.surface }]}>
        <View style={[styles.dayHeader, { borderBottomColor: C.border }]}>
          <View>
            <Text style={[styles.dayMain, { color: C.text }]}>{header.main}</Text>
            <Text style={[styles.daySub, { color: C.textSecondary }]}>{header.sub}</Text>
          </View>
          <Text style={styles.dayTotal}>{formatCurrency(item.total)}</Text>
        </View>
        {item.transactions.map(renderTransaction)}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]} numberOfLines={1}>{categoryName}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Summary card */}
      <View style={[styles.summaryCard, { backgroundColor: C.surface }]}>
        <View style={[styles.catIcon, { backgroundColor: categoryColor || C.primary }]}>
          <Ionicons name={getCategoryIcon(categoryIcon)} size={24} color={COLORS.white} />
        </View>
        <View style={styles.summaryInfo}>
          <Text style={[styles.summaryLabel, { color: C.textSecondary }]}>{periodLabel || 'Tháng này'}</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(totalAmount)}</Text>
          <Text style={[styles.summaryCount, { color: C.textLight }]}>{transactions.length} giao dịch</Text>
        </View>
      </View>

      {/* Transaction list grouped by day */}
      <FlatList
        data={groups}
        keyExtractor={(item) => item.date}
        renderItem={renderGroup}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={C.textLight} />
            <Text style={[styles.empty, { color: C.textSecondary }]}>Không có giao dịch nào</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 52, paddingBottom: 10, paddingHorizontal: SIZES.md,
    flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1
  },
  backBtn: { padding: SIZES.xs },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700' },

  // Summary
  summaryCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: SIZES.radius,
    marginHorizontal: SIZES.md, padding: SIZES.lg, marginBottom: SIZES.md, marginTop: SIZES.md,
    ...SHADOWS.sm,
  },
  catIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  summaryInfo: { marginLeft: SIZES.md, flex: 1 },
  summaryLabel: { ...FONTS.small },
  summaryAmount: { color: COLORS.expense, fontSize: 22, fontWeight: '700', marginTop: 2 },
  summaryCount: { ...FONTS.small, marginTop: 2 },

  // List
  list: { paddingHorizontal: SIZES.md, paddingBottom: 100 },

  // Day group
  dayGroup: { borderRadius: SIZES.radius, padding: SIZES.md, marginBottom: SIZES.sm, ...SHADOWS.sm },
  dayHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: SIZES.sm, borderBottomWidth: 1, marginBottom: SIZES.sm,
  },
  dayMain: { fontSize: 15, fontWeight: '700' },
  daySub: { fontSize: 12, marginTop: 2 },
  dayTotal: { color: COLORS.expense, fontSize: 15, fontWeight: '700' },

  // Transaction row
  txnRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SIZES.xs },
  txnInfo: { flex: 1 },
  txnNote: { fontSize: 14, fontWeight: '500' },
  txnWallet: { fontSize: 12, marginTop: 1 },
  txnAmount: { fontSize: 14, fontWeight: '700' },

  // Empty
  emptyContainer: { alignItems: 'center', marginTop: SIZES.xxl },
  empty: { ...FONTS.regular, textAlign: 'center', marginTop: SIZES.md },
});
