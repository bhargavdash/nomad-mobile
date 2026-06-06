import { create as axiosCreate, type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { supabase } from './supabase';

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export const api = axiosCreate({
  baseURL: `${apiUrl}/api/v1`,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  // Lazy import breaks the api ↔ authStore circular dependency.
  // Both modules are fully initialized by the time any request fires.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useAuthStore } = require('../store/authStore') as typeof import('../store/authStore');
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// On a 401, refresh the Supabase session once and replay the original request.
// Mirrors nomad-web's response interceptor; keeps the auth store's token in sync.
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { useAuthStore } = require('../store/authStore') as typeof import('../store/authStore');
      const { data, error: refreshErr } = await supabase.auth.refreshSession();
      if (refreshErr || !data.session) {
        await useAuthStore.getState().signOut();
        return Promise.reject(error);
      }
      useAuthStore.getState().setSession(data.session);
      original.headers.Authorization = `Bearer ${data.session.access_token}`;
      return api.request(original);
    }
    return Promise.reject(error);
  },
);
