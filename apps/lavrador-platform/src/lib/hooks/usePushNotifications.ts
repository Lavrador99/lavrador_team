'use client';
import { useState, useEffect } from 'react';
import { api } from '../api/axios';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from(Array.from(raw).map((c) => c.charCodeAt(0)));
}

export type PushState = 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed' | 'loading';

export function usePushNotifications() {
  const [state, setState] = useState<PushState>('loading');

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      setState(existing ? 'subscribed' : 'unsubscribed');
    }).catch(() => setState('unsupported'));
  }, []);

  async function subscribe() {
    if (!('serviceWorker' in navigator)) return;
    setState('loading');
    try {
      const { data } = await api.get('/notifications/vapid-public-key');
      const vapidKey = data?.publicKey;
      if (!vapidKey) { setState('unsupported'); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      await api.post('/notifications/subscribe', sub.toJSON());
      setState('subscribed');
    } catch {
      setState('unsubscribed');
    }
  }

  async function unsubscribe() {
    if (!('serviceWorker' in navigator)) return;
    setState('loading');
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api.delete('/notifications/subscribe', { data: { endpoint: sub.endpoint } });
        await sub.unsubscribe();
      }
      setState('unsubscribed');
    } catch {
      setState('subscribed');
    }
  }

  return { state, subscribe, unsubscribe };
}
