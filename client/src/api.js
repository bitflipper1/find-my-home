import axios from 'axios';
import { staticApi, IS_STATIC } from './staticData';

const api = axios.create({ baseURL: '/api' });

// In static (GitHub Pages) mode there is no backend — delegate every call to
// the localStorage/data.json adapter. The function bodies below run unchanged
// for the full-stack local build.
const S = IS_STATIC ? staticApi : null;

export async function fetchListings(filters = {}) {
  if (S) return S.fetchListings(filters);
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== false) params.set(k, v);
  });
  const { data } = await api.get(`/listings?${params}`);
  return data;
}

export async function fetchStats() {
  if (S) return S.fetchStats();
  const { data } = await api.get('/stats');
  return data;
}

export async function fetchListing(id) {
  if (S) {
    const { listings } = await S.fetchListings({});
    return listings.find(l => l.id === id) || null;
  }
  const { data } = await api.get(`/listings/${id}`);
  return data;
}

export async function triggerRefresh() {
  if (S) return S.triggerRefresh();
  const { data } = await api.post('/refresh');
  return data;
}

export async function fetchLogs() {
  if (S) return S.fetchLogs();
  const { data } = await api.get('/logs');
  return data;
}

export async function fetchBuilders() {
  if (S) return S.fetchBuilders();
  const { data } = await api.get('/builders');
  return data;
}

export async function fetchCities() {
  if (S) return S.fetchCities();
  const { data } = await api.get('/cities');
  return data;
}

export async function fetchEmailLeads() {
  if (S) return S.fetchEmailLeads();
  const { data } = await api.get('/email-leads');
  return data;
}

export async function fetchHealth() {
  if (S) return { status: 'static' };
  const { data } = await api.get('/health');
  return data;
}

// --- Tracked places (personal tour tracker) ---
export async function fetchTracked() {
  if (S) return S.fetchTracked();
  const { data } = await api.get('/tracked');
  return data;
}

export async function saveTracked(payload) {
  if (S) return S.saveTracked(payload);
  const { data } = await api.post('/tracked', payload);
  return data;
}

export async function updateTracked(id, payload) {
  if (S) return S.updateTracked(id, payload);
  const { data } = await api.put(`/tracked/${id}`, payload);
  return data;
}

export async function deleteTracked(id) {
  if (S) return S.deleteTracked(id);
  const { data } = await api.delete(`/tracked/${id}`);
  return data;
}
