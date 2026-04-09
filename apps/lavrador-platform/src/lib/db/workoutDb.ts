import Dexie, { Table } from 'dexie';
import { WorkoutDto, CreateWorkoutLogRequest } from '@libs/types';

interface CachedWorkout extends WorkoutDto {
  syncedAt: number; // timestamp
}

interface PendingLog extends CreateWorkoutLogRequest {
  id?: number; // auto-increment PK
  localId: string; // uuid for deduplication
  createdAt: number;
}

class WorkoutDatabase extends Dexie {
  workouts!: Table<CachedWorkout, string>;
  pendingLogs!: Table<PendingLog, number>;

  constructor() {
    super('LavradorTeam');
    this.version(1).stores({
      workouts: 'id, syncedAt',
      pendingLogs: '++id, localId, workoutId, createdAt',
    });
  }
}

// Singleton — only created in browser
let _db: WorkoutDatabase | null = null;

export function getDb(): WorkoutDatabase {
  if (typeof window === 'undefined') throw new Error('Dexie only runs in browser');
  if (!_db) _db = new WorkoutDatabase();
  return _db;
}

export async function cacheWorkout(workout: WorkoutDto) {
  const db = getDb();
  await db.workouts.put({ ...workout, syncedAt: Date.now() });
}

export async function getCachedWorkout(id: string): Promise<WorkoutDto | null> {
  const db = getDb();
  const cached = await db.workouts.get(id);
  return cached ?? null;
}

export async function queuePendingLog(log: CreateWorkoutLogRequest, localId: string) {
  const db = getDb();
  await db.pendingLogs.add({ ...log, localId, createdAt: Date.now() });
}

export async function flushPendingLogs(submitFn: (log: CreateWorkoutLogRequest) => Promise<void>) {
  const db = getDb();
  const pending = await db.pendingLogs.orderBy('createdAt').toArray();
  for (const log of pending) {
    try {
      const { id: _id, localId: _lid, createdAt: _ca, ...payload } = log;
      await submitFn(payload);
      await db.pendingLogs.delete(log.id!);
    } catch {
      // leave in queue, retry next time
    }
  }
}
