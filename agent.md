# Tutor Management Platform — Agent Guide

## Project Overview

A monorepo platform for small tuition academies and home tutors to digitize academic operations. It replaces registers and spreadsheets with centralized student management, fee collection, attendance tracking, parent communication, and performance analytics.

**Monorepo layout:**
```
Tutors-platform/
├── apps/
│   ├── backend/   # NestJS 10 — port 3001
│   └── frontend/  # Next.js 14 — port 3000
└── package.json   # npm workspaces root
```

**Stack:** Next.js 14 · NestJS 10 · Supabase (PostgreSQL + Auth + Storage) · TypeScript 5 · React 18

---

## 1. Modern UI/UX Requirements

### Design Principles
- Mobile-first responsive layout; every screen must work on 320 px–2560 px viewports.
- Use a consistent design token system (colors, spacing, typography) defined once and imported everywhere.
- All interactive elements must have ≥ 44 × 44 px touch targets.
- Dark mode support via CSS variables / Tailwind `dark:` variants.
- Skeleton loaders on every data-fetching surface; never show a blank white box.
- Optimistic UI updates for attendance marking, fee status changes, and message send — revert on error.

### Component Standards
- Atomic design: atoms → molecules → organisms → templates → pages.
- Shared component library lives in `apps/frontend/components/ui/`.
- Each component exports a single named export. No default exports for components.
- Props typed with TypeScript interfaces, never `any`.
- Use Radix UI primitives or Headless UI for accessibility-correct dropdowns, modals, and tooltips.

### Animations and Skeleton Loaders
- Use Framer Motion for page transitions, list enter/exit, and modal animations.
- Page transitions: 200 ms fade-slide. List items: stagger 40 ms, 150 ms ease-out.
- Skeleton loaders must match the exact shape of the real content (same height, width, border-radius).
- Skeleton pulse animation: `animate-pulse` (Tailwind) or equivalent CSS keyframe.
- Never block the UI thread during animation; keep JS animation budget < 8 ms per frame.
- Respect `prefers-reduced-motion`: disable non-essential animations when set.

```tsx
// Skeleton example pattern
function StudentCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg bg-gray-100 p-4">
      <div className="h-4 w-3/4 rounded bg-gray-300 mb-2" />
      <div className="h-3 w-1/2 rounded bg-gray-200" />
    </div>
  );
}
```

### Loading States
- Global loading indicator (top progress bar) for route transitions.
- Inline spinner for async actions (fee payment, file upload).
- Error boundary per feature section — never let one widget crash the whole page.

---

## 2. NestJS Backend Architecture

### Module Structure
Every feature is a self-contained NestJS module. Follow this pattern for every domain:

```
apps/backend/src/
├── app.module.ts
├── main.ts
├── common/
│   ├── decorators/
│   ├── filters/        # Global exception filter
│   ├── guards/
│   ├── interceptors/   # Transform + logging
│   └── pipes/          # Validation pipe
├── config/
│   └── supabase.config.ts
└── <feature>/
    ├── <feature>.module.ts
    ├── <feature>.controller.ts
    ├── <feature>.service.ts
    ├── dto/
    │   ├── create-<feature>.dto.ts
    │   └── update-<feature>.dto.ts
    └── <feature>.types.ts
```

### Core Modules to Implement
| Module | Responsibility |
|--------|---------------|
| `students` | Profiles, enrollment, batch allocation |
| `attendance` | Daily marking, bulk operations, reports |
| `fees` | Invoice generation, payment tracking, reminders |
| `assignments` | Upload, submission, feedback |
| `messages` | In-app messaging, announcements |
| `classes` | Schedule, Zoom/Meet links, reminders |
| `analytics` | Progress reports, dashboard metrics |
| `auth` | JWT validation, role guards |
| `notifications` | WhatsApp, SMS, email, push dispatch |
| `exams` | Quiz creation, auto-grading, results |
| `resources` | Notes, PDFs, video lecture metadata |

### Configuration
```typescript
// apps/backend/src/config/supabase.config.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);
```

Inject `supabase` via a shared `SupabaseModule` (provide as `SUPABASE_CLIENT` injection token).

### Bootstrapping Rules
```typescript
// main.ts — required bootstrap settings
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor(), new LoggingInterceptor());
  app.enableCors({ origin: process.env.FRONTEND_URL, credentials: true });
  app.setGlobalPrefix('api/v1');
  await app.listen(3001);
}
```

---

## 3. Supabase Database Standards

### Schema Conventions
- All table names: `snake_case`, plural (e.g., `students`, `fee_records`).
- Every table has: `id uuid DEFAULT gen_random_uuid() PRIMARY KEY`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`.
- Foreign keys named `<table_singular>_id` (e.g., `student_id`).
- Use `updated_at` triggers on every table:
  ```sql
  CREATE OR REPLACE FUNCTION update_updated_at()
  RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
  ```
- Never store passwords; authentication is delegated to Supabase Auth.

### Row Level Security (RLS)
- RLS must be enabled on every table — no exceptions.
- Policies must be the narrowest scope needed (tutor can only read their own students).
- Service-role key (backend only) bypasses RLS for admin operations.
- Anon key (frontend) is always subject to RLS.

### Core Tables
```sql
-- Key tables (abbreviated)
students (id, tutor_id, name, email, phone, parent_name, parent_phone, batch_id, enrolled_at, status)
batches  (id, tutor_id, name, subject, schedule, fee_amount)
attendance (id, student_id, class_date, status, marked_by, note)
fee_records (id, student_id, amount, due_date, paid_date, status, invoice_url)
assignments (id, batch_id, title, description, due_date, file_url)
submissions (id, assignment_id, student_id, file_url, submitted_at, feedback, grade)
messages   (id, sender_id, recipient_id, content, is_read, sent_at)
announcements (id, tutor_id, title, body, target_batches uuid[], published_at)
exam_results (id, student_id, exam_id, marks, total_marks, graded_at)
```

### Migrations
- Store all migrations in `apps/backend/supabase/migrations/`.
- File naming: `YYYYMMDDHHMMSS_description.sql`.
- Never mutate an already-applied migration; create a new one.
- Run locally via Supabase CLI before pushing.

### Storage Buckets
| Bucket | Contents | Access |
|--------|----------|--------|
| `assignments` | Homework files | Tutor write / Student read (RLS) |
| `submissions` | Student uploads | Student write / Tutor read (RLS) |
| `resources` | Notes, PDFs | Tutor write / Batch members read |
| `avatars` | Profile photos | Authenticated users |

---

## 4. API Implementation Rules

### REST Conventions
- Base URL: `/api/v1`
- Resources: plural nouns (`/api/v1/students`, `/api/v1/fee-records`).
- Use standard HTTP verbs: GET (read), POST (create), PATCH (partial update), DELETE (soft-delete).
- Soft deletes: add `deleted_at` column; filter `WHERE deleted_at IS NULL` in all queries.
- Pagination: cursor-based using `?cursor=<id>&limit=20`.
- Filtering: query params (`?status=pending&batch_id=<uuid>`).

### Response Envelope
```typescript
// All responses use this shape
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: { total: number; cursor?: string };
  error?: { code: string; message: string; details?: unknown };
}
```

### DTOs and Validation
- Every endpoint has a dedicated DTO class decorated with `class-validator`.
- Use `@IsUUID()`, `@IsEmail()`, `@IsNotEmpty()`, `@IsEnum()`, `@IsISO8601()`.
- Responses use class-transformer `@Exclude()` to strip sensitive fields.

```typescript
// Example DTO
import { IsString, IsEmail, IsOptional, IsUUID } from 'class-validator';

export class CreateStudentDto {
  @IsString() name: string;
  @IsEmail() email: string;
  @IsString() parentPhone: string;
  @IsUUID() batchId: string;
  @IsOptional() @IsString() note?: string;
}
```

### Rate Limiting
- Apply `@nestjs/throttler`: 100 req/min per IP globally; 10 req/min for auth endpoints.

---

## 5. Security Standards

### Authentication & Authorization
- Supabase Auth issues JWTs; backend validates using `SUPABASE_JWT_SECRET`.
- Create a `JwtAuthGuard` applied globally; whitelist public endpoints with `@Public()` decorator.
- Role-based access: `admin`, `tutor`, `student`, `parent` stored in `user_metadata`.
- Create a `@Roles(...roles)` decorator and `RolesGuard`.

### Secrets Management
- All secrets in `.env` files, never committed.
- Required env vars for backend:
  ```
  SUPABASE_URL
  SUPABASE_SERVICE_KEY
  SUPABASE_JWT_SECRET
  FRONTEND_URL
  PORT
  SMTP_HOST / SMTP_USER / SMTP_PASS
  TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN
  WHATSAPP_API_KEY
  ```
- Required env vars for frontend:
  ```
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  NEXT_PUBLIC_API_URL
  ```

### Input Sanitization
- `ValidationPipe` with `whitelist: true` strips unknown properties automatically.
- Sanitize all user-generated content before storage to prevent stored XSS.
- Never interpolate user input into raw SQL; always use Supabase query builder.

### Security Headers (Frontend)
Add to `next.config.js`:
```javascript
headers: [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=()' },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'; ...",
  },
]
```

### Data Privacy
- Student PII (name, phone, parent contact) encrypted at rest via Supabase's encryption.
- Never log PII to console or external services.
- Implement GDPR-compliant data export and deletion endpoints.
- Activity audit log: every write operation records `(user_id, action, table, record_id, timestamp)`.

---

## 6. Validation Rules

### Backend (DTO level)
- All IDs: `@IsUUID('4')`
- Dates: `@IsISO8601()` — store as UTC, display in user's local timezone.
- Phone numbers: `@Matches(/^\+?[1-9]\d{7,14}$/)` — E.164 format preferred.
- Monetary amounts: integer (paise / cents), never floats.
- File uploads: validate MIME type and size in the service layer (max 10 MB per file).
- Enum fields: use TypeScript enums + `@IsEnum()`.

### Frontend (Form level)
- Use React Hook Form + Zod for all forms.
- Show field-level errors inline, not in a toast.
- Disable submit button while request is in-flight.
- Re-validate on blur and on submit, not on every keystroke.

```typescript
// Zod schema example
const studentSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  parentPhone: z.string().regex(/^\+?[1-9]\d{7,14}$/),
  batchId: z.string().uuid(),
});
```

---

## 7. Testing Strategy and Scenarios

### Testing Pyramid
| Layer | Tool | Coverage Target |
|-------|------|-----------------|
| Unit | Jest (backend) | ≥ 80% for services |
| Integration | Jest + Supertest | All controller endpoints |
| Component | React Testing Library | All shared UI components |
| E2E | Playwright | Critical user journeys |

### Backend Unit Tests
- Test every service method in isolation; mock Supabase client with `jest.mock`.
- Cover: happy path, empty results, Supabase error response, validation rejection.

### Integration Tests (Controller level)
```typescript
// Example: attendance controller integration test
describe('POST /api/v1/attendance', () => {
  it('marks attendance and returns 201', ...);
  it('returns 400 for invalid date format', ...);
  it('returns 403 when tutor marks another tutor\'s student', ...);
  it('returns 409 if attendance already marked today', ...);
});
```

### Critical E2E Scenarios (Playwright)
1. Tutor signs up → onboarding → creates first batch → adds student.
2. Mark daily attendance (bulk) → verify parent notification triggered.
3. Generate fee invoice → student pays → status updates to paid.
4. Upload assignment → student submits → tutor grades → student sees result.
5. Tutor sends announcement to batch → parents receive in-app notification.
6. Tutor creates MCQ quiz → student takes quiz → result auto-graded.
7. Download student report card PDF.

### Test File Location
- Backend: co-located `<feature>.service.spec.ts`, `<feature>.controller.spec.ts`.
- Frontend components: `__tests__/` next to component file.
- E2E: `apps/frontend/e2e/`.

---

## 8. QA Automation Standards

### Pre-commit Checks
- ESLint + Prettier on changed files (`lint-staged`).
- TypeScript type-check (`tsc --noEmit`).
- Run unit tests for changed modules.

### CI Test Pipeline
```
lint → type-check → unit tests → integration tests → E2E tests (headless)
```

### Playwright Config
- Run against `http://localhost:3000` (started in CI via `webServer`).
- Three projects: `chromium`, `firefox`, `webkit`.
- Screenshot and video on failure.
- Retry failed tests up to 2 times in CI.

### AI-Assisted QA Workflow
- Before marking a feature complete, run: describe the feature to the agent and ask it to generate edge case test scenarios.
- Agent-generated scenarios are reviewed, approved, and added to the Playwright suite before the PR is merged.
- Use the agent to review API response shapes against the defined `ApiResponse<T>` envelope.
- For complex business logic (fee calculations, attendance percentages), prompt the agent to generate property-based test inputs.

---

## 9. Error Handling and Monitoring

### Backend Global Exception Filter
```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Map Supabase errors, validation errors, and unknown errors
    // to consistent ApiResponse error shape
    // Log to monitoring service
    // Never expose stack traces in production
  }
}
```

### Error Codes
Define an `ErrorCode` enum:
```typescript
enum ErrorCode {
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  NOTIFICATION_FAILED = 'NOTIFICATION_FAILED',
  INTERNAL = 'INTERNAL_ERROR',
}
```

### Frontend Error Handling
- React Error Boundaries per feature section (`StudentsErrorBoundary`, `FeesErrorBoundary`, etc.).
- `axios` / `fetch` wrapper that maps HTTP status codes to user-friendly messages.
- Toast notifications for transient errors (network timeout); inline messages for validation errors.
- Never show raw error objects or stack traces to users.

### Monitoring
- Use Sentry for both frontend and backend error tracking.
  - Backend: `@sentry/node` in the global exception filter.
  - Frontend: `@sentry/nextjs` wrapping `_app.tsx`.
- Set `SENTRY_DSN` in env; disable in test environments.
- Tag errors with `userId`, `role`, `feature` for filtering.
- Alert on error rate > 1% over 5 minutes.

### Logging
- Backend: structured JSON logs via `@nestjs/common` Logger or `pino`.
- Log levels: `error`, `warn`, `log` (info), `debug` — `debug` disabled in production.
- Every request logged with: method, path, status, duration, userId.
- Never log passwords, tokens, or PII.

---

## 10. CI/CD Pipeline

```yaml
# GitHub Actions — .github/workflows/ci.yml (abbreviated)
on: [push, pull_request]
jobs:
  ci:
    steps:
      - checkout
      - setup-node (v20)
      - npm ci
      - lint (frontend + backend)
      - type-check (frontend + backend)
      - unit tests (backend)
      - build frontend
      - build backend
      - integration tests
      - e2e tests (Playwright, headless)
      - upload test artifacts (screenshots, videos) on failure

  deploy-preview:  # on PR
    needs: ci
    - deploy frontend to Vercel preview
    - deploy backend to Railway/Render preview env

  deploy-production:  # on merge to main
    needs: ci
    - deploy frontend to Vercel production
    - deploy backend to Railway/Render production
    - run database migrations (Supabase CLI)
    - send deployment notification
```

### Branch Strategy
- `main` — production-ready, protected, requires PR + passing CI + one review.
- `develop` — integration branch; PRs target this.
- Feature branches: `feat/<ticket>-short-description`.
- Hotfix branches: `hotfix/<description>`, merged directly to `main` + backported to `develop`.

### Deployment Targets
| Service | Platform | Trigger |
|---------|----------|---------|
| Frontend | Vercel | Git push to `main` |
| Backend | Railway or Render | Git push to `main` |
| Database | Supabase (managed) | Migration via CI |
| File Storage | Supabase Storage | Configured via migrations |

---

## 11. Performance Optimization

### Backend
- Cache frequently-read, rarely-changed data (batch lists, tutor config) with in-memory cache (`@nestjs/cache-manager`) or Redis; TTL 5 minutes.
- Database: add indexes on all foreign key columns and commonly filtered columns (`status`, `due_date`, `class_date`).
- Paginate all list endpoints — never return unbounded result sets.
- Use Supabase `select()` column projection — never `SELECT *`.
- Background jobs for heavy operations (PDF report generation, bulk notifications) using BullMQ.

### Frontend
- Next.js `Image` component for all images (automatic WebP, lazy load, size hints).
- Code-split by route; dynamic `import()` for heavy components (charts, PDF viewer).
- Prefetch data for likely-next routes using `router.prefetch`.
- Use `React.memo` and `useMemo`/`useCallback` only where profiling proves a bottleneck.
- Bundle analysis: run `next build --analyze` before each release; flag if any chunk > 250 KB.
- Lighthouse score targets: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90.

### API
- Avoid N+1 queries; use Supabase joins or batch requests.
- Gzip compression enabled on the NestJS server (`compression` middleware).
- Response time target: P95 < 300 ms for list endpoints, < 100 ms for simple CRUD.

---

## 12. Accessibility

- All pages must pass WCAG 2.1 AA.
- Semantic HTML: use `<main>`, `<nav>`, `<section>`, `<article>`, `<aside>` correctly.
- All images have descriptive `alt` text; decorative images use `alt=""`.
- Color contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text.
- Full keyboard navigation: no focus traps except modals (trap focus inside open modals).
- `aria-label` on all icon-only buttons.
- Form fields linked to labels via `htmlFor` / `id`; error messages linked via `aria-describedby`.
- Skip-to-main-content link as the first focusable element on every page.
- Announce dynamic content changes with `aria-live="polite"`.
- Run `axe-core` in Playwright tests to catch regressions automatically.

---

## 13. Analytics and Reporting

### Platform Analytics (Internal)
- Track feature usage events: attendance marked, fee paid, message sent, assignment uploaded.
- Use Supabase `analytics_events` table or PostHog (self-hosted or cloud).
- Dashboard widgets: DAU, feature adoption, average attendance rate, fee collection rate.

### Tutor-Facing Reports
| Report | Endpoint | Format |
|--------|----------|--------|
| Monthly attendance summary | `GET /api/v1/reports/attendance` | JSON + PDF |
| Fee collection status | `GET /api/v1/reports/fees` | JSON + CSV |
| Student progress report | `GET /api/v1/reports/students/:id/progress` | JSON + PDF |
| Batch performance | `GET /api/v1/reports/batches/:id/performance` | JSON |

- PDF generation: use Puppeteer or `@react-pdf/renderer` on the backend.
- All downloadable reports signed with short-lived Supabase Storage URLs (expire in 15 minutes).
- Revenue analytics: monthly income, pending dues, collection rate — displayed on tutor dashboard.

### Real-Time Metrics (Dashboard)
- Today's attendance rate, pending fees count, upcoming classes — fetched on dashboard mount.
- Use Supabase Realtime subscriptions for live attendance updates during class.

---

## 14. Documentation Standards

### Code Documentation
- No comments explaining WHAT the code does; only WHY when non-obvious.
- Public service methods: one-line JSDoc summary if the purpose is not obvious from the name.
- DTOs: no comments needed; field names and validators are self-documenting.

### API Documentation
- Use `@nestjs/swagger` to auto-generate OpenAPI docs at `/api/v1/docs`.
- Every controller decorated with `@ApiTags()`, every endpoint with `@ApiOperation()` and `@ApiResponse()`.
- Keep docs in sync with implementation — CI fails if Swagger schema drifts.

### Architecture Decision Records (ADRs)
- Store in `docs/adr/` as Markdown files.
- Format: `NNNN-title.md` with sections: Status, Context, Decision, Consequences.
- Create an ADR for every significant technical decision (auth strategy, notification provider, payment gateway).

### README Files
- Root `README.md`: project overview, prerequisites, setup steps, npm scripts.
- `apps/backend/README.md`: module map, env vars reference, migration commands.
- `apps/frontend/README.md`: component library overview, environment vars, Storybook commands.

---

## 15. Production Readiness Requirements

### Pre-Launch Checklist
- [ ] All environment variables set and verified in production.
- [ ] RLS policies audited on every Supabase table.
- [ ] Database migrations applied cleanly on a fresh Supabase project.
- [ ] Sentry DSN configured; test error appears in Sentry dashboard.
- [ ] CORS `origin` set to production frontend URL only.
- [ ] Rate limiting active on all endpoints.
- [ ] Security headers present and verified via securityheaders.io.
- [ ] Lighthouse audit ≥ 90 on all core pages.
- [ ] No `console.log` with PII in production build.
- [ ] API `/health` endpoint returns 200 with DB connectivity check.
- [ ] Automated database backups enabled in Supabase (daily snapshots).
- [ ] SSL certificates valid on all domains.
- [ ] Error rate baseline established in monitoring.
- [ ] On-call runbook written for top 5 alert scenarios.

### Health Endpoint
```typescript
// GET /api/v1/health
{
  "status": "ok",
  "db": "connected",
  "uptime": 3600,
  "version": "1.0.0"
}
```

### Rollback Plan
- Database: Supabase point-in-time restore or previous snapshot.
- Backend: re-deploy previous Git tag via Railway/Render dashboard.
- Frontend: Vercel instant rollback to previous deployment.
- Document rollback steps in `docs/runbook.md`.

### Scalability Thresholds
- Backend horizontally scalable (stateless NestJS); add replicas at > 200 concurrent users.
- Supabase connection pooling enabled (PgBouncer) at > 50 simultaneous DB connections.
- BullMQ queue for all outbound notifications — never block the request cycle for SMS/email/WhatsApp.

---

## Quick Reference: Running the Project

```bash
# Install all dependencies
npm install

# Copy and fill environment variables
cp apps/backend/.env.example apps/backend/.env
# edit apps/backend/.env with Supabase credentials

# Run both servers (separate terminals)
npm run start:frontend   # http://localhost:3000
npm run start:backend    # http://localhost:3001

# Run tests
cd apps/backend && npm test               # unit tests
cd apps/backend && npm run test:e2e      # integration tests
cd apps/frontend && npx playwright test  # E2E tests

# Build for production
npm run build  # (from root, triggers both frontend and backend builds)
```
