# CampusMind - Development Guide

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
- PostgreSQL 16 (via Docker)

### Setup

```bash
# Clone the repository
git clone https://github.com/Rene-Kuhm/CampusMind-sass.git
cd CampusMind-sass

# Install dependencies
pnpm install

# Start services (PostgreSQL, Redis)
docker-compose up -d

# Setup database
pnpm db:push

# Start development
pnpm dev
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL=postgresql://campusmind:campusmind_dev@localhost:5432/campusmind_db

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=7d

# API
API_PORT=3001
API_PREFIX=api/v1

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key

# LLM (choose one or more)
LLM_PROVIDER=groq
GROQ_API_KEY=your-groq-api-key
OPENAI_API_KEY=your-openai-api-key
GOOGLE_AI_API_KEY=your-gemini-api-key

# Vector Database
VECTOR_DB_PROVIDER=pgvector  # or 'qdrant'
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

# Redis (optional)
REDIS_ENABLED=false
REDIS_URL=redis://localhost:6379

# Email
EMAIL_PROVIDER=smtp
EMAIL_FROM=noreply@campusmind.com
SENDGRID_API_KEY=
RESEND_API_KEY=

# Billing
MERCADOPAGO_ACCESS_TOKEN=
LEMONSQUEEZY_API_KEY=
```

## Project Structure

```
CampusMind-sass/
├── apps/
│   ├── api/                 # NestJS Backend
│   │   ├── src/
│   │   │   ├── common/      # Shared utilities (guards, decorators, redis)
│   │   │   ├── database/    # Prisma configuration
│   │   │   └── modules/     # Feature modules
│   │   │       ├── auth/        # Authentication (JWT, OAuth, 2FA)
│   │   │       ├── billing/     # Subscriptions (MercadoPago, LemonSqueezy)
│   │   │       ├── calendar/    # Study events
│   │   │       ├── flashcards/  # Spaced repetition (SM-2)
│   │   │       ├── notifications/ # Email & Push
│   │   │       ├── quizzes/     # Quiz system with LLM evaluation
│   │   │       ├── rag/         # RAG pipeline (embeddings, LLM)
│   │   │       ├── resources/   # Academic resources
│   │   │       └── subjects/    # User subjects
│   │   └── prisma/          # Database schema
│   │
│   ├── web/                 # Next.js Frontend
│   │   └── src/
│   │       ├── app/         # App Router pages
│   │       ├── components/  # React components
│   │       └── lib/         # Utilities & API client
│   │
│   └── shared/              # Shared types & utilities
│
├── .github/workflows/       # CI/CD pipelines
├── docker-compose.yml       # Development services
└── turbo.json              # Turborepo configuration
```

## Available Scripts

```bash
# Development
pnpm dev              # Start all apps in development mode
pnpm dev --filter api # Start only the API
pnpm dev --filter web # Start only the web app

# Building
pnpm build            # Build all apps
pnpm build --filter api
pnpm build --filter web

# Testing
pnpm test             # Run all tests
pnpm test:cov         # Run tests with coverage
pnpm test:e2e         # Run E2E tests

# Database
pnpm db:push          # Push schema to database
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Prisma Studio

# Linting
pnpm lint             # Run ESLint
pnpm typecheck        # Run TypeScript type check
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with token
- `POST /api/v1/auth/change-password` - Change password (authenticated)

### Two-Factor Authentication
- `POST /api/v1/auth/2fa/setup` - Setup 2FA
- `POST /api/v1/auth/2fa/verify` - Verify 2FA code
- `POST /api/v1/auth/2fa/disable` - Disable 2FA

### Subjects
- `GET /api/v1/subjects` - List user subjects
- `POST /api/v1/subjects` - Create subject
- `GET /api/v1/subjects/:id` - Get subject details
- `PATCH /api/v1/subjects/:id` - Update subject
- `DELETE /api/v1/subjects/:id` - Delete subject

### Flashcards
- `GET /api/v1/flashcards/decks` - List decks
- `POST /api/v1/flashcards/decks` - Create deck
- `GET /api/v1/flashcards/decks/:id` - Get deck
- `GET /api/v1/flashcards/decks/:id/cards` - Get cards in deck
- `POST /api/v1/flashcards/cards` - Create card
- `POST /api/v1/flashcards/cards/:id/review` - Review card (SM-2)
- `GET /api/v1/flashcards/due` - Get due cards
- `GET /api/v1/flashcards/stats` - Get study stats (includes streak)

### Quizzes
- `GET /api/v1/quizzes` - List quizzes
- `POST /api/v1/quizzes` - Create quiz
- `GET /api/v1/quizzes/:id` - Get quiz
- `GET /api/v1/quizzes/:id/take` - Get quiz for taking
- `POST /api/v1/quizzes/:id/submit` - Submit quiz answers
- `GET /api/v1/quizzes/:id/stats` - Get quiz statistics

### RAG (AI Copilot)
- `POST /api/v1/rag/query` - Ask a question
- `POST /api/v1/rag/index` - Index a resource
- `GET /api/v1/rag/search` - Search resources

### Calendar
- `GET /api/v1/calendar/events` - List events
- `POST /api/v1/calendar/events` - Create event
- `PATCH /api/v1/calendar/events/:id` - Update event
- `DELETE /api/v1/calendar/events/:id` - Delete event

## Key Technologies

### Backend (NestJS)
- **Authentication**: JWT + Passport, OAuth2 (Google, GitHub), TOTP 2FA
- **Database**: PostgreSQL + Prisma ORM
- **Vector Search**: pgvector (default) or Qdrant
- **LLM Providers**: OpenAI, Groq (free), Gemini (free), DeepSeek
- **Caching**: Redis (optional) with in-memory fallback
- **Email**: SendGrid, Resend, or SMTP

### Frontend (Next.js 16)
- **Framework**: React 19 with App Router
- **Styling**: Tailwind CSS
- **State**: React Context + Server Components
- **Animations**: Framer Motion

## Adding New Features

### 1. Create a New Module

```bash
# In apps/api/src/modules/
mkdir new-feature
touch new-feature/new-feature.module.ts
touch new-feature/new-feature.service.ts
touch new-feature/new-feature.controller.ts
touch new-feature/dto/create-feature.dto.ts
```

### 2. Module Structure

```typescript
// new-feature.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { NewFeatureController } from './new-feature.controller';
import { NewFeatureService } from './new-feature.service';

@Module({
  imports: [DatabaseModule],
  controllers: [NewFeatureController],
  providers: [NewFeatureService],
  exports: [NewFeatureService],
})
export class NewFeatureModule {}
```

### 3. Register in App Module

```typescript
// app.module.ts
import { NewFeatureModule } from './modules/new-feature/new-feature.module';

@Module({
  imports: [
    // ...existing modules
    NewFeatureModule,
  ],
})
export class AppModule {}
```

## Testing

### Unit Tests

```typescript
// example.service.spec.ts
describe('ExampleService', () => {
  let service: ExampleService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ExampleService],
    }).compile();

    service = module.get<ExampleService>(ExampleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

### Running Tests

```bash
# Unit tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:cov

# E2E tests
pnpm test:e2e
```

## Deployment

### Vercel (Frontend)

The web app is configured for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to `main`

### API Deployment

Options:
- **Railway**: `railway up`
- **Render**: Connect GitHub repo
- **Docker**: Use provided Dockerfile

### Required Secrets (GitHub Actions)

```
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

## Troubleshooting

### Database Issues

```bash
# Reset database
pnpm db:push --force-reset

# View database
pnpm db:studio
```

### Redis Connection

If Redis is not available, the app falls back to in-memory cache automatically.

### LLM Rate Limits

Free providers (Groq, Gemini) have rate limits. The app automatically rotates between available providers.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Commit with conventional commits: `git commit -m "feat: add new feature"`
6. Push and create a Pull Request

## License

MIT
