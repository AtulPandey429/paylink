import api from './client';

export async function fetchSettings() {
  const res = await api.get('/settings');
  return res.data;
}
