import axios from 'axios';

const envApiUrl = (process.env.REACT_APP_API_URL || '').trim();
const fallbackApiUrl = `${window.location.protocol}//${window.location.hostname}:8091`;

// Prefer explicit env value; otherwise infer backend host from the current frontend host.
// Şu hale getir:
export const API_BASE = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:8000`;

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// CSRF token için
api.interceptors.request.use(config => {
  const csrf = document.cookie.match(/csrftoken=([^;]+)/);
  if (csrf) config.headers['X-CSRFToken'] = csrf[1];
  return config;
});

export const kayitlariGetir = () => api.get('/api/kayitlar/');
export const kayitEkle = (data) => api.post('/api/kayit/ekle/', data);
export const kayitGuncelle = (id, data) => api.post(`/api/kayit/${id}/guncelle/`, data);
export const kayitSil = (id) => api.post(`/api/kayit/${id}/sil/`);
export const kullanicilariGetir = () => api.get('/api/kullanicilar/');
export const kullanicilariKaydet = (data) => api.post('/api/kullanicilar/kaydet/', data);
export const kullaniciRol = () => api.get('/api/kullanici/rol/');
export const copListele = () => api.get('/api/cop/');
export const copGeriYukle = (id) => api.post(`/api/cop/${id}/geri/`);
export const copKaliciSil = (id) => api.post(`/api/cop/${id}/kalici-sil/`);
export const kullaniciSil = (id) => api.post(`/api/kullanici/${id}/sil/`);
export const kullaniciCopListele = () => api.get('/api/kullanici/cop/');
export const kullaniciCopGeriYukle = (id) => api.post(`/api/kullanici/cop/${id}/geri/`);
export const kullaniciCopKaliciSil = (id) => api.post(`/api/kullanici/cop/${id}/kalici-sil/`);

export default api;