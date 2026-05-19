Tutors-platform monorepo

Apps:
- apps/frontend: Next.js frontend
- apps/backend: NestJS backend

Setup
1. Install dependencies: `npm install` from the repo root.
2. Copy `.env.example` to `.env` in the backend folder and set Supabase keys.
3. Run frontend: `npm run start:frontend` (port 3000) and backend: `npm run start:backend` (port 3001).

Supabase
- Create a Supabase project and provide `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `apps/backend/.env`.
- Frontend uses public anon keys set via `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
