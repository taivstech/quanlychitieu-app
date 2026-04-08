import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { transactionApi } from '../../api';
import { formatCurrency, getCategoryIcon } from '../../utils/helpers';
import { useTheme } from '../../contexts/ThemeContext';

export default function TransactionDetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const C = colors || COLORS;
  const { transaction } = route.params || {};

  if (!transaction) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <Text style={{ color: C.textSecondary, textAlign: 'center', marginTop: 100 }}>Không tìm thấy giao dịch</Text>
      </View>
    );
  }

  const isIncome = transaction.type === 'INCOME';
  const isLoan = transaction.type === 'LOAN';
  const amountColor = isIncome ? C.income : isLoan ? C.loan : C.expense;
  const amountBg = isIncome ? C.incomeBg : isLoan ? C.loanBg : C.expenseBg;

  const dateObj = new Date(transaction.transactionDate);
  const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  const formattedDate = `${dayNames[dateObj.getDay()]}, ${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;

  const handleDelete = () => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa giao dịch này?', [
      { text: 'Hủy' },
      {
        text: 'Xóa', style: 'destructive',
        onPress: async () => {
          try {
            await transactionApi.delete(transaction.id);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Lỗi', 'Không thể xóa giao dịch');
          }
        },
      },
    ]);
  };

  const DetailRow = ({ icon, label, value }) => (
    <View style={[styles.detailRow, { borderBottomColor: C.borderLight }]}>
      <View style={[styles.detailIconWrap, { backgroundColor: C.primaryBg }]}>
        <Ionicons name={icon} size={18} color={C.primary} />
      </View>
      <View style={styles.detailInfo}>
        <Text style={[styles.detailLabel, { color: C.textSecondary }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: C.text }]}>{value}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>Chi tiết giao dịch</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={22} color={C.error} />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Amount hero */}
        <View style={[styles.amountHero, { backgroundColor: amountBg }]}>
          <View style={[styles.categoryIcon, { backgroundColor: transaction.categoryColor || C.primary }]}>
            <Ionicons name={getCategoryIcon(transaction.categoryIcon)} size={32} color="#fff" />
          </View>
          <Text style={[styles.categoryName, { color: C.text }]}>{transaction.categoryName}</Text>
          <Text style={[styles.amountBig, { color: amountColor }]}>
            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: amountColor + '20' }]}>
            <Text style={[styles.typeText, { color: amountColor }]}>
              {isIncome ? '📈 Thu nhập' : isLoan ? '🤝 Vay/Nợ' : '📉 Chi tiêu'}
            </Text>
          </View>
        </View>

        {/* Details card */}
        <View style={[styles.detailCard, { backgroundColor: C.surface }]}>
          <DetailRow icon="calendar-outline" label="Ngày giao dịch" value={formattedDate} />
          <DetailRow icon="wallet-outline" label="Ví" value={transaction.walletName || 'Không rõ'} />
          {transaction.note && (
            <DetailRow icon="chatbubble-outline" label="Ghi chú" value={transaction.note} />
          )}
          {transaction.eventName && (
            <DetailRow icon="briefcase-outline" label="Sự kiện" value={transaction.eventName} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: SIZES.md,
    flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1,
  },
  backBtn: { marginRight: SIZES.sm, padding: 4 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700' },
  deleteBtn: { padding: 4 },
  amountHero: {
    alignItems: 'center', paddingVertical: SIZES.xl,
    paddingHorizontal: SIZES.md, gap: SIZES.sm,
  },
  categoryIcon: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.md,
  },
  categoryName: { fontSize: 18, fontWeight: '700', marginTop: SIZES.xs },
  amountBig: { fontSize: 32, fontWeight: '800' },
  typeBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  typeText: { fontSize: 13, fontWeight: '700' },
  detailCard: {
    margin: SIZES.md, borderRadius: SIZES.radius,
    ...SHADOWS.sm, overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.md,
    paddingVertical: 14, paddingHorizontal: SIZES.md,
    borderBottomWidth: 1,
  },
  detailIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  detailInfo: { flex: 1 },
  detailLabel: { fontSize: 12, fontWeight: '600' },
  detailValue: { fontSize: 15, fontWeight: '600', marginTop: 2 },
});
