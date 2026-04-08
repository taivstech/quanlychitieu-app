import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { categoryApi } from '../../api';

// Predefined set of icons for Categories
const ICONS = [
  'restaurant', 'cafe', 'fast-food', 'beer', // Food
  'cart', 'bag-handle', 'pricetag', 'gift', // Shopping
  'car', 'bus', 'airplane', 'bicycle', // Transport
  'cash', 'wallet', 'card', 'trending-up', // Money
  'medkit', 'fitness', 'heart', // Health
  'home', 'flash', 'water', 'wifi', // Utilities
  'school', 'book', 'game-controller', 'musical-notes', // Edu & Ent
  'ellipsis-horizontal', 'apps' // Misc
];

const COLORS = [
  '#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55',
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#DDA0DD', '#98D8C8', '#BDC3C7', '#1ABC9C'
];

export default function CategoryFormScreen({ route, navigation }) {
  const { isDark, colors } = useTheme();
  const { category, type } = route.params || {};

  const isEdit = !!category;
  
  const [name, setName] = useState(isEdit ? category.name : '');
  const [selectedType, setSelectedType] = useState(isEdit ? category.type : (type || 'EXPENSE'));
  const [selectedIcon, setSelectedIcon] = useState(isEdit ? category.icon : ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(isEdit ? category.color : COLORS[0]);
  const [saving, setSaving] = useState(false);

  // Styling based on theme
  const bgColor = colors?.background || (isDark ? '#121212' : '#F5F5F5');
  const cardColor = colors?.surface || (isDark ? '#1E1E1E' : '#FFFFFF');
  const textColor = colors?.text || (isDark ? '#FFFFFF' : '#1E1E1E');
  const textMuted = colors?.textSecondary || (isDark ? '#AAAAAA' : '#666666');
  const borderColor = colors?.border || (isDark ? '#333333' : '#E0E0E0');
  const brandColor = colors?.primary || '#2ECC71';

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên nhóm');
      return;
    }
    
    // Default categories shouldn't be fully altered (preventing system break rules if any, though backend might allow it)
    // Actually the backend might just have it as a normal record
    const payload = {
      name: name.trim(),
      type: selectedType,
      icon: selectedIcon,
      color: selectedColor,
    };

    setSaving(true);
    try {
      let res;
      if (isEdit) {
        res = await categoryApi.update(category.id, payload);
      } else {
        res = await categoryApi.create(payload);
      }

      if (res.success) {
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Lỗi', `Không thể lưu nhóm giao dịch.\n${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[{ flex: 1, backgroundColor: bgColor }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Name Input & Icon Preview */}
        <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
          <View style={styles.previewContainer}>
            <View style={[styles.previewIcon, { backgroundColor: selectedColor }]}>
              <Ionicons name={selectedIcon} size={32} color="#FFF" />
            </View>
            <TextInput
              style={[styles.input, { color: textColor, borderBottomColor: borderColor }]}
              placeholder="Tên nhóm (Vd: Ăn sáng)"
              placeholderTextColor={textMuted}
              value={name}
              onChangeText={setName}
              autoFocus={!isEdit}
            />
          </View>
        </View>

        {/* Type Selector */}
        <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textMuted }]}>Loại nhóm</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity 
              style={[styles.typeBtn, selectedType === 'EXPENSE' && { backgroundColor: '#FF3B30' }]}
              onPress={() => setSelectedType('EXPENSE')}
            >
              <Text style={[styles.typeBtnText, selectedType === 'EXPENSE' ? { color: '#FFF' } : { color: textMuted }]}>Khoản Chi</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeBtn, selectedType === 'INCOME' && { backgroundColor: brandColor }]}
              onPress={() => setSelectedType('INCOME')}
            >
              <Text style={[styles.typeBtnText, selectedType === 'INCOME' ? { color: '#FFF' } : { color: textMuted }]}>Khoản Thu</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Icon Picker */}
        <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textMuted }]}>Chọn Biểu tượng</Text>
          <View style={styles.iconGrid}>
            {ICONS.map(icon => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconOption, 
                  selectedIcon === icon && { backgroundColor: isDarkMode ? '#444' : '#EEE', borderRadius: 8 }
                ]}
                onPress={() => setSelectedIcon(icon)}
              >
                <Ionicons name={icon} size={28} color={selectedIcon === icon ? selectedColor : textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color Picker */}
        <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textMuted }]}>Chọn Màu nền</Text>
          <View style={styles.iconGrid}>
            {COLORS.map(color => (
              <TouchableOpacity
                key={color}
                style={styles.colorOption}
                onPress={() => setSelectedColor(color)}
              >
                <View style={[styles.colorCircle, { backgroundColor: color }]}>
                  {selectedColor === color && <Ionicons name="checkmark" size={16} color="#FFF" />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { backgroundColor: cardColor, borderTopColor: borderColor }]}>
        <TouchableOpacity 
          style={[styles.saveBtn, { backgroundColor: brandColor }, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Đang lưu...' : 'Lưu lại'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: '500',
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 15,
    textTransform: 'uppercase',
  },
  typeSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  typeBtnText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  iconOption: {
    width: '18%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  colorOption: {
    width: '16%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
  },
  saveBtn: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
