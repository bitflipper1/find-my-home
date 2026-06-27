import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export async function fetchListings(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== false) params.set(k, v);
  });
  const { data } = await api.get(`/listings?${params}`);
  return data;
}

export async function fetchStats() {
  const { data } = await api.get('/stats');
  return data;
}

export async function fetchListing(id) {
  const { data } = await api.get(`/listings/${id}`);
  return data;
}

export async function triggerRefresh() {
  const { data } = await api.post('/refresh');
  return data;
}

export async function fetchLogs() {
  const { data } = await api.get('/logs');
  return data;
}

export async function fetchBuilders() {
  const { data } = await api.get('/builders');
  return data;
}

export async function fetchCities() {
  const { data } = await api.get('/cities');
  return data;
}

export async function fetchEmailLeads() {
  const { data } = await api.get('/email-leads');
  return data;
}

export async function fetchHealth() {
  const { data } = await api.get('/health');
  return data;
}
