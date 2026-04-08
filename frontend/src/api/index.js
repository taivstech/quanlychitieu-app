import axiosClient from './axiosClient';

// ============ AUTH ============
export const authApi = {
  register: (data) => axiosClient.post('/auth/register', data),
  login: (data) => axiosClient.post('/auth/login', data),
  refresh: (refreshToken) => axiosClient.post('/auth/refresh', { refreshToken }),
  updatePushToken: (pushToken) => axiosClient.put('/auth/push-token', { pushToken }),
};

// ============ WALLETS ============
export const walletApi = {
  getAll: () => axiosClient.get('/wallets'),
  getById: (id) => axiosClient.get(`/wallets/${id}`),
  getTotalBalance: () => axiosClient.get('/wallets/total-balance'),
  create: (data) => axiosClient.post('/wallets', data),
  update: (id, data) => axiosClient.put(`/wallets/${id}`, data),
  delete: (id) => axiosClient.delete(`/wallets/${id}`),
  transfer: (data) => axiosClient.post('/wallets/transfer', data),
  getMembers: (id) => axiosClient.get(`/wallets/${id}/members`),
  inviteMember: (id, data) => axiosClient.post(`/wallets/${id}/invite`, data),
  respondToInvite: (memberId, accept) => axiosClient.post(`/wallets/invites/${memberId}/respond?accept=${accept}`),
  getPendingInvites: () => axiosClient.get('/wallets/pending-invites'),
};

// ============ CATEGORIES ============
export const categoryApi = {
  getAll: () => axiosClient.get('/categories'),
  getByType: (type) => axiosClient.get(`/categories/type/${type}`),
  create: (data) => axiosClient.post('/categories', data),
  update: (id, data) => axiosClient.put(`/categories/${id}`, data),
  delete: (id) => axiosClient.delete(`/categories/${id}`),
};

// ============ TRANSACTIONS ============
export const transactionApi = {
  getAll: (page = 0, size = 20) => axiosClient.get(`/transactions?page=${page}&size=${size}`),
  getByDateRange: (startDate, endDate) =>
    axiosClient.get(`/transactions/range?startDate=${startDate}&endDate=${endDate}`),
  getByCategory: (categoryId, startDate, endDate) =>
    axiosClient.get(`/transactions/category/${categoryId}?startDate=${startDate}&endDate=${endDate}`),
  getByWallet: (walletId, page = 0, size = 20) =>
    axiosClient.get(`/transactions/wallet/${walletId}?page=${page}&size=${size}`),
  create: (data) => axiosClient.post('/transactions', data),
  update: (id, data) => axiosClient.put(`/transactions/${id}`, data),
  delete: (id) => axiosClient.delete(`/transactions/${id}`),
};

// ============ BUDGETS ============
export const budgetApi = {
  getByMonth: (month, year) => axiosClient.get(`/budgets?month=${month}&year=${year}`),
  create: (data) => axiosClient.post('/budgets', data),
  update: (id, data) => axiosClient.put(`/budgets/${id}`, data),
  delete: (id) => axiosClient.delete(`/budgets/${id}`),
};

// ============ REPORTS ============
export const reportApi = {
  getByDateRange: (startDate, endDate) =>
    axiosClient.get(`/reports?startDate=${startDate}&endDate=${endDate}`),
  getMonthly: (month, year) => axiosClient.get(`/reports/monthly?month=${month}&year=${year}`),
  getTrend: (startDate, endDate) =>
    axiosClient.get(`/reports/trend?startDate=${startDate}&endDate=${endDate}`),
};

// ============ DEBTS ============
export const debtApi = {
  getAll: () => axiosClient.get('/debts'),
  getActive: () => axiosClient.get('/debts/active'),
  getByType: (type) => axiosClient.get(`/debts/type/${type}`),
  getSummary: () => axiosClient.get('/debts/summary'),
  create: (data) => axiosClient.post('/debts', data),
  pay: (id, data) => axiosClient.post(`/debts/${id}/pay`, data),
  delete: (id) => axiosClient.delete(`/debts/${id}`),
};

// ============ SAVING GOALS ============
export const savingGoalApi = {
  getAll: () => axiosClient.get('/saving-goals'),
  getActive: () => axiosClient.get('/saving-goals/active'),
  create: (data) => axiosClient.post('/saving-goals', data),
  update: (id, data) => axiosClient.put(`/saving-goals/${id}`, data),
  deposit: (id, amount) => axiosClient.post(`/saving-goals/${id}/deposit`, { amount }),
  withdraw: (id, amount) => axiosClient.post(`/saving-goals/${id}/withdraw`, { amount }),
  delete: (id) => axiosClient.delete(`/saving-goals/${id}`),
};

// ============ RECURRING TRANSACTIONS ============
export const recurringApi = {
  getAll: () => axiosClient.get('/recurring'),
  create: (data) => axiosClient.post('/recurring', data),
  deactivate: (id) => axiosClient.post(`/recurring/${id}/deactivate`),
};

// ============ BILLS ============
export const billApi = {
  getAll: () => axiosClient.get('/bills'),
  getActive: () => axiosClient.get('/bills/active'),
  getUpcoming: () => axiosClient.get('/bills/upcoming'),
  create: (data) => axiosClient.post('/bills', data),
  update: (id, data) => axiosClient.put(`/bills/${id}`, data),
  markPaid: (id) => axiosClient.post(`/bills/${id}/mark-paid`),
  toggle: (id) => axiosClient.patch(`/bills/${id}/toggle`),
  delete: (id) => axiosClient.delete(`/bills/${id}`),
};

// ============ EVENTS (TRIPS) ============
export const eventApi = {
  getAll: () => axiosClient.get('/events'),
  getActive: () => axiosClient.get('/events/active'),
  getById: (id) => axiosClient.get(`/events/${id}`),
  getTransactions: (id) => axiosClient.get(`/events/${id}/transactions`),
  create: (data) => axiosClient.post('/events', data),
  update: (id, data) => axiosClient.put(`/events/${id}`, data),
  toggle: (id) => axiosClient.patch(`/events/${id}/toggle`),
  delete: (id) => axiosClient.delete(`/events/${id}`),
};

// ============ DASHBOARD ============
export const dashboardApi = {
  get: (month, year) => {
    const params = month && year ? `?month=${month}&year=${year}` : '';
    return axiosClient.get(`/dashboard${params}`);
  },
  getComparison: (month, year) => axiosClient.get(`/dashboard/comparison?month=${month}&year=${year}`),
  getInsights: () => axiosClient.get('/dashboard/insights'),
  getTrending: (month, year) => {
    const params = month && year ? `?month=${month}&year=${year}` : '';
    return axiosClient.get(`/dashboard/trending${params}`);
  },
  getCategoryReport: (categoryId, startDate, endDate) =>
    axiosClient.get(`/dashboard/category-report/${categoryId}?startDate=${startDate}&endDate=${endDate}`),
};

// ============ NOTIFICATIONS ============
export const notificationApi = {
  getAll: () => axiosClient.get('/notifications'),
  getUnreadCount: () => axiosClient.get('/notifications/unread-count'),
  markAsRead: (id) => axiosClient.put(`/notifications/${id}/read`),
  markAllAsRead: () => axiosClient.put('/notifications/read-all'),
};
