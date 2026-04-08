import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { reportApi } from '../../api';
import { formatCurrency, getCurrentMonth, getCurrentYear } from '../../utils/helpers';
import { useTheme } from '../../contexts/ThemeContext';

const screenWidth = Dimensions.get('window').width - SIZES.lg * 2;

// Custom Pie chart (danh sách màu)
const SimplePieChart = ({ data, colors: C }) => {
  const total = data.reduce((s, d) => s + d.amount, 0);
  return (
    <View>
      {data.map((d, i) => {
        const pct = total > 0 ? ((d.amount / total) * 100).toFixed(1) : 0;
        const barW = total > 0 ? (d.amount / total) * (screenWidth - SIZES.lg * 2) : 0;
        return (
          <View key={i} style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: d.color }} />
                <Text style={{ fontSize: 12, color: C.text }}>{d.name}</Text>
              </View>
              <Text style={{ fontSize: 12, color: C.textSecondary }}>{pct}%</Text>
            </View>
            <View style={{ height: 6, backgroundColor: C.border, borderRadius: 3 }}>
              <View style={{ height: 6, width: barW, backgroundColor: d.color, borderRadius: 3 }} />
            </View>
          </View>
        );
      })}
    </View>
  );
};

// Custom line chart đơn giản bằng dots
const SimpleLineChart = ({ labels, data, colors: C }) => {
  const maxV = Math.max(...data, 1);
  const chartH = 120;
  const W = screenWidth - SIZES.lg * 2;
  const pts = data.map((v, i) => ({
    x: data.length > 1 ? (i / (data.length - 1)) * W : W / 2,
    y: chartH - (v / maxV) * (chartH - 10),
    v,
  }));
  const formatV = (v) => v >= 1000000 ? (v/1000000).toFixed(1)+'M' : v >= 1000 ? (v/1000).toFixed(0)+'K' : String(v);
  return (
    <View>
      <View style={{ height: chartH, marginBottom: 4 }}>
        {pts.map((pt, i) => (
          <View key={i} style={{ position: 'absolute', left: pt.x - 4, top: pt.y - 4,
            width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444',
            borderWidth: 2, borderColor: '#FCA5A5' }} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {labels.map((l, i) => (
          <Text key={i} style={{ fontSize: 10, color: C.textSecondary, textAlign: 'center', flex: 1 }}>{l}</Text>
        ))}
      </View>
    </View>
  );
};

export default function ReportScreen() {
  const { colors } = useTheme();
  const C = colors || COLORS;
  const [report, setReport] = useState(null);
  const [month, setMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(getCurrentYear());
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const res = await reportApi.getMonthly(month, year);
      setReport(res.data);
    } catch (err) { console.error('Report load error:', err); }
  };

  useFocusEffect(useCallback(() => { loadData(); }, [month, year]));

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const pieData = (report?.expenseByCategory || []).slice(0, 6).map((c, i) => ({
    name: c.categoryName,
    amount: Number(c.amount),
    color: c.categoryColor || ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'][i % 6],
    legendFontColor: C.text,
    legendFontSize: 12,
  }));

  const dailyExpenses = report?.dailyExpenses || [];
  const lineLabels = dailyExpenses.slice(-7).map((d) => d.date?.slice(8) || '');
  const lineData = dailyExpenses.slice(-7).map((d) => Number(d.amount) || 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: C.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
    >
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <Text style={[styles.headerTitle, { color: C.text }]}>📊 Báo cáo</Text>
      </View>

      <View style={[styles.monthNav, { backgroundColor: C.surface }]}>
        <TouchableOpacity onPress={() => { if (month === 1) { setMonth(12); setYear(year - 1); } else setMonth(month - 1); }}>
          <Ionicons name="chevron-back" size={24} color={C.primary} />
        </TouchableOpacity>
        <Text style={[styles.monthText, { color: C.text }]}>Tháng {month}/{year}</Text>
        <TouchableOpacity onPress={() => { if (month === 12) { setMonth(1); setYear(year + 1); } else setMonth(month + 1); }}>
          <Ionicons name="chevron-forward" size={24} color={C.primary} />
        </TouchableOpacity>
      </View>

      {report && (
        <>
          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { borderLeftColor: C.income, backgroundColor: C.surface }]}>
              <Text style={[styles.summaryLabel, { color: C.textSecondary }]}>Thu nhập</Text>
              <Text style={[styles.summaryAmount, { color: C.income }]}>{formatCurrency(report.totalIncome)}</Text>
            </View>
            <View style={[styles.summaryCard, { borderLeftColor: C.expense, backgroundColor: C.surface }]}>
              <Text style={[styles.summaryLabel, { color: C.textSecondary }]}>Chi tiêu</Text>
              <Text style={[styles.summaryAmount, { color: C.expense }]}>{formatCurrency(report.totalExpense)}</Text>
            </View>
          </View>

          <View style={[styles.netCard, { backgroundColor: C.surface, borderLeftColor: Number(report.netAmount) >= 0 ? C.income : C.expense }]}>
            <Text style={[styles.summaryLabel, { color: C.textSecondary }]}>Số dư tháng</Text>
            <Text style={[styles.summaryAmount, { color: Number(report.netAmount) >= 0 ? C.income : C.expense }]}>
              {formatCurrency(report.netAmount)}
            </Text>
          </View>

          {pieData.length > 0 && (
            <View style={[styles.chartCard, { backgroundColor: C.surface }]}>
              <Text style={[styles.chartTitle, { color: C.text }]}>Chi tiêu theo danh mục</Text>
              <SimplePieChart data={pieData} colors={C} />
            </View>
          )}

          {/* Daily Expense Line Chart */}
          {lineData.length > 0 && lineData.some((v) => v > 0) && (
            <View style={[styles.chartCard, { backgroundColor: C.surface }]}>
              <Text style={[styles.chartTitle, { color: C.text }]}>Chi tiêu 7 ngày gần nhất</Text>
              <SimpleLineChart labels={lineLabels} data={lineData} colors={C} />
            </View>
          )}

          {/* Category breakdown list */}
          <View style={styles.breakdownSection}>
            <Text style={[styles.chartTitle, { color: C.text }]}>Chi tiết chi tiêu</Text>
            {(report.expenseByCategory || []).map((c) => (
              <View key={c.categoryId} style={[styles.breakdownItem, { backgroundColor: C.surface }]}>
                <View style={[styles.catDot, { backgroundColor: c.categoryColor || COLORS.gray }]} />
                <Text style={[styles.catName, { color: C.text }]}>{c.categoryName}</Text>
                <Text style={[styles.catPct, { color: C.textSecondary }]}>{(c.percentage || 0).toFixed(1)}%</Text>
                <Text style={[styles.catAmount, { color: C.expense }]}>{formatCurrency(c.amount)}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={{ height: SIZES.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 52, paddingBottom: 14, paddingHorizontal: SIZES.lg, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SIZES.md },
  monthText: { ...FONTS.bold },
  summaryRow: { flexDirection: 'row', paddingHorizontal: SIZES.md, marginTop: SIZES.md, gap: SIZES.sm },
  summaryCard: { flex: 1, borderRadius: SIZES.radius, padding: SIZES.md, borderLeftWidth: 4, ...SHADOWS.sm },
  summaryLabel: { ...FONTS.small },
  summaryAmount: { ...FONTS.bold, marginTop: SIZES.xs },
  netCard: { marginHorizontal: SIZES.md, marginTop: SIZES.sm, borderRadius: SIZES.radius, padding: SIZES.md, borderLeftWidth: 4, ...SHADOWS.sm },
  chartCard: { margin: SIZES.md, borderRadius: SIZES.radius, padding: SIZES.md, ...SHADOWS.sm },
  chartTitle: { ...FONTS.bold, marginBottom: SIZES.sm },
  breakdownSection: { paddingHorizontal: SIZES.md, marginTop: SIZES.sm },
  breakdownItem: { flexDirection: 'row', alignItems: 'center', borderRadius: SIZES.radiusSm, padding: SIZES.md, marginBottom: SIZES.xs, ...SHADOWS.sm },
  catDot: { width: 12, height: 12, borderRadius: 6, marginRight: SIZES.sm },
  catName: { flex: 1, ...FONTS.regular },
  catPct: { ...FONTS.small, marginRight: SIZES.sm },
  catAmount: { ...FONTS.bold, fontSize: 13 },
});
