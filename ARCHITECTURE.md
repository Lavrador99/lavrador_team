# Lavrador Team — Documentação Técnica Completa

> Última actualização: Abril 2026

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Estrutura do Monorepo](#2-estrutura-do-monorepo)
3. [Base de Dados — Prisma Schema](#3-base-de-dados--prisma-schema)
4. [API — NestJS Backend](#4-api--nestjs-backend)
5. [Frontend — lavrador-platform (Next.js 15)](#5-frontend--lavrador-platform-nextjs-15)
6. [Tipos Partilhados — libs/types](#6-tipos-partilhados--libstypes)
7. [Autenticação & Segurança](#7-autenticação--segurança)
8. [Comandos & Scripts](#8-comandos--scripts)

---

## 1. Visão Geral

O **Lavrador Team** é uma plataforma de gestão para personal trainers. Permite ao PT gerir clientes, criar prescrições de treino baseadas nas directrizes ACSM 2026, acompanhar evolução, comunicar com clientes e gerir facturação. O cliente acede a uma app mobile-first para ver o seu plano, registar treinos offline, acompanhar os seus recordes e hábitos.

### Stack tecnológico

| Camada | Tecnologia |
|--------|-----------|
| Backend | NestJS 10, Prisma 5, PostgreSQL |
| Frontend | Next.js 15 (App Router), React 18, TailwindCSS 3 |
| Estado (UI) | Zustand 5 |
| Estado (servidor) | SWR 2 |
| Auth | JWT (Passport) + refresh token em httpOnly cookie |
| Realtime | Socket.io (mensagens) |
| Animações | Framer Motion |
| Gráficos | Recharts |
| Monorepo | NX 21 + Yarn Workspaces |

---

## 2. Estrutura do Monorepo

```
lavrador-team/
├── apps/
│   ├── api/                    → Backend NestJS (porta 3333)
│   │   ├── src/modules/       → 15 módulos funcionais
│   │   ├── prisma/
│   │   │   ├── schema.prisma  → Modelos da base de dados
│   │   │   ├── seed.ts        → Seed inicial (admin + cliente demo)
│   │   │   ├── import-exercisedb.ts  → Importa 873 exercícios
│   │   │   └── sync-exercisedb-gifs.ts → Sincroniza GIFs (ExerciseDB API)
│   │   └── uploads/           → Ficheiros locais (GIFs, fotos de progresso)
│   │
│   └── lavrador-platform/      → Frontend Next.js 15 (porta 3000)
│       └── src/
│           ├── app/
│           │   ├── (auth)/    → Páginas públicas (login)
│           │   ├── (admin)/   → Área do PT
│           │   ├── (client)/  → Área do cliente
│           │   ├── api/       → API Routes Next.js
│           │   ├── middleware.ts → Protecção de rotas por role
│           │   └── layout.tsx → Root layout
│           ├── components/    → Componentes partilhados
│           └── lib/
│               ├── api/       → 15 ficheiros de API (axios)
│               ├── stores/    → Zustand stores
│               └── socket.ts  → Socket.io client
│
└── libs/
    └── types/src/index.ts     → DTOs partilhados entre API e frontend
```

### Scripts principais

```bash
yarn dev             # API + Platform em simultâneo
yarn api             # Só a API (porta 3333)
yarn platform        # Só o frontend (porta 3000)
yarn build:api       # Build da API
yarn build:platform  # Build do frontend (Next.js)

# Base de dados
yarn db:migrate           # Cria/aplica migrações Prisma
yarn db:seed              # Seed inicial (admin + cliente demo)
yarn db:studio            # Abre Prisma Studio
yarn db:generate          # Regenera Prisma Client após schema changes
yarn db:import-exercisedb # Importa 873 exercícios do free-exercise-db
yarn db:sync-exercisedb-gifs  # Sincroniza GIFs via ExerciseDB RapidAPI
```

---

## 3. Base de Dados — Prisma Schema

### Enums

| Enum | Valores |
|------|---------|
| `Role` | `ADMIN`, `CLIENT` |
| `TrainingLevel` | `INICIANTE`, `INTERMEDIO`, `AVANCADO` |
| `MovementPattern` | `DOMINANTE_JOELHO`, `DOMINANTE_ANCA`, `EMPURRAR_HORIZONTAL`, `EMPURRAR_VERTICAL`, `PUXAR_HORIZONTAL`, `PUXAR_VERTICAL`, `CORE`, `LOCOMOCAO` |
| `Equipment` | `BARRA`, `HALTERES`, `RACK`, `MAQUINAS`, `CABO`, `KETTLEBELL`, `PESO_CORPORAL`, `BANCO`, `CARDIO_EQ`, `SMITH`, `RESISTANCE_BAND`, `PARALELAS`, `BARRA_FIXA`, `FOAM_ROLLER` |
| `WorkoutStatus` | `DRAFT`, `ACTIVE`, `ARCHIVED` |
| `ProgramStatus` | `ACTIVE`, `ARCHIVED` |
| `SelectionType` | `PREFERRED`, `REQUIRED` |
| `SessionType` | `TRAINING`, `ASSESSMENT`, `FOLLOWUP` |
| `SessionStatus` | `SCHEDULED`, `COMPLETED`, `CANCELLED`, `NO_SHOW` |
| `InvoiceStatus` | `PENDING`, `PAID`, `OVERDUE`, `CANCELLED` |
| `RecordType` | `WEIGHT_KG`, `REPS_MAX`, `ISOMETRIC_S`, `DISTANCE_M`, `DURATION_S` |

---

### Modelos

#### `User`
Entidade base de autenticação.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (cuid) | PK |
| `email` | String (unique) | Email de login |
| `passwordHash` | String | Hash bcrypt |
| `role` | Role | ADMIN ou CLIENT |
| `createdAt` | DateTime | — |
| `updatedAt` | DateTime | — |

Relações: `Client?`, `RefreshToken[]`, `sentMessages[]`, `receivedMessages[]`

---

#### `Client`
Perfil detalhado do cliente (1:1 com User).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (cuid) | PK |
| `userId` | String (unique) | FK → User |
| `name` | String | Nome completo |
| `birthDate` | DateTime? | Data de nascimento |
| `phone` | String? | Contacto |
| `notes` | String? | Notas do PT |

Relações: `assessments[]`, `programs[]`, `sessions[]`, `workouts[]`, `workoutLogs[]`, `personalRecords[]`, `invoices[]`, `habits[]`, `progressPhotos[]`, `mealPlans[]`

---

#### `Exercise`
Base de dados de exercícios (873 importados + personalizados).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (cuid) | PK |
| `name` | String (unique) | Nome do exercício |
| `pattern` | MovementPattern | Padrão de movimento |
| `primaryMuscles` | String[] | Músculos principais |
| `secondaryMuscles` | String[] | Músculos secundários |
| `equipment` | Equipment[] | Equipamento necessário |
| `level` | TrainingLevel | Nível de dificuldade |
| `gifUrl` | String? | URL da imagem/GIF |
| `videoUrl` | String? | URL do vídeo |
| `clinicalNotes` | String[] | Notas clínicas (ex: "evitar com dor no joelho") |
| `isActive` | Boolean | Soft delete |

Relações: `exerciseSelections[]`, `preferenceScores[]`

---

#### `Assessment`
Avaliação inicial do cliente — base para a prescrição.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (cuid) | PK |
| `clientId` | String | FK → Client |
| `level` | TrainingLevel | Nível determinado na avaliação |
| `data` | Json | Dados completos da avaliação (ver estrutura abaixo) |
| `flags` | String[] | Flags clínicas (ex: `["diabetes", "dor_joelho"]`) |
| `createdAt` | DateTime | — |

**Estrutura do campo `data` (Json):**
- Pessoal: `nome`, `idade`, `sexo`, `profissao`, `lifestyle`
- Clínico: `PAS`, `PAD`, `sintomas[]`, `riscos[]`, `lesoes[]`
- Desportivo: `pratica`, `tempoTreino`, `diasSemana`, `objetivo`, `equipamento[]`, `historialLesoes`
- Físico: `altura`, `peso`, `pctGordura`, `imc`, `fcRepouso`, `vo2max`, `pushup1min`, `rm1Squat`, `rm1Bench`, `mobilidade`
- Karvonen: `fcMax`, `zonas[]` (Z1-Z5 em bpm)

---

#### `Program`
Plano de treino gerado pelo motor de prescrição.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (cuid) | PK |
| `clientId` | String | FK → Client |
| `assessmentId` | String | FK → Assessment |
| `name` | String | Ex: "Programa Hipertrofia — André" |
| `status` | ProgramStatus | ACTIVE ou ARCHIVED |
| `phases` | Json | Array de ProgramPhase (ver estrutura) |

**Estrutura de `phases` (Json array):**
```json
[
  {
    "name": "Fase 1 — Adaptação",
    "sub": "Semanas 1-4",
    "weeks": 4,
    "description": "...",
    "method": ["Séries Simples"],
    "cardio": { "F": "3x/sem", "I": "Z2 (60-70%FCmax)", "T": "Contínuo", "D": "30 min" },
    "forca": {
      "series": "3",
      "repeticoes": "12-15",
      "intervalo": "60-90s",
      "velocidade": "Controlada (2-0-2)",
      "exercicios": "6-8 por sessão"
    },
    "flex": "Estático pós-treino, 30s/posição",
    "weekByWeek": [
      { "week": 1, "volume": "...", "intensidade": "..." }
    ]
  }
]
```

Relações: `exerciseSelections[]`, `sessions[]`, `workouts[]`

---

#### `ExerciseSelection`
Associação exercício-programa (selecção 80/20 do PT).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (cuid) | PK |
| `programId` | String | FK → Program |
| `exerciseId` | String | FK → Exercise |
| `pattern` | MovementPattern | Padrão de movimento deste exercício |
| `type` | SelectionType | PREFERRED ou REQUIRED |

Unique: `(programId, exerciseId)`

---

#### `Workout`
Sessão de treino detalhada (plano diário com blocos e exercícios).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (cuid) | PK |
| `programId` | String | FK → Program |
| `clientId` | String | FK → Client |
| `name` | String | Ex: "Treino A — Peito e Tríceps" |
| `dayLabel` | String? | Ex: "Segunda-feira" |
| `order` | Int | Ordem na semana |
| `status` | WorkoutStatus | DRAFT / ACTIVE / ARCHIVED |
| `blocks` | Json | Array de WorkoutBlock (ver tipos partilhados) |
| `durationEstimatedMin` | Int | Calculada automaticamente |

---

#### `WorkoutLog`
Registo de execução de um treino pelo cliente.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (cuid) | PK |
| `workoutId` | String | FK → Workout |
| `clientId` | String | FK → Client |
| `date` | DateTime | Data de execução |
| `entries` | Json | Array de WorkoutLogEntry (exercícios + séries executadas) |
| `notes` | String? | Notas do cliente |
| `durationMin` | Int? | Duração real do treino |
| `rpe` | Int? | Esforço percebido (1-10) |

---

#### `Session`
Sessão agendada entre PT e cliente.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (cuid) | PK |
| `clientId` | String | FK → Client |
| `programId` | String? | FK → Program (opcional) |
| `scheduledAt` | DateTime | Data e hora |
| `duration` | Int | Duração em minutos |
| `type` | SessionType | TRAINING / ASSESSMENT / FOLLOWUP |
| `status` | SessionStatus | SCHEDULED / COMPLETED / CANCELLED / NO_SHOW |
| `notes` | String? | Notas |

---

#### `PersonalRecord`
Recordes pessoais do cliente.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (cuid) | PK |
| `clientId` | String | FK → Client |
| `exerciseId` | String? | FK → Exercise (opcional) |
| `exerciseName` | String | Nome do exercício |
| `type` | RecordType | WEIGHT_KG / REPS_MAX / ISOMETRIC_S / DISTANCE_M / DURATION_S |
| `value` | Float | Valor do recorde |
| `notes` | String? | Notas |
| `recordedAt` | DateTime | Data do recorde |

---

#### `Habit`
Hábito diário atribuído pelo PT ao cliente.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (cuid) | PK |
| `clientId` | String | FK → Client |
| `name` | String | Ex: "Beber 2L de água" |
| `icon` | String? | Emoji |
| `frequency` | String? | Ex: "Diário" |
| `isActive` | Boolean | — |

Relações: `logs[]` (HabitLog — registo diário de conclusão)

---

#### `Invoice`
Facturação de clientes.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (cuid) | PK |
| `clientId` | String | FK → Client |
| `amount` | Float | Valor |
| `currency` | String | Default "EUR" |
| `description` | String | Ex: "Mensalidade Março 2026" |
| `status` | InvoiceStatus | PENDING / PAID / OVERDUE / CANCELLED |
| `dueDate` | DateTime | Data de vencimento |
| `paidAt` | DateTime? | Data de pagamento |

---

#### `ProgressPhoto`
Fotos de progresso corporal.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String (cuid) | PK |
| `clientId` | String | FK → Client |
| `url` | String | URL do ficheiro (local ou CDN) |
| `angle` | String | "Frontal" / "Lateral" / "Costas" |
| `takenAt` | DateTime | Data da foto |
| `notes` | String? | Notas |

---

#### `MealPlan` / `MealPlanDay` / `MealPlanMeal`
Plano nutricional estruturado.

- **MealPlan**: Plano geral com nome, datas de início/fim, notas
- **MealPlanDay**: Um dia da semana (0=Domingo, 6=Sábado) com label (ex: "Dia de treino")
- **MealPlanMeal**: Uma refeição num dia — `items[]` em Json com `{foodId, foodName, grams, kcal, protein, carbs, fat}`

#### `Food`
Base de dados de alimentos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | String | Nome do alimento |
| `kcal` | Float | Calorias por 100g |
| `protein` | Float | Proteína por 100g |
| `carbs` | Float | Hidratos por 100g |
| `fat` | Float | Gordura por 100g |
| `isCustom` | Boolean | Alimento criado pelo PT vs base de dados |

---

#### `ExercisePreferenceScore`
Motor de aprendizagem do PT (activado após 10 treinos registados).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `exerciseId` | String | FK → Exercise |
| `level` | TrainingLevel | Contexto do cliente |
| `pattern` | MovementPattern | Padrão de movimento |
| `objective` | String | Ex: "HIPERTROFIA", "FORCA" |
| `score` | Float | Score de preferência (começa em 1.0) |
| `timesUsed` | Int | Vezes que o PT escolheu este exercício |
| `timesRejected` | Int | Vezes que o PT substituiu |

Unique: `(exerciseId, level, pattern, objective)`

#### `ExerciseSubstitution`
Histórico de substituições de exercícios pelo PT.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `fromExId` | String | Exercício substituído |
| `toExId` | String | Exercício escolhido |
| `level` | TrainingLevel | — |
| `reason` | String? | Ex: "dor_joelho", "sem_equipamento" |

#### `WorkoutTemplate`
Templates de treino reutilizáveis.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | String | Nome do template |
| `description` | String? | Descrição |
| `tags` | String[] | Ex: ["peito", "hipertrofia"] |
| `blocks` | Json | Mesma estrutura que Workout.blocks |
| `createdBy` | String | userId do criador |
| `isPublic` | Boolean | Visível a todos os PTs |

#### `Message`
Mensagens entre PT e cliente.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `fromUserId` | String | FK → User |
| `toUserId` | String | FK → User |
| `content` | String | Texto da mensagem |
| `read` | Boolean | Lida pelo destinatário |

---

## 4. API — NestJS Backend

**Base URL:** `http://localhost:3333/api`

### Convenções
- Todos os endpoints (excepto auth) requerem `@JwtGuard` (Bearer token)
- Endpoints admin adicionam `@RolesGuard @Roles('ADMIN')`
- Respostas de erro: `{ statusCode, message, error }`
- Uploads: multipart/form-data (max 50MB exercícios, 20MB fotos)

---

### 4.1 Auth Module — `/auth`

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| POST | `/auth/login` | Público | Login → accessToken + cookie refresh |
| POST | `/auth/register` | Público | Registo → accessToken + cookie refresh |
| POST | `/auth/refresh` | Público (cookie) | Renova accessToken |
| POST | `/auth/logout` | JWT | Limpa tokens |
| POST | `/auth/users` | ADMIN | Cria utilizador (admin ou cliente) |

**Login/Register Response:**
```json
{ "accessToken": "eyJ..." }
```
O refresh token é enviado como `httpOnly` cookie (`refresh_token`), não exposto no body.

---

### 4.2 Users Module — `/users`

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| GET | `/users/me` | JWT | Perfil do utilizador actual |
| PATCH | `/users/me` | JWT | Actualizar perfil (nome, telefone, notas) |
| GET | `/users` | ADMIN | Listar todos os clientes |
| GET | `/users/clients/:clientId/detail` | ADMIN | Detalhe de um cliente |

---

### 4.3 Exercises Module — `/exercises`

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| GET | `/exercises` | JWT | Listar exercícios com filtros |
| GET | `/exercises/:id` | JWT | Detalhe de um exercício |
| POST | `/exercises` | ADMIN | Criar exercício |
| PATCH | `/exercises/:id` | ADMIN | Actualizar exercício |
| POST | `/exercises/:id/upload` | ADMIN | Upload de GIF/vídeo |
| DELETE | `/exercises/:id` | ADMIN | Eliminar (soft delete) |

**Filtros disponíveis (query params):** `pattern`, `level`, `equipment`, `muscle`, `search`

---

### 4.4 Assessments Module — `/assessments`

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| POST | `/assessments` | ADMIN | Criar avaliação para cliente |
| GET | `/assessments/client/:clientId` | ADMIN | Avaliações de um cliente |
| GET | `/assessments/my` | CLIENT | As minhas avaliações |
| GET | `/assessments/:id` | ADMIN | Detalhe de avaliação |

---

### 4.5 Programs Module — `/programs`

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| POST | `/programs/generate` | ADMIN | Gerar programa a partir de avaliação |
| GET | `/programs/client/:clientId` | ADMIN | Programas de um cliente |
| GET | `/programs/:id` | ADMIN | Detalhe de programa |
| PATCH | `/programs/:id/archive` | ADMIN | Arquivar programa |
| PATCH | `/programs/:id/exercises` | ADMIN | Actualizar selecção de exercícios |
| DELETE | `/programs/:id` | ADMIN | Eliminar programa |
| GET | `/programs/:id/export` | ADMIN | Exportar programa como JSON |

---

### 4.6 Workouts Module — `/workouts`

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| POST | `/workouts` | ADMIN | Criar treino |
| GET | `/workouts/program/:programId` | ADMIN | Treinos de um programa |
| GET | `/workouts/client/:clientId` | ADMIN | Treinos de um cliente |
| PATCH | `/workouts/:id` | ADMIN | Actualizar treino (activar envia email) |
| DELETE | `/workouts/:id` | ADMIN | Eliminar treino |
| POST | `/workouts/duration-preview` | ADMIN | Preview de duração |
| GET | `/workouts/my` | CLIENT | Os meus treinos activos |
| GET | `/workouts/:id` | JWT | Detalhe (CLIENT só vê os seus) |
| GET | `/workouts/:id/logs` | JWT | Logs de execução |
| POST | `/workouts/logs` | JWT | Registar execução de treino |
| GET | `/workouts/logs/my` | CLIENT | Os meus logs |
| GET | `/workouts/calendar/my` | CLIENT | Calendário (datas com treinos) |
| GET | `/workouts/muscle-volume/my` | CLIENT | Volume por grupo muscular |
| GET | `/workouts/history/my/exercise/:exerciseId` | CLIENT | Histórico de exercício |
| GET | `/workouts/calendar/client/:clientId` | ADMIN | Calendário de cliente |
| GET | `/workouts/muscle-volume/client/:clientId` | ADMIN | Volume de cliente |
| GET | `/workouts/history/client/:clientId/exercise/:exerciseId` | ADMIN | Histórico de exercício de cliente |

---

### 4.7 Sessions Module — `/sessions`

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| POST | `/sessions` | ADMIN | Agendar sessão |
| GET | `/sessions` | ADMIN | Listar sessões (filtros: clientId, status, from, to) |
| GET | `/sessions/:id` | ADMIN | Detalhe |
| PATCH | `/sessions/:id` | ADMIN | Actualizar (marcar como concluída, etc.) |
| DELETE | `/sessions/:id` | ADMIN | Eliminar |
| GET | `/sessions/client/:clientId/upcoming` | ADMIN | Próximas sessões |
| GET | `/sessions/client/:clientId/stats` | ADMIN | Estatísticas de sessões |

---

### 4.8 Stats Module — `/stats`

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| GET | `/stats/dashboard` | ADMIN | KPIs do dashboard (clientes, programas, sessões, taxa) |
| GET | `/stats/my` | CLIENT | Estatísticas pessoais |
| GET | `/stats/client/:id` | ADMIN | Estatísticas de cliente específico |
| GET | `/stats/sessions` | ADMIN | Distribuição de sessões (por tipo/status/dia/hora) |
| GET | `/stats/clients/activity` | ADMIN | Actividade dos clientes |

---

### 4.9 Personal Records Module — `/personal-records`

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| POST | `/personal-records` | ADMIN | Criar recorde manualmente |
| GET | `/personal-records/my/best` | CLIENT | Os meus melhores recordes |
| GET | `/personal-records/my/history` | CLIENT | Histórico por exercício (`?exercise=Squat`) |
| GET | `/personal-records/client/:clientId` | ADMIN | Recordes de cliente |
| GET | `/personal-records/client/:clientId/best` | ADMIN | Melhores de cliente |
| DELETE | `/personal-records/:id` | ADMIN | Eliminar recorde |

Os recordes são também **detectados automaticamente** ao registar um treino (`POST /workouts/logs`) — se o peso ou reps superar o registo anterior, cria um novo PR automaticamente.

---

### 4.10 Habits Module — `/habits`

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| GET | `/habits/my` | CLIENT | Os meus hábitos activos |
| GET | `/habits/my/adherence` | CLIENT | Taxa de adesão semanal (%) |
| POST | `/habits/:habitId/log` | JWT | Marcar hábito como feito/não feito |
| POST | `/habits/client/:clientId` | ADMIN | Criar hábito para cliente |
| GET | `/habits/client/:clientId` | ADMIN | Hábitos de cliente |
| GET | `/habits/client/:clientId/adherence` | ADMIN | Taxa de adesão de cliente |
| PATCH | `/habits/:id` | JWT | Actualizar hábito |
| DELETE | `/habits/:id` | JWT | Eliminar hábito |

---

### 4.11 Invoices Module — `/invoices`

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| POST | `/invoices` | ADMIN | Criar factura |
| GET | `/invoices` | ADMIN | Listar facturas (`?clientId=...`) |
| GET | `/invoices/summary/:clientId` | ADMIN | Resumo (total pendente, pago, em atraso) |
| GET | `/invoices/:id` | ADMIN | Detalhe |
| PATCH | `/invoices/:id` | ADMIN | Actualizar (marcar como pago, etc.) |
| DELETE | `/invoices/:id` | ADMIN | Eliminar |

---

### 4.12 Progress Photos Module — `/progress-photos`

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| POST | `/progress-photos/client/:clientId/upload` | ADMIN | Upload de foto (JPEG/PNG/WebP, max 20MB) |
| GET | `/progress-photos/client/:clientId` | ADMIN | Listar fotos (ordem cronológica DESC) |
| DELETE | `/progress-photos/:id` | ADMIN | Eliminar foto |

**Body do upload:** `multipart/form-data` com campos `file`, `angle` (Frontal/Lateral/Costas), `takenAt`, `notes`

---

### 4.13 Nutrition Module — `/nutrition`

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| GET | `/nutrition/foods` | JWT | Pesquisar alimentos (`?q=frango`) |
| POST | `/nutrition/foods` | ADMIN | Criar alimento personalizado |
| GET | `/nutrition/my-plan` | CLIENT | O meu plano nutricional activo |
| GET | `/nutrition/plans/client/:clientId` | ADMIN | Planos de cliente |
| POST | `/nutrition/plans` | ADMIN | Criar plano |
| DELETE | `/nutrition/plans/:id` | ADMIN | Eliminar plano |
| POST | `/nutrition/plans/:planId/days/:dayOfWeek` | ADMIN | Criar/actualizar dia do plano |
| POST | `/nutrition/days/:dayId/meals` | ADMIN | Adicionar refeição |
| PUT | `/nutrition/meals/:mealId` | ADMIN | Actualizar refeição |
| DELETE | `/nutrition/meals/:mealId` | ADMIN | Eliminar refeição |

---

### 4.14 Workout Templates Module — `/workout-templates`

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| POST | `/workout-templates` | ADMIN | Criar template |
| GET | `/workout-templates` | JWT | Listar templates (públicos + do criador) |
| GET | `/workout-templates/:id` | JWT | Detalhe |
| PATCH | `/workout-templates/:id` | ADMIN | Actualizar |
| DELETE | `/workout-templates/:id` | ADMIN | Eliminar |

---

### 4.15 Suggestion Module — `/suggestions` ⭐ Motor de Prescrição

Este módulo implementa as directrizes ACSM 2026 e um sistema de aprendizagem das preferências do PT.

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| POST | `/suggestions` | ADMIN | Gerar sugestões de exercícios |
| POST | `/suggestions/feedback/choose` | ADMIN | Registar escolha do PT |
| POST | `/suggestions/feedback/substitute` | ADMIN | Registar substituição |
| GET | `/suggestions/learning-status` | ADMIN | Estado do sistema de aprendizagem |
| POST | `/suggestions/validate` | ADMIN | Validar prescrição manual |

**Body de `/suggestions`:**
```json
{
  "clientId": "...",
  "level": "INTERMEDIO",
  "objective": "HIPERTROFIA",
  "flags": ["dor_joelho"],
  "equipment": ["BARRA", "HALTERES"],
  "pattern": "DOMINANTE_JOELHO"
}
```

**Resposta:**
```json
{
  "prescription": { /* ACSM 2026 parameters */ },
  "suggestions": [ /* scored exercises */ ],
  "correctiveExercises": [ /* ~20% of suggestions */ ],
  "warnings": [ /* clinical warnings */ ],
  "systemStatus": { "learningActive": true, "workoutsLogged": 15 }
}
```

**Como funciona o sistema de aprendizagem:**
1. Começa com score neutro (1.0) para todos os exercícios
2. Activa após 10 treinos registados pelo cliente (`THRESHOLD_WORKOUTS = 10`)
3. `timesUsed++` quando PT escolhe um exercício
4. `timesRejected++` quando PT substitui um exercício
5. `score = (timesUsed + 1) / (timesUsed + timesRejected + 2)` — Laplace smoothing
6. Exercícios corretivos (clínicos) representam ~20% das sugestões

---

### 4.16 Messages Module — `/messages`

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| GET | `/messages/history/:withUserId` | JWT | Histórico de conversa (`?take=50`) |
| GET | `/messages/partners` | JWT | Lista de parceiros de conversa |
| GET | `/messages/unread` | JWT | Contagem de mensagens não lidas |

**Realtime via Socket.io:**
- Evento `send_message` → `{ toUserId, content }`
- Evento `new_message` → recebido pelo destinatário
- Evento `mark_read` → `{ fromUserId }`

---

## 5. Frontend — lavrador-platform (Next.js 15)

### Middleware de Autenticação

`src/app/middleware.ts` protege todas as rotas:
- Rotas `/` (admin) → verificam cookie `access_token` + role `ADMIN`
- Rotas `/client/*` → verificam cookie `access_token` + role `CLIENT`
- Sem token → redirect para `/login`
- Role errado → redirect para a área correcta

---

### 5.1 Área do PT (Admin)

**Layout:** `(admin)/layout.tsx` — sidebar fixa com navegação + logout

#### `/dashboard`
**Dados:** `statsApi.getDashboard()`
**Mostra:**
- Total de clientes activos
- Programas activos
- Sessões esta semana / este mês
- Taxa de comparência
- Novos clientes este mês
- Feed de actividade recente

---

#### `/clients`
**Dados:** `clientsApi.getAll()`
**Acções:** Pesquisar clientes, criar novo utilizador, navegar para perfil
**Mostra:** Lista de clientes com nome, email, data de nascimento

---

#### `/clients/[clientId]`
**Dados:** `clientsApi.getDetail()`, `statsApi.getClient()`, `programsApi.getByClient()`, e mais (lazy por tab)
**Tabs:**
- **Visão geral** — Stats do cliente (sessões, compliance), programas activos, KPIs
- **Planos** — Lista de programas, link para treinos de cada plano
- **Sessões** — Histórico e agendamento de sessões
- **Avaliações** — Histórico de avaliações físicas
- **Fotos** — Fotos de progresso (upload por ângulo)
- **Hábitos** — Hábitos atribuídos e taxa de adesão
- **Pagamentos** — Facturas e estado de pagamento
**Acções:** Criar prescrição, editar dados, upload de fotos, adicionar hábitos, criar facturas

---

#### `/prescription`
**Store:** `usePrescriptionStore` (Zustand)
**Fluxo multi-step:**

| Passo | Nome | Dados recolhidos |
|-------|------|-----------------|
| 0 | Selecção de cliente | clientId |
| 1 | Pessoal | nome, idade, sexo, profissão, lifestyle, PA, sintomas, factores de risco |
| 2 | Anamnese desportiva | objectivo, nível de actividade, histórico, disponibilidade, lesões, equipamento |
| 3 | Físico | antropometria, aptidão cardio (VO2max), força (1RM Squat, Bench), mobilidade, Karvonen |
| 4 | Selecção de exercícios | tabs por padrão de movimento, busca com SWR, selecção PREFERRED/REQUIRED |
| 5 | Revisão | resumo completo, badges de risco, zonas Karvonen → `assessmentsApi.create()` + `programsApi.generate()` |
| 6 | Plano gerado | Accordion com fases, tabelas FITT-VP por fase |

---

#### `/exercises`
**Dados:** `exercisesApi.getAll()` com filtros reactivos
**Layout:** Grelha 2-3 colunas + painel de detalhe lateral (desktop)
**Filtros:** Pesquisa por texto, nível, padrão de movimento
**Cards:** Imagem estática (frame 0), nome, nível, músculo principal
**Painel de detalhe:** Imagem animada (loop 0.jpg ↔ 1.jpg a cada 2s), músculos, notas clínicas, link verificado (fitnessprogramer.com ou YouTube)
**Acções:** Criar exercício, eliminar

---

#### `/workouts`
**Dados:** `workoutsApi.getByProgram(programId)` (acedida via `?programId=...`)
**Mostra:** Lista de treinos do programa com status, duração, número de blocos
**Acções:** Criar novo treino, editar, activar/desactivar, eliminar

---

#### `/workouts/editor` e `/workouts/editor/[id]`
**Store:** `useWorkoutEditorStore` (Zustand)
**Funcionalidades:**
- Adicionar/remover/reordenar blocos por drag-and-drop
- Tipos de bloco: WARMUP, SEQUENTIAL, SUPERSET, CIRCUIT, TABATA, CARDIO, FLEXIBILITY
- Configuração por tipo de bloco:
  - **TABATA:** workSeconds, restSeconds, rounds, tempo total calculado
  - **CARDIO:** método (6 opções), duração, zonas FC
  - **FLEXIBILITY/WARMUP:** stretchMethod, holdSeconds, contractionSeconds (PNF)
  - **Todos os outros:** restBetweenSets, restAfterBlock
- Por exercício: nome (com pesquisa), sets, reps, carga, %RM, RIR, tempo de execução, notas
- Preview de duração em tempo real (debounce 800ms → `POST /workouts/duration-preview`)
- Guardar como template
- Guardar treino → redirect para lista

---

#### `/templates`
**Dados:** `workoutTemplatesApi.getAll()`
**Mostra:** Templates públicos e privados com tags
**Acções:** Criar, visualizar, eliminar

---

#### `/schedule`
**Dados:** `sessionsApi.getAll()`
**Mostra:** Agenda de sessões com status por cores, filtros por tipo/estado

---

#### `/nutrition`
**Dados:** `nutritionApi.getPlansByClient()`, `nutritionApi.searchFoods()`
**Funcionalidades:** Criar planos, adicionar dias, adicionar refeições com alimentos da base de dados

---

#### `/invoices`
**Dados:** `invoicesApi.getAll()`
**Mostra:** Lista de facturas com estado, valores, datas de vencimento
**Acções:** Criar factura, marcar como paga, eliminar

---

#### `/messages`
**Realtime:** Socket.io via `getSocket(token)`
**Layout:** Lista de conversas (sidebar) + área de chat
**Funcionalidades:** Histórico de mensagens, envio em tempo real, marcação como lida

---

#### `/users/new`
**Acção:** Criar novo utilizador (admin ou cliente) via `authApi.createUser()`

---

### 5.2 Área do Cliente

**Layout:** `(client)/layout.tsx` — bottom tab bar fixa com 5 tabs

**Tab Bar:**
| Tab | Ícone | Rota |
|-----|-------|------|
| Início | ⬡ | `/client/dashboard` |
| Plano | ▦ | `/client/my-plan` |
| Exercícios | ◈ | `/client/exercises` |
| Dados | ◉ | `/client/stats` |
| Chat | ◷ | `/client/messages` |

---

#### `/client/dashboard`
**Dados:** `statsApi.getMy()`, `sessionsApi.getUpcoming(clientId)`
**Mostra:**
- Botão de acesso rápido ao plano de treino
- KPIs: treinos registados, streak actual
- Plano activo (nome do programa)
- Últimos treinos realizados (data, duração)
- Próximas sessões agendadas (tipo, data, hora, duração)

---

#### `/client/my-plan`
**Dados:** `workoutsApi.getMy()`
**Mostra:** Lista de treinos activos do cliente com duração estimada
**Acção:** Iniciar treino → navega para `/client/my-plan/log/[workoutId]`

---

#### `/client/my-plan/log/[workoutId]`
**Dados:** `workoutsApi.getById(workoutId)` — guardado no Dexie.js (IndexedDB) para offline
**Funcionalidades:**
- Visualizar todos os blocos e exercícios do treino
- Registar séries (peso, reps, RPE, concluída)
- Offline-first: regista em IndexedDB se sem ligação, sincroniza quando volta online
- Feedback háptico: `navigator.vibrate(50)` ao concluir série
- Submeter log → `workoutsApi.createLog()`

---

#### `/client/exercises`
**Dados:** `exercisesApi.getAll()` com filtros
**Layout:** Grelha 2 colunas com imagem estática no card
**Modal de detalhe:** Animação loop (todos os frames encontrados), músculos, link verificado (fitnessprogramer ou YouTube)

---

#### `/client/stats`
Hub de navegação para estatísticas pessoais:
- Recordes pessoais → `/client/my-records`
- Volume muscular → `/client/muscle-volume`
- Medidas corporais → `/client/body-measurements`
- Calendário → `/client/calendar`

---

#### `/client/my-records`
**Dados:** `personalRecordsApi.getMyBest()`
**Mostra:** Melhores registos por exercício (carga, reps, duração)

---

#### `/client/muscle-volume`
**Dados:** `workoutsApi.getMyMuscleVolume()`
**Mostra:** Distribuição de volume por grupo muscular nas últimas 4 semanas (gráfico + cards)

---

#### `/client/body-measurements`
**Dados:** `progressPhotosApi.getByClient(clientId)`
**Mostra:** Fotos de progresso organizadas por data e ângulo

---

#### `/client/calendar`
**Dados:** `workoutsApi.getMyCalendar()`
**Mostra:** Calendário mensal com dias de treino assinalados

---

#### `/client/exercise-history/[exerciseId]`
**Dados:** `workoutsApi.getMyExerciseHistory(exerciseId)`
**Mostra:** Evolução de carga/reps ao longo do tempo para um exercício específico

---

#### `/client/habits`
**Dados:** `habitsApi.getMy()`, `habitsApi.getMyAdherence()`
**Funcionalidades:**
- Lista de hábitos diários com toggle de conclusão
- Mapa de calor semanal (7 dias × N hábitos)
- Badge de taxa de adesão

---

#### `/client/my-nutrition`
**Dados:** `nutritionApi.getMyPlan()`
**Mostra:** Plano nutricional por dia da semana, macro resumo (kcal, proteína, hidratos, gordura), refeições com alimentos

---

#### `/client/messages`
**Realtime:** Socket.io
**Layout mobile-first:**
- Lista de conversas → toca → abre chat
- Botão "←" para voltar à lista
- Desktop: split-view (lista + chat)

---

#### `/client/profile`
**Dados:** `useAuthStore` (email, role)
**Acção:** Logout → limpa store + cookie → redirect para `/login`

---

### 5.3 Componentes Partilhados

#### `ExerciseImageLoop`
Componente de imagem com loop automático entre frames.

**Props:**
- `gifUrl: string` — URL do primeiro frame (`/0.jpg`)
- `alt: string` — Texto alternativo
- `loop?: boolean` — `false` = imagem estática, `true` = loop (default)
- `className?: string`

**Comportamento com `loop=true`:**
1. Tenta carregar `1.jpg`, `2.jpg`, ... até receber erro (max 10 frames)
2. Cicla pelos frames encontrados a cada 2 segundos
3. Cleanup automático do `setInterval` ao desmontar

---

#### `ExerciseLinkButton`
Botão inteligente que verifica se o exercício existe no fitnessprogramer.com.

**Props:**
- `name: string` — Nome do exercício (em inglês)
- `label?: string` — Texto personalizado do botão
- `className?: string`

**Comportamento:**
1. Chama `/api/check-exercise-url?url=https://fitnessprogramer.com/exercise/[slug]/`
2. A API Route faz `HEAD` request sem problemas de CORS
3. Resultado em cache (memória do servidor — não repete o mesmo URL)
4. Se existe → botão verde → fitnessprogramer.com
5. Se não existe → botão vermelho → YouTube search `"[nome] exercise tutorial"`

---

#### `AdminSidebar`
Sidebar colapsável do admin com navegação e logout.

**Itens de navegação:**
- Dashboard, Clientes, Agenda, Prescrição, Exercícios, Templates, Nutrição, Mensagens, Facturação

---

#### `ClientTabBar`
Bottom navigation bar do cliente (fixa no fundo do ecrã).

**Tabs:** Início, Plano, Exercícios, Dados, Chat

---

### 5.4 Stores Zustand

#### `authStore`
```typescript
{
  user: { id, email, role, name } | null,
  accessToken: string | null,
  setAuth: (user, token) => void,
  setToken: (token) => void,
  logout: () => void,
}
```
- Persistido em `localStorage` (key: `lavrador-auth`)
- Token também escrito em cookie `access_token` para o middleware Next.js

#### `workoutEditorStore`
```typescript
{
  workout: WorkoutDto | null,
  blocks: WorkoutBlock[],
  name: string,
  dayLabel: string,
  programId: string,
  clientId: string,
  isDirty: boolean,
  saving: boolean,
  durationPreview: number | null,
  error: string | null,
  // Actions:
  initNew, loadWorkout, setName, setDayLabel,
  addBlock, removeBlock, updateBlock, reorderBlocks,
  addExercise, removeExercise, updateExercise,
  setDurationPreview, setSaving, setError, markClean
}
```

#### `prescriptionStore`
```typescript
{
  currentStep: number,       // 0-6
  clientId: string,
  formData: Partial<AssessmentData>,
  selections: ExerciseSelection[],
  assessment: AssessmentDto | null,
  program: ProgramDto | null,
  loading: boolean,
  error: string | null,
  // Actions:
  setStep, nextStep, prevStep, setClientId,
  updateFormData, addSelection, replaceSelection, removeSelection,
  setAssessment, setProgram, setLoading, setError, reset
}
```

---

### 5.5 API Layer (Axios)

**Configuração base (`lib/api/axios.ts`):**
- `baseURL`: `NEXT_PUBLIC_API_URL` (default: `http://localhost:3333/api`)
- `withCredentials: true` (envia cookies)
- **Interceptor de request:** Adiciona `Authorization: Bearer <token>` de `authStore`
- **Interceptor de resposta 401:** Tenta refresh automático → re-executa request → se falhar, faz logout

---

### 5.6 API Routes Next.js

#### `GET /api/check-exercise-url?url=<url>`
Verifica se uma URL existe sem problemas de CORS.
- Faz `HEAD` request server-side
- Cache em Map (instância do servidor)
- Timeout: 4 segundos
- Retorna `{ exists: boolean }`

---

## 6. Tipos Partilhados — libs/types

Importados como `@libs/types` nos dois apps.

### Estrutura de `WorkoutBlock` (JSON em `Workout.blocks`)

```typescript
interface WorkoutBlock {
  id: string;
  type: 'WARMUP' | 'SEQUENTIAL' | 'SUPERSET' | 'CIRCUIT' | 'TABATA' | 'CARDIO' | 'FLEXIBILITY';
  order: number;
  label?: string;
  restBetweenSets?: number;    // segundos
  restAfterBlock?: number;     // segundos
  // TABATA
  tabata?: { workSeconds: number; restSeconds: number; rounds: number };
  // CARDIO
  cardioMethod?: string;
  cardioDurationMin?: number;
  // FLEXIBILITY
  stretchMethod?: string;
  holdSeconds?: number;
  contractionSeconds?: number; // PNF
  exercises: BlockExercise[];
  estimatedDurationMin?: number;
}

interface BlockExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: string;            // ex: "8-12" ou "AMRAP"
  load?: string;           // ex: "70kg"
  loadNote?: string;       // ex: "Aumentar se fácil"
  percentRM?: number;      // % de 1RM
  rir?: number;            // Reps in Reserve
  tempoExecution?: string; // ex: "2-0-2-1"
  restAfterSet?: number;   // segundos
  notes?: string;
}
```

### Estrutura de `WorkoutLogEntry` (JSON em `WorkoutLog.entries`)

```typescript
interface WorkoutLogEntry {
  blockId: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup?: string;    // Para muscle volume tracking
  sets: {
    setNumber: number;
    reps: number;
    load: number;          // kg
    rpe?: number;
    completed: boolean;
  }[];
}
```

---

## 7. Autenticação & Segurança

### Fluxo JWT

```
1. POST /auth/login
   → accessToken (1h) no body
   → refresh_token (7d) em httpOnly cookie

2. Frontend:
   → guarda accessToken em authStore + localStorage
   → escreve cookie access_token (para middleware Next.js)

3. Cada request:
   → Axios interceptor: Authorization: Bearer <accessToken>

4. 401 recebido:
   → Interceptor: POST /auth/refresh (com cookie)
   → Novo accessToken → actualiza store
   → Re-executa request original

5. Middleware Next.js:
   → Lê cookie access_token
   → Verifica role → redirige se necessário
```

### Guards NestJS

- `JwtGuard` — Valida Bearer token, extrai `{ sub: userId, email, role }`
- `RolesGuard` — Verifica `@Roles('ADMIN' | 'CLIENT')`
- `@CurrentUser('sub')` — Decorator para extrair userId do JWT

### Variáveis de Ambiente

```bash
# apps/api/.env
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/lavrador_team"
JWT_ACCESS_SECRET="..."
JWT_REFRESH_SECRET="..."
JWT_ACCESS_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"
NODE_ENV="development"
PORT=3333
CORS_ORIGIN="http://localhost:3000"
RAPIDAPI_KEY="..."         # ExerciseDB API (sync de GIFs)
RESEND_API_KEY="DISABLED"  # Email (Resend.com)

# apps/lavrador-platform/.env.local
NEXT_PUBLIC_API_URL="http://localhost:3333/api"
```

---

## 8. Comandos & Scripts

### Desenvolvimento

```bash
# Arrancar tudo
yarn dev

# Separado
yarn api       # NestJS na porta 3333
yarn platform  # Next.js na porta 3000
```

### Base de Dados

```bash
yarn db:migrate           # Criar/aplicar migrações
yarn db:seed              # Seed: admin@lavrador.pt / Admin123!
                          #       andre.amaro@email.com / Cliente123!
yarn db:studio            # Prisma Studio (UI da BD)
yarn db:generate          # Regenerar Prisma Client
yarn db:import-exercisedb # Importar 873 exercícios (free-exercise-db)
yarn db:sync-exercisedb-gifs  # Sincronizar GIFs (requer RAPIDAPI_KEY)
```

### Build & Lint

```bash
yarn build:api      # Build NestJS
yarn build:platform # Build Next.js
yarn lint           # ESLint em todos os projetos
yarn test           # Jest em todos os projetos
```

---

*Documento gerado automaticamente a partir da análise do código-fonte. Para actualizações contactar o repositório principal.*
