import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SessionDto, CreateSessionRequest, UpdateSessionRequest } from '@libs/types';
import { sessionsApi } from '../../utils/api/clients.api';

interface ScheduleState {
  sessions: SessionDto[];
  selectedSession: SessionDto | null;
  loading: boolean;
  error: string | null;
  // Filtros da agenda
  viewMode: 'week' | 'month';
  currentDate: string; // ISO date string do dia/semana actual
}

const initialState: ScheduleState = {
  sessions: [],
  selectedSession: null,
  loading: false,
  error: null,
  viewMode: 'week',
  currentDate: new Date().toISOString(),
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchSessions = createAsyncThunk(
  'schedule/fetchSessions',
  async (filters: { from?: string; to?: string; clientId?: string } = {}, { rejectWithValue }) => {
    try {
      return await sessionsApi.getAll(filters);
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? 'Erro ao carregar sessões');
    }
  },
);

export const createSession = createAsyncThunk(
  'schedule/createSession',
  async (body: CreateSessionRequest, { rejectWithValue }) => {
    try {
      return await sessionsApi.create(body);
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? 'Erro ao criar sessão');
    }
  },
);

export const updateSession = createAsyncThunk(
  'schedule/updateSession',
  async ({ id, body }: { id: string; body: UpdateSessionRequest }, { rejectWithValue }) => {
    try {
      return await sessionsApi.update(id, body);
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? 'Erro ao atualizar sessão');
    }
  },
);

export const removeSession = createAsyncThunk(
  'schedule/removeSession',
  async (id: string, { rejectWithValue }) => {
    try {
      await sessionsApi.remove(id);
      return id;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? 'Erro ao remover sessão');
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    setViewMode(state, action: PayloadAction<'week' | 'month'>) {
      state.viewMode = action.payload;
    },
    setCurrentDate(state, action: PayloadAction<string>) {
      state.currentDate = action.payload;
    },
    selectSession(state, action: PayloadAction<SessionDto | null>) {
      state.selectedSession = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSessions.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = action.payload;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(createSession.fulfilled, (state, action) => {
        state.sessions.push(action.payload);
        state.sessions.sort((a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
        );
      });

    builder
      .addCase(updateSession.fulfilled, (state, action) => {
        const idx = state.sessions.findIndex((s) => s.id === action.payload.id);
        if (idx >= 0) state.sessions[idx] = action.payload;
        if (state.selectedSession?.id === action.payload.id) {
          state.selectedSession = action.payload;
        }
      });

    builder
      .addCase(removeSession.fulfilled, (state, action) => {
        state.sessions = state.sessions.filter((s) => s.id !== action.payload);
        if (state.selectedSession?.id === action.payload) {
          state.selectedSession = null;
        }
      });
  },
});

export const { setViewMode, setCurrentDate, selectSession, clearError } = scheduleSlice.actions;
export default scheduleSlice.reducer;
