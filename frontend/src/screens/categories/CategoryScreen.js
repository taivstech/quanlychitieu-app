import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { categoryApi } from '../../api';

export default function CategoryScreen({ navigation }) {
  const { isDark, colors } = useTheme();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('EXPENSE');

  // Dark mode colors matching the app's standard theme
  const bgColor = colors?.background || (isDark ? '#121212' : '#F5F5F5');
  const cardColor = colors?.surface || (isDark ? '#1E1E1E' : '#FFFFFF');
  const textColor = colors?.text || (isDark ? '#FFFFFF' : '#1E1E1E');
  const textMuted = colors?.textSecondary || (isDark ? '#AAAAAA' : '#666666');
  const borderColor = colors?.border || (isDark ? '#333333' : '#E0E0E0');
  const brandColor = colors?.primary || '#2ECC71';

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await categoryApi.getAll();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.log('Error loading categories:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách nhóm giao dịch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
        loadCategories();
    });
    return unsubscribe;
  }, [navigation]);

  const handleDelete = (category) => {
    if (category.default) {
       Alert.alert('Không thể xóa', 'Đây là nhóm hệ thống mặc định!');
       return;
    }
    Alert.alert(
      'Xóa Nhóm',
      `Bạn có chắc chắn muốn xóa nhóm "${category.name}"?\n(Các giao dịch thuộc nhóm này có thể bị mất hoặc mất liên kết)`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await categoryApi.delete(category.id);
              if (res.success) {
                 loadCategories();
              }
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa nhóm này. Có thể nhóm đang chứa giao dịch.');
            }
          }
        }
      ]
    );
  };

  const filteredCategories = categories.filter(c => c.type === activeTab);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.itemContainer, { backgroundColor: cardColor, borderBottomColor: borderColor }]}
      onPress={() => navigation.navigate('CategoryForm', { category: item })}
      onLongPress={() => handleDelete(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: item.color || brandColor }]}>
        <Ionicons name={item.icon || 'list'} size={20} color="#FFF" />
      </View>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: textColor }]}>{item.name}</Text>
        {item.default && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>Mặc định</Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Segmented Control */}
      <View style={[styles.tabContainer, { backgroundColor: cardColor, borderBottomColor: borderColor }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'EXPENSE' && { borderBottomColor: '#FF3B30', borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('EXPENSE')}
        >
          <Text style={[styles.tabText, activeTab === 'EXPENSE' ? { color: '#FF3B30', fontWeight: 'bold' } : { color: textMuted }]}>
            Khoản Chi
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'INCOME' && { borderBottomColor: brandColor, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('INCOME')}
        >
          <Text style={[styles.tabText, activeTab === 'INCOME' ? { color: brandColor, fontWeight: 'bold' } : { color: textMuted }]}>
            Khoản Thu
          </Text>
        </TouchableOpacity>
      </View>

      {/* List Categories */}
      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadCategories} tintColor={brandColor} />}
        ListEmptyComponent={
          !loading && (
             <View style={styles.emptyContainer}>
               <Ionicons name="folder-open-outline" size={60} color={textMuted} />
               <Text style={[styles.emptyText, { color: textMuted }]}>Chưa có nhóm giao dịch nào</Text>
             </View>
          )
        }
      />

      {/* FAB - Create Category */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: brandColor }]}
        onPress={() => navigation.navigate('CategoryForm', { type: activeTab })}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 100,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  itemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  defaultBadge: {
    marginLeft: 10,
    backgroundColor: '#E0F2F1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  defaultBadgeText: {
    fontSize: 10,
    color: '#00897B',
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
