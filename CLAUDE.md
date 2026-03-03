# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nexum is a Brazilian business management system (Sistema de Gestão Empresarial) built with Next.js 14 App Router, Supabase for backend/auth, and Tailwind CSS with a dark glass-morphism UI theme.

## Commands

```bash
npm run dev          # Start development server (port 3002)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run setup:seed   # Create seed SUPER_ADMIN user (requires SUPABASE_SERVICE_ROLE_KEY in .env.local)
```

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (only for seed script)

## Architecture

### Path Alias
`@/*` maps to `./src/*` (e.g., `@/lib/supabase`, `@/types`, `@/store`)

### Directory Structure
- `src/app/` - Next.js App Router pages (Portuguese naming: `atividades`, `configuracao`, etc.)
- `src/components/` - React components organized by domain (`auth/`, `company/`)
- `src/lib/supabase/` - Supabase client factories (`browser.ts` for client, `server.ts` for server components)
- `src/store/` - Zustand stores (`useAuthStore`, `useCompanyStore`)
- `src/types/` - TypeScript types and database schema definitions
- `src/hooks/` - Custom hooks (`usePermissions`, `useRequireAuth`, `useCompanyContext`)
- `supabase/` - SQL migration files for database schema and RLS policies

### Supabase Client Usage
- **Client components**: `import { createClient } from '@/lib/supabase/browser'`
- **Server components/API routes**: `import { createClient } from '@/lib/supabase/server'` (async function)

### Authentication & Authorization

**User Roles** (defined in `src/types/index.ts`):
- `SUPER_ADMIN` - Full system access, manages all companies
- `admin` - Company administrator
- `editor` - Can create/edit content within company
- `visualizador` - Read-only access

**Route Protection**:
- Middleware (`src/middleware.ts`) handles auth routing
- SUPER_ADMIN redirects to `/superadmin`
- Other authenticated users redirect to `/atividades`
- Use `usePermissions()` hook for client-side permission checks

**Database RLS**: Row Level Security policies enforce data isolation by company (`empresa_id`) and role. See `supabase/02-rls.sql`.

### Database Tables

| Table | Purpose |
|-------|---------|
| `empresas` | Companies/tenants |
| `usuarios` | User profiles (linked to `auth.users`) |
| `tarefas` | Tasks (company-scoped) |
| `empresa_configuracoes` | Company financial settings |

### State Management Pattern

Zustand stores in `src/store/index.ts`:
- `useAuthStore` - Auth state, login/logout, session checking
- `useCompanyStore` - Company selection and management

### UI Patterns

- Dark theme with custom colors defined in `tailwind.config.js` (`nexum-primary`, `nexum-secondary`, `nexum-dark`, etc.)
- Glass-morphism cards using `.dark-card` class
- Icons from `lucide-react` and `@tabler/icons-react`
- Charts via `recharts`
- Calendar via `@fullcalendar/react`

## Database Migrations

Execute SQL files in Supabase SQL Editor in order:
1. `supabase/01-schema.sql` - Tables and functions
2. `supabase/02-rls.sql` - Row Level Security policies
3. `supabase/03-seed.sql` - Initial seed data
4. `supabase/04-add-empresa-campos-configuracoes.sql` - Schema updates
5. `supabase/05-add-usuario-campos.sql` - Adiciona campos email, cargo, aprovador, ativo, senha_provisoria na tabela usuarios

## Language

UI and code comments are in Portuguese (pt-BR). Database columns use Portuguese naming (`criado_em`, `empresa_id`, `nome`, etc.).
