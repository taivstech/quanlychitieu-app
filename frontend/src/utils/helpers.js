export const formatCurrency = (amount, currency = 'VND') => {
  if (amount == null) return '0 đ';
  const num = Number(amount);
  if (currency === 'VND') {
    return num.toLocaleString('vi-VN') + ' đ';
  }
  return num.toLocaleString('en-US', { style: 'currency', currency });
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatDateISO = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().split('T')[0];
};

export const getCurrentMonth = () => new Date().getMonth() + 1;
export const getCurrentYear = () => new Date().getFullYear();

export const getMonthRange = (month, year) => {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
};

export const getCategoryIcon = (iconName) => {
  // Map legacy MaterialIcons names (both hyphen and underscore variants) to Ionicons
  const iconMap = {
    // Already Ionicons-native (no mapping needed, just pass-through)
    restaurant: 'restaurant',
    car: 'car',
    cart: 'cart',
    receipt: 'receipt',
    film: 'film',
    medkit: 'medkit',
    school: 'school',
    wallet: 'wallet',
    gift: 'gift',
    cash: 'cash',
    storefront: 'storefront',
    // Legacy MaterialIcons → Ionicons
    directions_car: 'car',
    'directions-car': 'car',
    shopping_cart: 'cart',
    'shopping-cart': 'cart',
    movie: 'film',
    local_hospital: 'medkit',
    'local-hospital': 'medkit',
    more_horiz: 'ellipsis-horizontal',
    'more-horiz': 'ellipsis-horizontal',
    account_balance_wallet: 'wallet',
    'account-balance-wallet': 'wallet',
    card_giftcard: 'gift',
    'card-giftcard': 'gift',
    trending_up: 'trending-up',
    'trending-up': 'trending-up',
    attach_money: 'cash',
    'attach-money': 'cash',
    'money-off': 'remove-circle',
    money: 'add-circle',
    'phone-iphone': 'phone-portrait',
    phone_iphone: 'phone-portrait',
    'phone-android': 'phone-portrait',
    phone_android: 'phone-portrait',
    flight: 'airplane',
    account_balance: 'business',
    'account-balance': 'business',
  };
  return iconMap[iconName] || iconName || 'pricetag';
};
