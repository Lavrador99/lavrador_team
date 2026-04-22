// Service Worker — Lavrador Team PWA
// Handles: push notifications, offline caching, background sync

const CACHE_NAME = 'lavrador-v1';
const OFFLINE_URLS = ['/', '/client/my-plan', '/client/dashboard'];

// ── Install ──────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

// ── Push Notifications ───────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { title: 'Lavrador Team', body: event.data?.text() ?? '' };
  }

  const title = data.title || 'Lavrador Team';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: { url: data.url || '/client/dashboard' },
    vibrate: [200, 100, 200],
    requireInteraction: false,
    tag: data.tag || 'lavrador-notification',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(url);
      } else {
        clients.openWindow(url);
      }
    }),
  );
});

// ── Background Sync (pending workout logs) ───────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-logs') {
    event.waitUntil(syncPendingLogs());
  }
});

async function syncPendingLogs() {
  try {
    const db = await openDb();
    const tx = db.transaction('pendingLogs', 'readonly');
    const store = tx.objectStore('pendingLogs');
    const keys = await storeGetAllKeys(store);
    await tx.done;

    for (const key of keys) {
      const readTx = db.transaction('pendingLogs', 'readonly');
      const log = await readTx.objectStore('pendingLogs').get(key);
      await readTx.done;

      if (!log) continue;

      const response = await fetch('/api/workouts/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(log),
      });

      if (response.ok) {
        const delTx = db.transaction('pendingLogs', 'readwrite');
        await delTx.objectStore('pendingLogs').delete(key);
        await delTx.done;
      }
    }
  } catch {
    // Sync will retry automatically
  }
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('lavrador-offline', 1);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function storeGetAllKeys(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAllKeys();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
