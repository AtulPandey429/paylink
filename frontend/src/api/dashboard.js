import api from './client';

export async function fetchDashboardSummary(params = {}) {
  const res = await api.get('/dashboard/summary', { params });
  return res.data;
}
