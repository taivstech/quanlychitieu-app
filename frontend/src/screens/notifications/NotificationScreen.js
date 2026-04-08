import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { notificationApi } from '../../api';
import { useTheme } from '../../contexts/ThemeContext';

export default function NotificationScreen({ navigation }) {
  const { colors } = useTheme();
  const C = colors || COLORS;
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const res = await notificationApi.getAll();
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Notification load error:', err);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const renderItem = ({ item }) => {
    const isRead = item.read;
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: isRead ? C.background : C.surface, opacity: isRead ? 0.7 : 1 }]}
        onPress={() => !isRead && handleMarkAsRead(item.id)}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={item.type === 'BILL_OVERDUE' ? 'alert-circle' : 'notifications'} size={24} color={item.type === 'BILL_OVERDUE' ? COLORS.error : C.primary} />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, { color: C.text, fontWeight: isRead ? '500' : '700' }]}>{item.title}</Text>
          <Text style={[styles.message, { color: C.textSecondary }]}>{item.message}</Text>
          <Text style={[styles.time, { color: C.textLight }]}>{new Date(item.createdAt).toLocaleString('vi-VN')}</Text>
        </View>
        {!isRead && <View style={[styles.unreadDot, { backgroundColor: C.primary }]} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>Thông báo</Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Ionicons name="checkmark-done-outline" size={24} color={C.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color={C.textLight} />
            <Text style={[styles.emptyText, { color: C.textSecondary }]}>Không có thông báo nào</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: SIZES.lg,
    flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1,
  },
  backBtn: { paddingRight: SIZES.md },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800' },
  list: { padding: SIZES.md },
  card: {
    flexDirection: 'row', alignItems: 'center', padding: SIZES.md,
    borderRadius: SIZES.radius, marginBottom: SIZES.sm, ...SHADOWS.sm,
  },
  iconContainer: { marginRight: SIZES.sm },
  content: { flex: 1 },
  title: { fontSize: 16, marginBottom: 4 },
  message: { fontSize: 14, marginBottom: 4 },
  time: { fontSize: 12 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, marginLeft: SIZES.sm },
  emptyContainer: { alignItems: 'center', padding: SIZES.xxl },
  emptyText: { marginTop: SIZES.md, fontSize: 16 },
});
