<p align="center">
  <img src="docs/screenshots/logo.svg" alt="CampusMind Logo" width="120" height="120">
</p>

<h1 align="center">CampusMind</h1>

<p align="center">
  <strong>Copiloto Academico Integral para Universitarios</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#api-documentation">API Docs</a> •
  <a href="#deployment">Deployment</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/NestJS-10-e0234e?style=flat-square&logo=nestjs" alt="NestJS">
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178c6?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/PostgreSQL-pgvector-336791?style=flat-square&logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat-square&logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat-square&logo=tailwindcss" alt="TailwindCSS">
</p>

---

## Overview

**CampusMind** es una plataforma SaaS de estudio potenciada por IA, disenada especificamente para estudiantes universitarios de habla hispana. Combina herramientas de gestion academica con capacidades avanzadas de inteligencia artificial para crear una experiencia de aprendizaje personalizada y efectiva.

### Vision

Transformar la manera en que los universitarios estudian, organizan su tiempo y preparan sus examenes, utilizando tecnologia de vanguardia para maximizar su rendimiento academico.

---

## Features

### Core Features (Implementados)

#### Authentication & User Management
- Registro y login con email/password
- Autenticacion JWT con refresh tokens
- Recuperacion de password por email
- Autenticacion de dos factores (2FA) con TOTP
- Login social (Google, GitHub)
- Gestion de perfil de usuario

#### Subjects (Materias/Workspaces)
- CRUD completo de materias
- Organizacion por carrera, ano y semestre
- Sistema de colores personalizables
- Archivado de materias inactivas
- Estadisticas por materia

#### Flashcards & Spaced Repetition
- Creacion de mazos y tarjetas
- Algoritmo SM-2 de repeticion espaciada
- Seguimiento de progreso de estudio
- Tarjetas pendientes de revision
- Estadisticas de rendimiento

#### Quizzes & Evaluaciones
- Creacion de quizzes personalizados
- Multiples tipos de preguntas (opcion multiple, V/F, respuesta corta)
- Sistema de puntuacion automatico
- Historial de intentos
- Estadisticas de rendimiento

#### Calendar & Study Planning
- Eventos de estudio personalizados
- Tipos de eventos (sesion de estudio, examen, deadline, clase)
- Vista por dia, semana y mes
- Recordatorios configurables
- Recurrencia de eventos

#### Academic Library
- Biblioteca de recursos academicos
- Busqueda por carrera y categoria
- Importacion de recursos externos
- Notas sobre recursos
- Sistema de recomendaciones

#### RAG/AI Module (Retrieval-Augmented Generation)
- Chat con documentos usando IA
- Soporte multi-proveedor (OpenAI, Gemini, Groq)
- Embeddings con pgvector
- Generacion automatica de flashcards desde contenido
- Generacion de quizzes desde material de estudio
- Resumenes inteligentes

#### Billing & Subscriptions
- Planes: Free, Pro, Premium
- Integracion con MercadoPago (Argentina/LATAM)
- Integracion con Lemon Squeezy (Internacional)
- Control de uso por plan
- Portal de gestion de suscripcion

#### Notifications
- Notificaciones push (Web Push API)
- Notificaciones por email
- Preferencias configurables por usuario
- Recordatorios de estudio

### Additional Features

| Feature | Status | Description |
|---------|--------|-------------|
| Dashboard | Implementado | Vista general con estadisticas y actividad reciente |
| Pomodoro Timer | Implementado | Temporizador para sesiones de estudio |
| Mind Maps | UI Ready | Mapas mentales interactivos |
| Study Groups | UI Ready | Grupos de estudio colaborativos |
| Leaderboard | UI Ready | Sistema de gamificacion |
| Achievements | UI Ready | Logros y badges |
| Progress Tracking | Implementado | Seguimiento de progreso de aprendizaje |
| Notes | UI Ready | Sistema de notas con markdown |
| Dark Mode | Implementado | Tema oscuro/claro |
| PWA | Implementado | Instalable como app nativa |
| i18n | Preparado | Soporte para multiples idiomas |

---

## Tech Stack

### Frontend (`apps/web`)

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | React Framework with App Router |
| React | 19.x | UI Library |
| TypeScript | 5.9 | Type Safety |
| TailwindCSS | 3.4 | Utility-first CSS |
| Zustand | 5.x | State Management |
| React Query | 5.x | Server State Management |
| Lucide React | 0.468 | Icon Library |
| Zod | 3.x | Schema Validation |

### Backend (`apps/api`)

| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS | 10.x | Node.js Framework |
| Prisma | 5.22 | ORM & Database Toolkit |
| PostgreSQL | 15+ | Database with pgvector |
| Passport | 0.7 | Authentication |
| JWT | - | Token-based Auth |
| bcrypt | 5.x | Password Hashing |
| class-validator | 0.14 | Input Validation |

### AI & ML

| Technology | Purpose |
|------------|---------|
| OpenAI GPT-4o-mini | Primary LLM |
| Google Gemini 1.5 Flash | Free tier LLM |
| Groq (Llama 3.3 70B) | Fast inference LLM |
| pgvector | Vector embeddings storage |
| text-embedding-3-small | OpenAI embeddings |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| pnpm | Package Manager |
| Turborepo | Monorepo Build System |
| Neon | Serverless PostgreSQL |
| Docker | Containerization |
| Husky | Git Hooks |
| ESLint + Prettier | Code Quality |

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CAMPUSMIND SYSTEM                               │
└─────────────────────────────────────────────────────────────────────────────┘

                                   ┌─────────────┐
                                   │   Client    │
                                   │  (Browser)  │
                                   └──────┬──────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
                    ▼                     ▼                     ▼
           ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
           │   Vercel CDN   │    │  Next.js SSR   │    │   API Gateway  │
           │  Static Assets │    │  (Frontend)    │    │   (NestJS)     │
           └────────────────┘    └───────┬────────┘    └───────┬────────┘
                                         │                     │
                                         │              ┌──────┴──────┐
                                         │              │             │
                                         ▼              ▼             ▼
                                 ┌──────────────┐ ┌──────────┐ ┌──────────────┐
                                 │   Zustand    │ │  Guards  │ │   Modules    │
                                 │   Stores     │ │  & Auth  │ │  (Services)  │
                                 └──────────────┘ └──────────┘ └──────┬───────┘
                                                                      │
                         ┌────────────────────────────────────────────┼────────┐
                         │                        │                   │        │
                         ▼                        ▼                   ▼        ▼
                  ┌─────────────┐          ┌─────────────┐     ┌──────────┐ ┌─────┐
                  │   Prisma    │          │   OpenAI    │     │  Redis   │ │ S3  │
                  │   (ORM)     │          │  Gemini     │     │  Cache   │ │     │
                  └──────┬──────┘          │  Groq       │     └──────────┘ └─────┘
                         │                 └─────────────┘
                         ▼
                  ┌─────────────┐
                  │  PostgreSQL │
                  │  + pgvector │
                  │   (Neon)    │
                  └─────────────┘
```

### Project Structure

```
campusmind/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/       # Authentication & 2FA
│   │   │   │   ├── subjects/   # Subjects/Workspaces
│   │   │   │   ├── resources/  # Academic Resources
│   │   │   │   ├── flashcards/ # Flashcards & SM-2
│   │   │   │   ├── quizzes/    # Quizzes & Exams
│   │   │   │   ├── calendar/   # Study Calendar
│   │   │   │   ├── rag/        # AI/RAG Module
│   │   │   │   ├── billing/    # Subscriptions & Limits
│   │   │   │   ├── notifications/
│   │   │   │   └── academic/   # Library & Search
│   │   │   ├── common/         # Guards, Decorators, Pipes
│   │   │   ├── database/       # Prisma Service
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Database Schema
│   │   └── test/               # E2E Tests
│   │
│   └── web/                    # Next.js Frontend
│       └── src/
│           ├── app/
│           │   ├── (auth)/     # Auth pages
│           │   ├── app/        # Protected app pages
│           │   └── (marketing)/ # Landing pages
│           ├── components/
│           │   ├── ui/         # Base UI components
│           │   ├── features/   # Feature components
│           │   └── layout/     # Layout components
│           ├── lib/            # Utilities & API client
│           └── stores/         # Zustand stores
│
├── e2e/                        # Playwright E2E Tests
├── .github/workflows/          # CI/CD Pipeline
└── docker-compose.yml          # Local Development
```

### Plan-Based Usage Limits System

El sistema implementa limites de uso basados en el plan de suscripcion del usuario:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USAGE LIMITS ARCHITECTURE                            │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
    │    FREE     │        │     PRO     │        │   PREMIUM   │
    ├─────────────┤        ├─────────────┤        ├─────────────┤
    │ 3 Materias  │        │ 10 Materias │        │ Ilimitado   │
    │ 20 Recursos │        │ 100 Recursos│        │ Ilimitado   │
    │ 50 Queries  │        │ 500 Queries │        │ Ilimitado   │
    │ 5 Docs/mes  │        │ 50 Docs/mes │        │ Ilimitado   │
    │ 100 Flash   │        │ 1000 Flash  │        │ Ilimitado   │
    │ 10 Quizzes  │        │ 100 Quizzes │        │ Ilimitado   │
    └──────┬──────┘        └──────┬──────┘        └──────┬──────┘
           │                      │                      │
           └──────────────────────┼──────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │     UsageLimitsService      │
                    ├─────────────────────────────┤
                    │ • getUserPlan()             │
                    │ • enforceUsageLimit()       │
                    │ • getCurrentUsage()         │
                    │ • incrementUsage()          │
                    │ • checkFeatureAccess()      │
                    └──────────────┬──────────────┘
                                   │
           ┌───────────────────────┼───────────────────────┐
           │                       │                       │
           ▼                       ▼                       ▼
    ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
    │  Subjects   │        │     RAG     │        │ Flashcards  │
    │  Service    │        │   Service   │        │   Service   │
    └─────────────┘        └─────────────┘        └─────────────┘

Flujo de verificacion:
1. Usuario hace request → Controller
2. Controller llama a Service
3. Service llama a UsageLimitsService.enforceUsageLimit()
4. UsageLimitsService consulta plan del usuario (Subscription table)
5. Compara uso actual vs limite del plan
6. Si excede: lanza ForbiddenException
7. Si OK: continua operacion e incrementa contador
```

### Billing & Subscription Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUBSCRIPTION LIFECYCLE                               │
└─────────────────────────────────────────────────────────────────────────────┘

  Usuario                    Frontend                 Backend              Payment Provider
     │                          │                        │                        │
     │  Selecciona Plan PRO     │                        │                        │
     ├─────────────────────────>│                        │                        │
     │                          │  POST /billing/checkout│                        │
     │                          ├───────────────────────>│                        │
     │                          │                        │  Create Preference     │
     │                          │                        ├───────────────────────>│
     │                          │                        │<───────────────────────┤
     │                          │  { checkoutUrl }       │                        │
     │                          │<───────────────────────┤                        │
     │  Redirect to Checkout    │                        │                        │
     │<─────────────────────────┤                        │                        │
     │                          │                        │                        │
     │  ════════════════════════════════════════════════════════════════════════ │
     │                          PAGO EXITOSO                                      │
     │  ════════════════════════════════════════════════════════════════════════ │
     │                          │                        │                        │
     │                          │                        │  Webhook: payment.success
     │                          │                        │<───────────────────────┤
     │                          │                        │                        │
     │                          │                        │  ┌──────────────────┐  │
     │                          │                        │  │ Update User:     │  │
     │                          │                        │  │ plan = PRO       │  │
     │                          │                        │  │ status = ACTIVE  │  │
     │                          │                        │  └──────────────────┘  │
     │                          │                        │                        │
     │  Redirect Success        │                        │                        │
     │<─────────────────────────┤                        │                        │
     │                          │                        │                        │
     │  GET /billing/subscription                        │                        │
     ├─────────────────────────────────────────────────->│                        │
     │                          │                        │                        │
     │  { plan: 'PRO', status: 'ACTIVE', limits: {...} } │                        │
     │<──────────────────────────────────────────────────┤                        │
```

### RAG (Retrieval-Augmented Generation) Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              RAG PIPELINE                                    │
└─────────────────────────────────────────────────────────────────────────────┘

                          INDEXING (Ingestion)
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  Document ──► ChunkingService ──► EmbeddingService ──► VectorStoreService   │
│     │              │                    │                     │              │
│     │              ▼                    ▼                     ▼              │
│     │        ┌──────────┐        ┌──────────┐          ┌──────────┐         │
│     │        │ Chunks   │        │ Vectors  │          │ pgvector │         │
│     │        │ 512 tok  │        │ 1536 dim │          │  Store   │         │
│     │        └──────────┘        └──────────┘          └──────────┘         │
│     │                                                                        │
│     └──────── Resource.isIndexed = true ────────────────────────────────────│
└─────────────────────────────────────────────────────────────────────────────┘

                            QUERYING
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  Query ──► EmbeddingService ──► VectorStoreService ──► LlmService           │
│    │             │                     │                    │                │
│    │             ▼                     ▼                    ▼                │
│    │       ┌──────────┐         ┌───────────┐        ┌───────────┐          │
│    │       │  Query   │         │ Top-K     │        │  GPT-4    │          │
│    │       │ Embedding│         │ Similar   │        │  Gemini   │          │
│    │       └──────────┘         │ Chunks    │        │  Groq     │          │
│    │                            └───────────┘        └─────┬─────┘          │
│    │                                                       │                 │
│    └─────────────────── Response + Citations ◄─────────────┘                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GITHUB ACTIONS CI/CD                                │
└─────────────────────────────────────────────────────────────────────────────┘

  Push/PR to main
       │
       ▼
  ┌─────────┐    ┌─────────────┐    ┌─────────┐
  │  Lint   │───>│  TypeCheck  │───>│  Build  │
  └─────────┘    └─────────────┘    └────┬────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
             ┌───────────┐        ┌───────────┐        ┌───────────┐
             │   Test    │        │  E2E Test │        │  Security │
             │  (Jest)   │        │(Playwright)│       │   Audit   │
             └───────────┘        └───────────┘        └───────────┘
                    │                    │                    │
                    └────────────────────┼────────────────────┘
                                         │
                                         ▼
                                 ┌───────────────┐
                                 │    Deploy     │
                                 │ (On Success)  │
                                 └───────────────┘
```

### Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SECURITY LAYERS                                     │
└─────────────────────────────────────────────────────────────────────────────┘

  Request ──► Rate Limiting ──► JWT Validation ──► 2FA Check ──► Guards
     │              │                 │                │            │
     │              ▼                 ▼                ▼            ▼
     │        ┌──────────┐      ┌──────────┐    ┌──────────┐  ┌──────────┐
     │        │ Throttle │      │  Passport │    │   TOTP   │  │ Resource │
     │        │ Guard    │      │    JWT    │    │  Verify  │  │  Owner   │
     │        │ 100/min  │      │           │    │          │  │  Check   │
     │        └──────────┘      └──────────┘    └──────────┘  └──────────┘
     │
     └──────────────────────────────────────────────────────────────────────►
                                                                   Controller

  Additional Security:
  • Password hashing: bcrypt (12 rounds)
  • Webhook signature verification (HMAC)
  • CORS configuration
  • Helmet.js security headers
  • Input validation (class-validator)
  • SQL injection prevention (Prisma)
```

### Database Schema

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      User       │────<│     Subject     │────<│    Resource     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │     │ id              │
│ email           │     │ name            │     │ title           │
│ password        │     │ description     │     │ type            │
│ profile         │     │ career          │     │ chunks[]        │
│ subscription    │     │ color           │     │ isIndexed       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ FlashcardDeck   │     │      Quiz       │     │ ResourceChunk   │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ flashcards[]    │     │ questions[]     │     │ content         │
│ progress        │     │ attempts[]      │     │ embedding       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  Subscription   │     │  CalendarEvent  │
├─────────────────┤     ├─────────────────┤
│ plan (FREE/PRO/ │     │ title           │
│       PREMIUM)  │     │ type            │
│ status          │     │ startDate       │
│ provider        │     │ recurrence      │
│ externalId      │     │ reminders       │
└─────────────────┘     └─────────────────┘
```

### Module Dependencies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MODULE DEPENDENCY GRAPH                             │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │   AppModule  │
                              └──────┬───────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
  ┌─────────────┐            ┌─────────────┐            ┌─────────────┐
  │ AuthModule  │            │BillingModule│            │  RagModule  │
  └──────┬──────┘            └──────┬──────┘            └──────┬──────┘
         │                          │                          │
         │                          ▼                          │
         │                 ┌────────────────┐                  │
         │                 │UsageLimitsServ │◄─────────────────┤
         │                 └────────┬───────┘                  │
         │                          │                          │
         ▼                          ▼                          ▼
  ┌─────────────┐            ┌─────────────┐            ┌─────────────┐
  │SubjectsModule│◄──────────│ResourcesModule│◄─────────│FlashcardsModule│
  └─────────────┘            └─────────────┘            └─────────────┘
         │                          │                          │
         └──────────────────────────┼──────────────────────────┘
                                    │
                                    ▼
                            ┌─────────────┐
                            │DatabaseModule│
                            │  (Prisma)   │
                            └─────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- PostgreSQL 15+ with pgvector extension
- (Optional) Docker & Docker Compose

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/campusmind.git
cd campusmind

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Configure your .env file with:
# - DATABASE_URL (Neon PostgreSQL recommended)
# - JWT_SECRET
# - API keys for LLM providers
```

### Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# (Optional) Run migrations
pnpm db:migrate
```

### Development

```bash
# Start both frontend and backend
pnpm dev

# Or start individually
pnpm --filter api dev     # Backend on http://localhost:3001
pnpm --filter web dev     # Frontend on http://localhost:3000
```

### Docker Development

```bash
# Start all services
pnpm docker:up

# View logs
pnpm docker:logs

# Stop services
pnpm docker:down
```

---

## API Documentation

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/register` | POST | Register new user |
| `/api/v1/auth/login` | POST | Login user |
| `/api/v1/auth/me` | GET | Get current user |
| `/api/v1/auth/refresh` | POST | Refresh token |
| `/api/v1/auth/forgot-password` | POST | Request password reset |
| `/api/v1/auth/reset-password` | POST | Reset password |
| `/api/v1/auth/2fa/setup` | POST | Setup 2FA |
| `/api/v1/auth/2fa/enable` | POST | Enable 2FA |
| `/api/v1/auth/2fa/verify` | POST | Verify 2FA code |

### Subjects

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/subjects` | GET | List subjects |
| `/api/v1/subjects` | POST | Create subject |
| `/api/v1/subjects/:id` | GET | Get subject |
| `/api/v1/subjects/:id` | PATCH | Update subject |
| `/api/v1/subjects/:id` | DELETE | Delete subject |
| `/api/v1/subjects/:id/archive` | PATCH | Archive subject |

### Flashcards

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/flashcards/decks` | GET | List decks |
| `/api/v1/flashcards/decks` | POST | Create deck |
| `/api/v1/flashcards/cards` | POST | Create card |
| `/api/v1/flashcards/cards/:id/review` | POST | Review card (SM-2) |
| `/api/v1/flashcards/due` | GET | Get due cards |

### Quizzes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/quizzes` | GET | List quizzes |
| `/api/v1/quizzes` | POST | Create quiz |
| `/api/v1/quizzes/:id/questions` | POST | Add question |
| `/api/v1/quizzes/:id/submit` | POST | Submit answers |
| `/api/v1/quizzes/:id/attempts` | GET | Get attempts |

### RAG/AI

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/rag/query` | POST | Query documents with AI |
| `/api/v1/rag/ingest/:resourceId` | POST | Index resource |
| `/api/v1/rag/generate/flashcards` | POST | Generate flashcards |
| `/api/v1/rag/generate/quiz` | POST | Generate quiz |
| `/api/v1/rag/providers` | GET | List LLM providers |

### Calendar

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/calendar/events` | GET | List events |
| `/api/v1/calendar/events` | POST | Create event |
| `/api/v1/calendar/events/today` | GET | Today's events |
| `/api/v1/calendar/events/week` | GET | This week's events |

### Billing

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/billing/plans` | GET | List available plans |
| `/api/v1/billing/subscription` | GET | Get current subscription |
| `/api/v1/billing/checkout` | POST | Create checkout session |
| `/api/v1/billing/usage` | GET | Get usage stats |

---

## Environment Variables

```env
# Database (Neon PostgreSQL recommended)
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=7d

# API Configuration
API_PORT=3001
API_PREFIX=api/v1

# LLM Providers (at least one required)
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
GROQ_API_KEY=gsk_...

# Billing (optional)
MERCADOPAGO_ACCESS_TOKEN=...
LEMONSQUEEZY_API_KEY=...

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Deployment

### Recommended Stack

| Service | Provider | Purpose |
|---------|----------|---------|
| Database | Neon | Serverless PostgreSQL with pgvector |
| Backend | Railway / Render | NestJS API |
| Frontend | Vercel | Next.js App |
| LLM | OpenAI / Gemini / Groq | AI capabilities |
| Payments | MercadoPago / LemonSqueezy | Billing |

### Production Build

```bash
# Build all apps
pnpm build

# Build specific app
pnpm --filter api build
pnpm --filter web build
```

---

## Testing

```bash
# Run all tests
pnpm test

# Run API tests
pnpm --filter api test

# Run E2E tests
pnpm test:e2e

# Type checking
pnpm typecheck
```

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

---

## License

This project is proprietary software. All rights reserved.

---

## Roadmap

### Phase 1 - MVP (Current)
- [x] Authentication & User Management
- [x] Subjects/Workspaces CRUD
- [x] Flashcards with Spaced Repetition
- [x] Quizzes & Evaluations
- [x] Calendar & Study Planning
- [x] RAG/AI Chat with Documents
- [x] Billing & Subscriptions
- [x] Notifications System

### Phase 2 - Enhanced Features
- [ ] Collaborative Study Groups
- [ ] Mind Maps Editor
- [ ] Audio Podcasts Generation
- [ ] Advanced Analytics Dashboard
- [ ] Mobile App (React Native)

### Phase 3 - Scale
- [ ] Multi-tenant Architecture
- [ ] Institution Accounts
- [ ] LTI Integration (Moodle, Canvas)
- [ ] API for Third-party Integrations

---

## Screenshots

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)
*Vista principal con estadisticas, materias activas y actividad reciente*

### Flashcards
![Flashcards](docs/screenshots/flashcards.png)
*Sistema de flashcards con repeticion espaciada*

### AI Copilot
![Copilot](docs/screenshots/copilot.png)
*Chat con IA para consultas sobre material de estudio*

### Calendar
![Calendar](docs/screenshots/calendar.png)
*Calendario de estudio con eventos y recordatorios*

---

<p align="center">
  Made with ❤️ by the CampusMind Team
</p>

<p align="center">
  <a href="https://campusmind.io">Website</a> •
  <a href="https://docs.campusmind.io">Documentation</a> •
  <a href="https://twitter.com/campusmind">Twitter</a>
</p>
