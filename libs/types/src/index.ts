// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// USER / CLIENT
// ─────────────────────────────────────────────────────────────────────────────

export type Role = "ADMIN" | "CLIENT";

export interface UserDto {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  client?: ClientDto;
}

export interface ClientDto {
  id: string;
  userId: string;
  name: string;
  birthDate?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  birthDate?: string;
  phone?: string;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRESCRIÇÃO — Fase 2 (tipos base já definidos para não bloquear)
// ─────────────────────────────────────────────────────────────────────────────

export type TrainingLevel = "iniciante" | "intermedio" | "avancado";
export type TrainingGoal =
  | "emagrecimento"
  | "hipertrofia"
  | "forca"
  | "resistencia"
  | "saude_geral"
  | "performance";

export type MovementPattern =
  | "dominante_joelho"
  | "dominante_anca"
  | "empurrar_horizontal"
  | "empurrar_vertical"
  | "puxar_horizontal"
  | "puxar_vertical"
  | "core"
  | "locomocao";

export type Equipment =
  | "barra"
  | "halteres"
  | "rack"
  | "maquinas"
  | "cabo"
  | "kettlebell"
  | "peso_corporal"
  | "banco"
  | "cardio_eq";

export interface ExerciseDto {
  id: string;
  name: string;
  pattern: MovementPattern;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: Equipment[];
  level: TrainingLevel;
  gifUrl?: string;
  videoUrl?: string;
  clinicalNotes?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSESSMENT
// ─────────────────────────────────────────────────────────────────────────────

export interface AssessmentData {
  // Pessoal
  nome: string;
  idade: number;
  sexo: "M" | "F";
  profissao: string;

  // Clínicos
  pas?: number;
  pad?: number;
  sintomas: string[];
  riscos: string[];

  // Desportivo
  pratica: string;
  tempoTreino: number;
  diasSemana: number;
  duracaoSessao: number;
  objetivo: string;
  lesoes: string[];
  equipamento: string[];

  // Avaliação física
  altura?: number;
  peso?: number;
  pctGordura?: number;
  cc?: number;
  fcRep?: number;
  vo2max?: number;
  pushup?: number;
  rm1Squat?: number;
  rm1Bench?: number;
  mobOmbro?: number;
  mobCF?: number;
  sarVal?: number;
}

export interface CreateAssessmentRequest {
  clientId: string;
  data: AssessmentData;
}

export interface AssessmentDto {
  id: string;
  clientId: string;
  level: TrainingLevel;
  data: AssessmentData;
  flags: string[];
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRAMS
// ─────────────────────────────────────────────────────────────────────────────

export type ProgramStatus = "ACTIVE" | "ARCHIVED";
export type SelectionType = "PREFERRED" | "REQUIRED";

export interface ExerciseSelectionDto {
  id: string;
  exerciseId: string;
  pattern: MovementPattern;
  type: SelectionType;
  exercise?: ExerciseDto;
}

export interface FittVp {
  freq: string;
  intensidade: string;
  tempo: string;
  tipo: string;
  volume: string;
  progressao: string;
}

export interface WeekEntry {
  wk: string | number;
  forca: string;
  cardio: string;
  flex: string;
}

export interface ProgramPhase {
  name: string;
  sub: string;
  weeks: number;
  description: string;
  method: string[];
  cardio: FittVp;
  forca: FittVp & {
    series: string;
    intervalo: string;
    velocidade: string;
    exercicios: string;
  };
  flex: Omit<FittVp, "progressao"> & { foco: string };
  weekByWeek: WeekEntry[];
}

export interface ProgramDto {
  id: string;
  clientId: string;
  assessmentId: string;
  name: string;
  status: ProgramStatus;
  phases: ProgramPhase[];
  exerciseSelections: ExerciseSelectionDto[];
  createdAt: string;
  updatedAt: string;
}

export interface GenerateProgramRequest {
  assessmentId: string;
  clientId: string;
  selectedExercises: {
    exerciseId: string;
    pattern: MovementPattern;
    type: SelectionType;
  }[];
}

export interface UpdateExerciseSelectionsRequest {
  selections: {
    exerciseId: string;
    pattern: MovementPattern;
    type: SelectionType;
  }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────────────────────────────────────

export type SessionType = "TRAINING" | "ASSESSMENT" | "FOLLOWUP";
export type SessionStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

export interface SessionDto {
  id: string;
  clientId: string;
  programId?: string;
  scheduledAt: string;
  duration: number;
  type: SessionType;
  status: SessionStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  client?: { id: string; name: string };
  program?: { id: string; name: string };
}

export interface CreateSessionRequest {
  clientId: string;
  programId?: string;
  scheduledAt: string;
  duration?: number;
  type?: SessionType;
  notes?: string;
}

export interface UpdateSessionRequest {
  scheduledAt?: string;
  duration?: number;
  type?: SessionType;
  status?: SessionStatus;
  notes?: string;
  programId?: string;
}

export interface SessionFilters {
  clientId?: string;
  status?: SessionStatus;
  from?: string;
  to?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalClients: number;
  activePrograms: number;
  sessionsThisWeek: number;
  sessionsThisMonth: number;
  attendanceRate: number; // 0-100
  newClientsThisMonth: number;
  sessionsByWeek: {
    week: string;
    total: number;
    completed: number;
    cancelled: number;
  }[];
  sessionsByType: { type: string; count: number }[];
  recentActivity: {
    clientId: string;
    clientName: string;
    action: string;
    date: string;
  }[];
}

export interface ClientStats {
  clientId: string;
  clientName: string;
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  noShowSessions: number;
  attendanceRate: number;
  currentLevel: TrainingLevel;
  totalPrograms: number;
  activeProgram: string | null;
  assessmentHistory: {
    id: string;
    date: string;
    level: TrainingLevel;
    flags: string[];
  }[];
  sessionHistory: {
    week: string;
    total: number;
    completed: number;
    cancelled: number;
  }[];
  totalWorkoutLogs?: number;
  recentWorkoutLogs?: { id: string; date: string; durationMin?: number | null }[];
}

export interface SessionsDistribution {
  byType: { type: string; count: number; pct: number }[];
  byStatus: { status: string; count: number; pct: number }[];
  byDayOfWeek: { day: string; count: number }[];
  byHour: { hour: number; count: number }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKOUTS
// ─────────────────────────────────────────────────────────────────────────────

export type BlockType =
  | "WARMUP"
  | "SEQUENTIAL"
  | "SUPERSET"
  | "CIRCUIT"
  | "TABATA"
  | "CARDIO"
  | "FLEXIBILITY";

export type CardioMethod =
  | "CONTINUO_EXTENSIVO"
  | "CONTINUO_INTENSIVO"
  | "CONTINUO_VARIAVEL"
  | "INTERVALADO"
  | "HIIT"
  | "FARTLEK";

export type StretchMethod = "ESTATICO" | "BALISTICO" | "PNF";

export type WorkoutStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface TabataConfig {
  workSeconds: number; // ex: 20
  restSeconds: number; // ex: 10
  rounds: number; // ex: 8
  totalSeconds: number; // calculado: rounds × (work + rest)
}

export interface BlockExercise {
  id: string;
  exerciseId: string | null; // null = exercício inline
  exerciseName: string;
  muscleGroup?: string;
  sets: number;
  reps: string; // "8-12" | "AMRAP" | "20s" | "30s"
  load?: number; // kg
  loadNote?: string; // "60% 1RM" | "RPE 8"
  percentRM?: number; // 75 → 75% 1RM
  rir?: number; // Repetições em Reserva
  tempoExecution?: string; // "2:1:2:0"
  isometricSeconds?: number; // para prancha, wall sit
  restAfterSet?: number; // segundos
  notes?: string;
}

export interface WorkoutBlock {
  id: string;
  type: BlockType;
  order: number;
  label?: string;
  restBetweenSets: number; // segundos
  restAfterBlock: number; // segundos

  // TABATA / HIIT
  tabata?: TabataConfig;

  // CARDIO
  cardioMethod?: CardioMethod;
  cardioDurationMin?: number;
  cardioZoneLow?: number; // bpm
  cardioZoneHigh?: number; // bpm
  cardioNotes?: string;

  // FLEXIBILITY
  stretchMethod?: StretchMethod;
  holdSeconds?: number; // 10–30s
  contractionSeconds?: number; // PNF: 6s

  exercises: BlockExercise[];

  // Calculado
  estimatedDurationMin?: number;
}

export interface WorkoutDto {
  id: string;
  programId: string;
  clientId: string;
  name: string;
  dayLabel?: string;
  order: number;
  status: WorkoutStatus;
  blocks: WorkoutBlock[];
  durationEstimatedMin: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkoutRequest {
  programId: string;
  clientId: string;
  name: string;
  dayLabel?: string;
  order?: number;
  blocks?: WorkoutBlock[];
}

export interface UpdateWorkoutRequest {
  name?: string;
  dayLabel?: string;
  order?: number;
  status?: WorkoutStatus;
  blocks?: WorkoutBlock[];
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKOUT LOGS (progresso do cliente)
// ─────────────────────────────────────────────────────────────────────────────

export interface WorkoutLogEntry {
  blockId: string;
  exerciseId: string;
  exerciseName: string;
  sets: {
    setNumber: number;
    reps: number;
    load?: number;
    rpe?: number;
    completed: boolean;
    notes?: string;
  }[];
}

export interface WorkoutLogDto {
  id: string;
  workoutId: string;
  clientId: string;
  date: string;
  entries: WorkoutLogEntry[];
  notes?: string;
  durationMin?: number;
  rpe?: number;
  createdAt: string;
}

export interface CreateWorkoutLogRequest {
  workoutId: string;
  date?: string;
  entries: WorkoutLogEntry[];
  notes?: string;
  durationMin?: number;
  rpe?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSONAL RECORDS (RMs)
// ─────────────────────────────────────────────────────────────────────────────

export type RecordType = 'WEIGHT_KG' | 'REPS_MAX' | 'ISOMETRIC_S' | 'DISTANCE_M' | 'DURATION_S';

export const RECORD_TYPE_LABEL: Record<RecordType, string> = {
  WEIGHT_KG:   'Carga (kg)',
  REPS_MAX:    'Reps máximas',
  ISOMETRIC_S: 'Isométrica (s)',
  DISTANCE_M:  'Distância (m)',
  DURATION_S:  'Duração (s)',
};

export const RECORD_TYPE_UNIT: Record<RecordType, string> = {
  WEIGHT_KG:   'kg',
  REPS_MAX:    'reps',
  ISOMETRIC_S: 's',
  DISTANCE_M:  'm',
  DURATION_S:  's',
};

export interface PersonalRecordDto {
  id: string;
  clientId: string;
  exerciseId?: string;
  exerciseName: string;
  type: RecordType;
  value: number;
  notes?: string;
  recordedAt: string;
  createdAt: string;
}

export interface CreatePersonalRecordRequest {
  clientId: string;
  exerciseId?: string;
  exerciseName: string;
  type: RecordType;
  value: number;
  notes?: string;
  recordedAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// USER CREATION
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateUserRequest {
  email: string;
  password: string;
  role: "ADMIN" | "CLIENT";
  name: string;
  birthDate?: string;
  phone?: string;
  notes?: string;
}
