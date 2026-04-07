import axios from "axios";
import { store } from "../../store";
import { logout, refreshSession } from "../../store/slices/authSlice";

export const api = axios.create({
  baseURL: "http://localhost:3333/api",
  withCredentials: true, // envia cookie do refresh token
});

// Injeta access token em cada pedido
api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Tenta refresh automático em 401
let isRefreshing = false;
let queue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          queue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;
      const result = await store.dispatch(refreshSession());

      if (refreshSession.fulfilled.match(result)) {
        const newToken = result.payload.accessToken;
        queue.forEach((cb) => cb(newToken));
        queue = [];
        isRefreshing = false;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } else {
        queue = [];
        isRefreshing = false;
        store.dispatch(logout());
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
