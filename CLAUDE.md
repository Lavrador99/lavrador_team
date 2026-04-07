# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
yarn dev              # Run API (port 3333) + Web (port 4501) concurrently
yarn api              # API only
yarn web              # Web only

# Build
yarn build:api
yarn build:web

# Lint & Test
yarn lint             # Lint all projects
yarn test             # Test all projects
nx test api           # Single project test
nx test web

# Database (runs from apps/api/)
yarn db:migrate       # prisma migrate dev
yarn db:seed          # Seed with ts-node
yarn db:studio        # Open Prisma Studio
yarn db:generate      # Regenerate Prisma client after schema changes
```

## Architecture

**NX 21 monorepo** with Yarn workspaces:
- `apps/api` — NestJS 10, Prisma 5, PostgreSQL (via Docker)
- `apps/web` — React 18, Redux Toolkit, Styled Components, Vite
- `libs/types` — Shared TypeScript interfaces and DTOs imported as `@libs/types`

### Frontend (apps/web)

**State management**: Redux Toolkit with 4 slices — `auth`, `prescription`, `schedule`, `workoutEditor`. The `workoutEditor` slice owns the entire workout builder state: blocks, exercises, dirty flag, save/load thunks, and duration preview.

**Workout data model**: A `WorkoutDto` stores `blocks: WorkoutBlock[]` as JSON in Postgres. Each `WorkoutBlock` has a `type` (WARMUP | SEQUENTIAL | SUPERSET | CIRCUIT | TABATA | CARDIO | FLEXIBILITY), `restBetweenSets`, `restAfterBlock`, and `exercises: BlockExercise[]`. Block-specific configs live on optional fields (e.g., `tabata`, `cardioMethod`, `stretchMethod`).

**Suggestion engine UI** (`SuggestionPanel`): Collapsible panel triggered by a button. Takes `clientId`, `level`, `flags`, `equipment` as props and calls `POST /api/suggestions`. Returns ACSM 2026 prescriptions + exercise suggestions scored by PT preference history. The `onImport(exercise: ExerciseSuggestion)` callback is how the parent page receives a selected exercise.

**API layer**: Axios-based clients in `apps/web/src/app/utils/api/`. Each module (workouts, suggestions, exercises, clients, etc.) has its own `*.api.ts` file.

**Styling**: All styled-components inline at the bottom of each file. Color palette: green `#c8f542` (primary action), dark backgrounds `#0a0a0f` / `#111118`, monospace font `DM Mono`, display font `Syne`.

### Backend (apps/api)

**NestJS modules**: `auth` (JWT + Passport), `users`, `clients`, `assessments`, `programs`, `workouts`, `exercises`, `sessions`, `suggestion`, `stats`. Each module follows Controller → Service → Repository pattern.

**Suggestion engine** (`suggestion` module): Implements ACSM 2026 guidelines mapped by `TrainingObjective`. Activates PT preference learning mode after 10 workouts (`THRESHOLD_WORKOUTS`). Scores exercises using `ExercisePreferenceScore` (chosen/rejected feedback) + equipment match + clinical flags. Corrective exercises are ~20% of suggestions.

**Database**: Prisma schema at `apps/api/prisma/schema.prisma`. `Workout.blocks` and `WorkoutLog.entries` are stored as `Json` columns — their TypeScript shapes live in `libs/types`. Run `yarn db:generate` after any schema change.

### Shared types

`libs/types/src/index.ts` is the source of truth for all DTOs shared between frontend and backend. Import as `@libs/types`. Key types: `WorkoutBlock`, `BlockExercise`, `BlockType`, `WorkoutDto`, `TrainingLevel`, `MovementPattern`, `Equipment`.
