# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

### Backend (Node.js/Express)
```bash
cd backend
npm run dev           # Dev server with hot reload (tsx watch)
npm run build         # Compile TypeScript
npm run start         # Run compiled JS from dist/
npm test              # Run all tests (Jest)
npm run test:unit     # Unit tests only
npm run test:integration  # Integration tests only
npm run lint          # ESLint
npm run typecheck     # Type-check without emitting
```

### Frontend (React/Vite)
```bash
cd frontend
npm run dev           # Dev server at http://localhost:5173
npm run build         # TypeScript check + Vite production build
npm run preview       # Preview production build
npm run lint          # ESLint
```

### Infrastructure
```bash
docker compose -f backend/docker/docker-compose.yml up -d    # Start MongoDB + Redis
docker compose -f backend/docker/docker-compose.yml down     # Stop containers
```

## Architecture Overview

### Multi-Tenant Design
- Each tenant has a unique `tenantId` (UUID) and `slug` (URL-friendly name)
- Users belong to a single tenant with roles: `owner`, `admin`, `member`
- All data queries are scoped by `tenantId` for isolation

### Backend Structure (`backend/src/`)

```
src/
├── api/              # HTTP layer (routes, middleware, validators)
├── modules/          # Domain modules (auth, task, project, tenant, user, notification)
│   └── {module}/
│       ├── *.controller.ts   # Request handlers
│       ├── *.service.ts      # Business logic
│       ├── *.repository.ts   # Data access
│       ├── *.model.ts        # Mongoose schema
│       └── *.validator.ts    # Zod schemas
├── core/             # Cross-cutting concerns
│   ├── events/EventBus.ts    # Typed pub/sub (singleton)
│   ├── errors/AppError.ts    # Custom error classes
│   └── utils/                # Shared utilities
├── infrastructure/   # External services
│   ├── database/mongodb/     # MongoDB client + base model
│   ├── redis/                # Cache + streams
│   ├── queue/                # BullMQ workers + processors
│   └── websocket/            # Socket.io server
└── config/           # Environment config (Zod-validated)
```

**Key patterns:**
- **EventBus**: Typed singleton for domain events (`task.created`, `user.invited`, etc.)
- **Path aliases**: Use `@core/*`, `@modules/*`, `@infrastructure/*`, `@api/*` in imports
- **Startup order** (`server.ts`): MongoDB → Redis → Event listeners → Workers → Express → WebSocket

### Frontend Structure (`frontend/src/`)

```
src/
├── app/              # App shell, router, providers
├── features/         # Feature modules (auth, tasks, projects, users, settings)
│   └── {feature}/
│       ├── components/       # Feature-specific UI
│       ├── hooks/            # React Query hooks (useTask, useTaskMutations)
│       ├── services/         # API client functions
│       ├── stores/           # Zustand stores
│       ├── validators/       # Zod schemas (shared with forms)
│       └── types/            # TypeScript interfaces
├── pages/            # Route pages (thin wrappers)
├── layouts/          # AppLayout, AuthLayout
└── shared/           # Cross-feature code
    ├── components/   # Reusable UI (Toast, ConfirmDialog, etc.)
    ├── lib/          # axios instance, socket client, utils
    └── types/        # Shared type definitions
```

**Key patterns:**
- **Path alias**: `@/*` maps to `src/*`
- **State**: Zustand for global state (auth), React Query for server state
- **Forms**: react-hook-form + Zod resolvers
- **Real-time**: Socket.io context + `useTaskRealtime` hook for live updates

## Authentication Flow

1. Register creates tenant + owner user atomically
2. Login returns JWT access token (15m) + refresh token (7d, stored in Redis)
3. Refresh tokens are single-use with rotation (reuse triggers invalidation)
4. Auth state persisted in Zustand with localStorage

## API Conventions

- All routes prefixed with `/api/v1/`
- Protected routes require `Authorization: Bearer <token>` header
- Response format: `{ success: boolean, data?: T, error?: { code, message } }`
- Pagination uses cursor-based approach

## Environment Variables

Backend requires: `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
Frontend requires: `VITE_API_URL`, `VITE_WS_URL`

Copy `.env.example` files in both directories before starting.
