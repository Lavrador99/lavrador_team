import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '../../utils/api/auth.api';

interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'CLIENT';
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  initializing: boolean; // true até o primeiro refresh completar
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  loading: false,
  error: null,
  initializing: true,
};

// ─── Thunks ──────────────────────────────────────────────────────────────────

export const login = createAsyncThunk(
  'auth/login',
  async (creds: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { accessToken } = await authApi.login(creds);
      const user = parseToken(accessToken);
      return { accessToken, user };
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? 'Erro ao iniciar sessão');
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authApi.logout();
});

export const refreshSession = createAsyncThunk(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const { accessToken } = await authApi.refresh();
      const user = parseToken(accessToken);
      return { accessToken, user };
    } catch {
      return rejectWithValue(null);
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    // login
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.accessToken;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.accessToken = null;
    });

    // refresh
    builder
      .addCase(refreshSession.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.user = action.payload.user;
        state.initializing = false;
      })
      .addCase(refreshSession.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.initializing = false;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseToken(token: string): AuthUser {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return { id: payload.sub, email: payload.email, role: payload.role };
}
