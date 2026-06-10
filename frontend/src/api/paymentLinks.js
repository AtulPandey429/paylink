import api from './client';

export async function fetchPaymentLinks(params = {}) {
  const res = await api.get('/payment-links', { params });
  return res.data;
}

export async function fetchPaymentLinkById(id) {
  const res = await api.get(`/payment-links/${id}`);
  return res.data;
}

export async function fetchPaymentLinkEvents(id) {
  const res = await api.get(`/payment-links/${id}/events`);
  return res.data;
}

export async function createPaymentLink(payload) {
  const res = await api.post('/payment-links', payload);
  return res.data;
}

export async function syncPaymentLink(id) {
  const res = await api.post(`/payment-links/${id}/sync`);
  return res.data;
}

export async function cancelPaymentLink(id) {
  const res = await api.post(`/payment-links/${id}/cancel`);
  return res.data;
}

export async function fetchPublicPaymentLink(id) {
  const res = await api.get(`/payment-links/public/${id}`);
  return res.data;
}

export async function simulatePayment(id, action) {
  const res = await api.post(`/payment-links/public/${id}/simulate`, { action });
  return res.data;
}
