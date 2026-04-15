'use client';
import { useEffect } from 'react';
import { flushPendingLogs, getPendingCount } from '../lib/db/workoutDb';
import { workoutsApi } from '../lib/api/workouts.api';

/**
 * Automatically flushes any workout logs queued in IndexedDB (offline mode)
 * whenever the client area mounts and the user is online.
 */
export function PendingLogsFlusher() {
  useEffect(() => {
    if (!navigator.onLine) return;
    getPendingCount().then((count) => {
      if (count === 0) return;
      flushPendingLogs(async (log) => { await workoutsApi.createLog(log); }).catch(() => {});
    }).catch(() => {});
  }, []);

  return null;
}
