# Lavrador Team — PT Manager

Monorepo NX 21 · NestJS + React · PostgreSQL/PostGIS + Prisma

---

## Stack

| Camada        | Tecnologia                                              |
| ------------- | ------------------------------------------------------- |
| Backend       | NestJS 10 + Prisma 5 + PassportJWT                      |
| Frontend      | React 18 + Redux Toolkit + Styled Components + Recharts |
| Base de dados | PostgreSQL 17 / PostGIS 3.5                             |
| Monorepo      | NX 21 + Yarn workspaces                                 |
| Dev           | Docker Compose + pgAdmin                                |

---

## Arranque local

### 1. Variáveis de ambiente

```bash
cp .env.example .env
# Editar JWT_ACCESS_SECRET e JWT_REFRESH_SECRET (mínimo 32 caracteres)
```

### 2. Docker (base de dados + pgAdmin + API)

```bash
docker compose -f docker-compose.dev.yml up -d
```

| Serviço | URL                              |
| ------- | -------------------------------- |
| API     | http://localhost:3333/api        |
| Health  | http://localhost:3333/api/health |
| pgAdmin | http://localhost:5557            |

pgAdmin login: `admin@lavrador.pt` / `lavrador`

### 3. Instalar dependências

```bash
yarn install
```

### 4. Migrations + Seed

```bash
# Dentro do container (se a API corre em Docker):
docker exec lavrador_api yarn db:migrate
docker exec lavrador_api yarn db:seed

# Ou localmente (se a API corre em host):
yarn db:migrate
yarn db:seed
```

Credenciais do admin inicial:

- Email: `admin@lavrador.pt`
- Password: `Admin123!` ← **alterar após primeiro login**

### 5. Frontend (local, fora do Docker)

```bash
yarn web   # http://localhost:4501
```

---

## Estrutura do monorepo

```
lavrador-team/
├── apps/
│   ├── api/                    # NestJS
│   │   ├── docker-utils/
│   │   │   └── Dockerfile.dev
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts
│   │   │   └── exercises-seed-data.ts
│   │   ├── project.json        # NX targets
│   │   ├── webpack.config.js
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── common/         # guards, decorators
│   │       └── modules/
│   │           ├── auth/
│   │           ├── users/
│   │           ├── exercises/
│   │           ├── assessments/
│   │           ├── programs/
│   │           ├── sessions/
│   │           ├── stats/
│   │           └── prisma/
│   └── web/                    # React + Vite
│       ├── project.json        # NX targets
│       └── src/app/
│           ├── store/          # Redux slices
│           ├── pages/          # por página
│           ├── components/     # partilhados
│           ├── hooks/          # custom hooks
│           └── utils/api/      # REST calls
├── docker/
│   ├── db/data/                # volume postgres (gitignored)
│   └── pgadmin/lib/            # volume pgadmin (gitignored)
├── libs/
│   └── types/                  # DTOs e interfaces partilhadas
├── docker-compose.dev.yml
├── package.json                # root — todas as deps aqui
├── nx.json
└── tsconfig.base.json
```

---

## Endpoints da API

### Auth

| Método | Path               | Descrição                          |
| ------ | ------------------ | ---------------------------------- |
| POST   | /api/auth/login    | Login                              |
| POST   | /api/auth/register | Criar cliente (admin only em prod) |
| POST   | /api/auth/refresh  | Renovar access token (via cookie)  |
| POST   | /api/auth/logout   | Terminar sessão                    |

### Users / Clients

| Método | Path                          | Descrição                   |
| ------ | ----------------------------- | --------------------------- |
| GET    | /api/users/me                 | Perfil próprio              |
| PATCH  | /api/users/me                 | Atualizar perfil            |
| GET    | /api/users                    | Listar clientes (ADMIN)     |
| GET    | /api/users/clients/:id/detail | Detalhe completo do cliente |

### Exercises

| Método | Path               | Descrição           |
| ------ | ------------------ | ------------------- |
| GET    | /api/exercises     | Listar com filtros  |
| GET    | /api/exercises/:id | Detalhe             |
| POST   | /api/exercises     | Criar (ADMIN)       |
| PATCH  | /api/exercises/:id | Editar (ADMIN)      |
| DELETE | /api/exercises/:id | Soft delete (ADMIN) |

### Assessments

| Método | Path                        | Descrição               |
| ------ | --------------------------- | ----------------------- |
| POST   | /api/assessments            | Criar avaliação         |
| GET    | /api/assessments/client/:id | Histórico de avaliações |
| GET    | /api/assessments/:id        | Detalhe                 |

### Programs

| Método | Path                        | Descrição            |
| ------ | --------------------------- | -------------------- |
| POST   | /api/programs/generate      | Gerar plano (80/20)  |
| GET    | /api/programs/client/:id    | Planos de um cliente |
| GET    | /api/programs/:id           | Detalhe              |
| PATCH  | /api/programs/:id/exercises | Atualizar seleção    |
| PATCH  | /api/programs/:id/archive   | Arquivar             |
| GET    | /api/programs/:id/export    | Export JSON          |

### Sessions

| Método | Path                              | Descrição          |
| ------ | --------------------------------- | ------------------ |
| POST   | /api/sessions                     | Criar sessão       |
| GET    | /api/sessions                     | Listar com filtros |
| GET    | /api/sessions/:id                 | Detalhe            |
| PATCH  | /api/sessions/:id                 | Atualizar          |
| DELETE | /api/sessions/:id                 | Eliminar           |
| GET    | /api/sessions/client/:id/upcoming | Próximas sessões   |
| GET    | /api/sessions/client/:id/stats    | Stats por estado   |

### Stats

| Método | Path                        | Descrição               |
| ------ | --------------------------- | ----------------------- |
| GET    | /api/stats/dashboard        | KPIs globais do PT      |
| GET    | /api/stats/client/:id       | Progresso do cliente    |
| GET    | /api/stats/sessions         | Distribuição de sessões |
| GET    | /api/stats/clients/activity | Actividade recente      |

---

## Deploy Railway

1. Criar projecto Railway
2. Adicionar serviço PostgreSQL → copiar `DATABASE_URL`
3. Serviço API: root dir `/`, build command `yarn build:api`, start `node dist/apps/api/main.js`
4. Variáveis: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`, `NODE_ENV=production`
5. Serviço Web: root dir `/`, build `yarn build:web`, serve `dist/apps/web/`
