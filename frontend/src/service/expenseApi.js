import { api } from './apis';

export const createExpense = async (prompt) => {
  const response = await api.post('/expenses/', { prompt });
  return response.data;
};

export const fetchExpenses = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.category) params.append('category', filters.category);
  if (filters.month) params.append('month', filters.month.toString());
  if (filters.year) params.append('year', filters.year.toString());
  if (filters.startDate) params.append('start_date', filters.startDate);
  if (filters.endDate) params.append('end_date', filters.endDate);
  if (filters.limit) params.append('limit', filters.limit.toString());
  
  const response = await api.get(`/expenses/?${params}`);
  return response.data;
};

export const fetchMonthlySummary = async (year = null) => {
  const params = new URLSearchParams();
  if (year) params.append('year', year.toString());
  
  const response = await api.get(`/expenses/monthly-summary?${params}`);
  return response.data;
};


export const fetchCategories = async () => {
  const response = await api.get('/expenses/categories');
  return response.data;
};

export const deleteExpense = async (expenseId) => {
  const response = await api.delete(`/expenses/${expenseId}`);
  return response.data;
};

