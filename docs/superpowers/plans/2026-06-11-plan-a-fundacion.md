# LicitaAI V1 — Plan A: Fundación del Proyecto

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear la base completa de LicitaAI: Next.js configurado, Supabase con schema y RLS, autenticación funcional (signup/login), onboarding de 3 pasos con filtros, y dashboard shell listo para recibir datos reales.

**Architecture:** Next.js 14 App Router con TypeScript. Supabase maneja PostgreSQL, auth y RLS. El middleware de Next.js redirige usuarios no autenticados. Los filtros del usuario se guardan en Supabase al completar onboarding.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Supabase (supabase-js v2 + @supabase/ssr), Vitest + Testing Library

---

## Estructura de archivos que este plan crea

```
licitaai/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx
│   │   └── dashboard/page.tsx
│   ├── auth/callback/route.ts
│   ├── onboarding/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── auth/LoginForm.tsx
│   ├── auth/SignupForm.tsx
│   ├── layout/AppShell.tsx
│   └── onboarding/OnboardingWizard.tsx
├── lib/
│   ├── supabase/client.ts
│   ├── supabase/server.ts
│   ├── constants.ts
│   ├── filters.ts
│   └── types.ts
├── supabase/migrations/001_initial_schema.sql
├── __tests__/
│   ├── lib/filters.test.ts
│   ├── lib/types.test.ts
│   ├── components/auth/SignupForm.test.tsx
│   ├── components/auth/LoginForm.test.tsx
│   └── components/onboarding/OnboardingWizard.test.tsx
├── middleware.ts
├── vitest.config.ts
├── vitest.setup.ts
└── .env.local.example
```

---

### Task 1: Inicializar proyecto Next.js

**Files:**
- Create: `licitaai/` (directorio raíz dentro de SCRAPER-LICITACIONES-LATAM)

- [ ] **Step 1: Crear el proyecto**

Ejecutar dentro de `SCRAPER-LICITACIONES-LATAM/`:

```bash
npx create-next-app@latest licitaai --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
cd licitaai
```

Responder: TypeScript → Yes, ESLint → Yes, Tailwind → Yes, src/ dir → No, App Router → Yes, import alias → No (usar @/*)

- [ ] **Step 2: Instalar dependencias**

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 3: Instalar shadcn/ui**

```bash
npx shadcn@latest init
```

Responder: Default style → Default, base color → Slate, CSS variables → Yes

```bash
npx shadcn@latest add button input label card form toast badge progress separator
```

- [ ] **Step 4: Crear vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
})
```

- [ ] **Step 5: Crear vitest.setup.ts**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Agregar script de test en package.json**

En la sección `"scripts"` agregar:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 7: Verificar que inicia**

```bash
npm run dev
```

Abrir http://localhost:3000 — debe mostrar la página de Next.js. Ctrl+C para detener.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: inicializar proyecto Next.js con TypeScript, Tailwind y shadcn/ui"
```

---

### Task 2: Configurar Supabase

**Files:**
- Create: `.env.local.example`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`

- [ ] **Step 1: Crear proyecto en Supabase**

Ir a https://supabase.com → New project. Guardar: Project URL y anon key (Settings → API).

- [ ] **Step 2: Crear .env.local.example**

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

- [ ] **Step 3: Crear .env.local con tus credenciales reales**

```
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
```

Verificar que `.gitignore` incluye `.env.local` (create-next-app lo agrega automáticamente).

- [ ] **Step 4: Crear lib/supabase/client.ts**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 5: Crear lib/supabase/server.ts**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: configurar clientes Supabase para browser y server"
```

---

### Task 3: Schema de base de datos

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Crear directorio**

```bash
mkdir -p supabase/migrations
```

- [ ] **Step 2: Crear supabase/migrations/001_initial_schema.sql**

```sql
create extension if not exists "uuid-ossp";

-- Planes de suscripción
create table plans (
  id text primary key,
  name text not null,
  monthly_price_usd int not null,
  monthly_fit_scores int not null default 20,
  monthly_alerts int not null default 15
);

insert into plans values
  ('starter',  'Starter',  29,  20,  15),
  ('pro',      'Pro',      79,  100, 60),
  ('business', 'Business', 179, -1,  -1);

-- Perfil extendido del usuario (auth.users lo maneja Supabase)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  phone text,
  company_name text not null,
  country_code text not null default 'MX',
  plan_id text references plans(id) default 'starter',
  credits_used_this_month int not null default 0,
  whatsapp_enabled boolean not null default false,
  email_enabled boolean not null default false,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Filtros de búsqueda
create table user_filters (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  sectors text[] not null default '{}',
  states text[] not null default '{}',
  min_amount bigint not null default 0,
  max_amount bigint not null default 999999999,
  keywords text[] not null default '{}',
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- Licitaciones scrapeadas
create table licitaciones (
  id uuid primary key default uuid_generate_v4(),
  portal_id text not null,
  country_code text not null default 'MX',
  title text not null,
  agency text,
  sector text,
  state text,
  amount bigint,
  deadline timestamptz,
  pdf_url text,
  found_at timestamptz not null default now(),
  unique(portal_id, country_code)
);

-- Scores de compatibilidad
create table fit_scores (
  id uuid primary key default uuid_generate_v4(),
  licitacion_id uuid not null references licitaciones(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  score int not null check (score >= 0 and score <= 100),
  analysis jsonb,
  score_source text not null default 'title_only',
  status text not null default 'calculado',
  created_at timestamptz not null default now(),
  unique(licitacion_id, user_id)
);

-- Historial de notificaciones
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  licitacion_ids uuid[] not null,
  channel text not null,
  sent_at timestamptz not null default now(),
  confirmed boolean not null default false
);

-- Row Level Security
alter table public.users enable row level security;
alter table user_filters enable row level security;
alter table fit_scores enable row level security;
alter table notifications enable row level security;
alter table licitaciones enable row level security;

create policy "ver propio perfil" on public.users for select using (auth.uid() = id);
create policy "actualizar propio perfil" on public.users for update using (auth.uid() = id);

create policy "ver propios filtros" on user_filters for select using (auth.uid() = user_id);
create policy "crear propios filtros" on user_filters for insert with check (auth.uid() = user_id);
create policy "actualizar propios filtros" on user_filters for update using (auth.uid() = user_id);

create policy "ver propios scores" on fit_scores for select using (auth.uid() = user_id);
create policy "actualizar propios scores" on fit_scores for update using (auth.uid() = user_id);

create policy "ver licitaciones autenticado" on licitaciones for select using (auth.role() = 'authenticated');

create policy "ver propias notificaciones" on notifications for select using (auth.uid() = user_id);

-- Trigger: crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, company_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'company_name', 'Mi Empresa')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

- [ ] **Step 3: Ejecutar migración en Supabase**

Ir a supabase.com → tu proyecto → SQL Editor → New query.
Pegar el contenido completo del archivo anterior. Clic en Run.

- [ ] **Step 4: Verificar tablas creadas**

En SQL Editor:
```sql
select * from plans;
```
Debe devolver 3 filas: starter, pro, business.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: agregar schema SQL con tablas, RLS y trigger de nuevos usuarios"
```

---

### Task 4: Tipos TypeScript y lógica de filtros

**Files:**
- Create: `lib/types.ts`
- Create: `lib/filters.ts`
- Create: `lib/constants.ts`
- Create: `__tests__/lib/filters.test.ts`

- [ ] **Step 1: Escribir el test de filtros primero**

Crear `__tests__/lib/filters.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { licitacionMatchesFilters, getScoreColor, formatAmount } from '@/lib/filters'
import type { Licitacion, UserFilters } from '@/lib/types'

const baseLic: Licitacion = {
  id: '1', portal_id: 'CPN-001', country_code: 'MX',
  title: 'Servicio de limpieza edificio federal',
  agency: 'SEP', sector: 'limpieza', state: 'CDMX',
  amount: 500000, deadline: '2026-07-01T00:00:00Z',
  pdf_url: null, found_at: '2026-06-11T02:00:00Z',
}

const baseFilters: UserFilters = {
  sectors: ['limpieza', 'construccion'],
  states: ['CDMX', 'Jalisco'],
  min_amount: 100000, max_amount: 5000000, keywords: [],
}

describe('licitacionMatchesFilters', () => {
  it('retorna true cuando todo coincide', () =>
    expect(licitacionMatchesFilters(baseLic, baseFilters)).toBe(true))

  it('retorna false cuando sector no coincide', () =>
    expect(licitacionMatchesFilters(baseLic, { ...baseFilters, sectors: ['tecnologia'] })).toBe(false))

  it('retorna false cuando estado no coincide', () =>
    expect(licitacionMatchesFilters(baseLic, { ...baseFilters, states: ['Nuevo León'] })).toBe(false))

  it('retorna false cuando monto está bajo el mínimo', () =>
    expect(licitacionMatchesFilters(baseLic, { ...baseFilters, min_amount: 1000000 })).toBe(false))

  it('retorna false cuando monto supera el máximo', () =>
    expect(licitacionMatchesFilters(baseLic, { ...baseFilters, max_amount: 400000 })).toBe(false))

  it('retorna true con sectors vacío (sin filtro)', () =>
    expect(licitacionMatchesFilters(baseLic, { ...baseFilters, sectors: [] })).toBe(true))

  it('retorna true con states vacío (sin filtro)', () =>
    expect(licitacionMatchesFilters(baseLic, { ...baseFilters, states: [] })).toBe(true))

  it('coincide por keyword en título', () =>
    expect(licitacionMatchesFilters(baseLic, { ...baseFilters, sectors: [], keywords: ['limpieza'] })).toBe(true))

  it('retorna false cuando keyword no coincide', () =>
    expect(licitacionMatchesFilters(baseLic, { ...baseFilters, sectors: [], keywords: ['telecomunicaciones'] })).toBe(false))
})

describe('getScoreColor', () => {
  it('green para score >= 70', () => expect(getScoreColor(70)).toBe('green'))
  it('yellow para score entre 40 y 69', () => expect(getScoreColor(55)).toBe('yellow'))
  it('red para score < 40', () => expect(getScoreColor(30)).toBe('red'))
})

describe('formatAmount', () => {
  it('formatea en pesos mexicanos', () => expect(formatAmount(500000)).toContain('500'))
  it('retorna texto cuando amount es null', () => expect(formatAmount(null)).toBe('Monto no especificado'))
})
```

- [ ] **Step 2: Correr tests — deben fallar**

```bash
npm run test:run
```

Resultado esperado: FAIL — "Cannot find module '@/lib/filters'"

- [ ] **Step 3: Crear lib/types.ts**

```typescript
export type Plan = {
  id: 'starter' | 'pro' | 'business'
  name: string
  monthly_price_usd: number
  monthly_fit_scores: number
  monthly_alerts: number
}

export type UserProfile = {
  id: string
  email: string
  phone: string | null
  company_name: string
  country_code: string
  plan_id: Plan['id']
  credits_used_this_month: number
  whatsapp_enabled: boolean
  email_enabled: boolean
  onboarding_completed: boolean
  created_at: string
}

export type UserFilters = {
  sectors: string[]
  states: string[]
  min_amount: number
  max_amount: number
  keywords: string[]
}

export type Licitacion = {
  id: string
  portal_id: string
  country_code: string
  title: string
  agency: string | null
  sector: string | null
  state: string | null
  amount: number | null
  deadline: string | null
  pdf_url: string | null
  found_at: string
}

export type FitScoreAnalysisItem = {
  requirement: string
  status: 'cumple' | 'no_cumple' | 'verificar'
  note: string
}

export type FitScore = {
  id: string
  licitacion_id: string
  user_id: string
  score: number
  analysis: { summary: string; items: FitScoreAnalysisItem[] } | null
  score_source: 'full_pdf' | 'title_only'
  status: 'pendiente' | 'calculado' | 'descartado' | 'interesado'
  created_at: string
}

export type LicitacionWithScore = Licitacion & {
  fit_scores: FitScore | null
}
```

- [ ] **Step 4: Crear lib/filters.ts**

```typescript
import type { Licitacion, UserFilters } from '@/lib/types'

export function licitacionMatchesFilters(
  licitacion: Licitacion,
  filters: UserFilters
): boolean {
  const { sectors, states, min_amount, max_amount, keywords } = filters

  if (sectors.length > 0 && licitacion.sector) {
    const sectorMatch = sectors.includes(licitacion.sector.toLowerCase())
    if (!sectorMatch && keywords.length === 0) return false
  }

  if (states.length > 0 && licitacion.state) {
    if (!states.includes(licitacion.state)) return false
  }

  if (licitacion.amount !== null) {
    if (licitacion.amount < min_amount || licitacion.amount > max_amount) return false
  }

  if (keywords.length > 0) {
    const text = `${licitacion.title} ${licitacion.sector ?? ''}`.toLowerCase()
    if (!keywords.some(kw => text.includes(kw.toLowerCase()))) return false
  }

  return true
}

export function getScoreColor(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 70) return 'green'
  if (score >= 40) return 'yellow'
  return 'red'
}

export function formatAmount(amount: number | null): string {
  if (amount === null) return 'Monto no especificado'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', maximumFractionDigits: 0,
  }).format(amount)
}

export function getDaysUntilDeadline(deadline: string | null): number | null {
  if (!deadline) return null
  const diffMs = new Date(deadline).getTime() - Date.now()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}
```

- [ ] **Step 5: Crear lib/constants.ts**

```typescript
export const MEXICO_SECTORS = [
  { id: 'construccion', label: 'Construcción e infraestructura' },
  { id: 'tecnologia', label: 'Tecnología y servicios digitales' },
  { id: 'limpieza', label: 'Limpieza y mantenimiento' },
  { id: 'salud', label: 'Salud y equipamiento médico' },
  { id: 'educacion', label: 'Educación y capacitación' },
  { id: 'seguridad', label: 'Seguridad y vigilancia' },
  { id: 'alimentacion', label: 'Alimentación y suministros' },
  { id: 'transporte', label: 'Transporte y logística' },
  { id: 'consultoria', label: 'Consultoría y servicios profesionales' },
  { id: 'otro', label: 'Otro sector' },
]

export const MEXICO_STATES = [
  'Aguascalientes','Baja California','Baja California Sur','Campeche',
  'Chiapas','Chihuahua','CDMX','Coahuila','Colima','Durango',
  'Estado de México','Guanajuato','Guerrero','Hidalgo','Jalisco',
  'Michoacán','Morelos','Nayarit','Nuevo León','Oaxaca',
  'Puebla','Querétaro','Quintana Roo','San Luis Potosí','Sinaloa',
  'Sonora','Tabasco','Tamaulipas','Tlaxcala','Veracruz','Yucatán','Zacatecas',
]

export const AMOUNT_PRESETS = [
  { label: 'Hasta $500K MXN',    min: 0,          max: 500_000 },
  { label: '$500K – $2M MXN',    min: 500_000,     max: 2_000_000 },
  { label: '$2M – $10M MXN',     min: 2_000_000,   max: 10_000_000 },
  { label: '$10M – $50M MXN',    min: 10_000_000,  max: 50_000_000 },
  { label: 'Más de $50M MXN',    min: 50_000_000,  max: 999_999_999 },
]
```

- [ ] **Step 6: Correr tests — deben pasar**

```bash
npm run test:run
```

Resultado esperado: PASS (12 tests)

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: agregar tipos, lógica de filtros con tests y constantes"
```

---

### Task 5: Middleware de autenticación

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Crear middleware.ts en la raíz del proyecto**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const publicPaths = ['/', '/login', '/signup']
  const isPublic = publicPaths.includes(pathname) || pathname.startsWith('/auth/')

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

- [ ] **Step 2: Verificar que el servidor arranca sin errores**

```bash
npm run dev
```

Visitar http://localhost:3000/dashboard — debe redirigir a /login.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: agregar middleware de auth con redirecciones por ruta"
```

---

### Task 6: Signup y Login

**Files:**
- Create: `app/(auth)/layout.tsx`
- Create: `app/(auth)/signup/page.tsx`
- Create: `app/(auth)/login/page.tsx`
- Create: `components/auth/SignupForm.tsx`
- Create: `components/auth/LoginForm.tsx`
- Create: `app/auth/callback/route.ts`

- [ ] **Step 1: Escribir tests de SignupForm**

Crear `__tests__/components/auth/SignupForm.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignupForm from '@/components/auth/SignupForm'

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signUp: vi.fn().mockResolvedValue({ error: null }) },
  }),
}))

describe('SignupForm', () => {
  it('muestra los 3 campos requeridos', () => {
    render(<SignupForm />)
    expect(screen.getByLabelText(/nombre de empresa/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
  })

  it('muestra error con email inválido', async () => {
    render(<SignupForm />)
    await userEvent.type(screen.getByLabelText(/correo electrónico/i), 'no-es-email')
    fireEvent.blur(screen.getByLabelText(/correo electrónico/i))
    await waitFor(() =>
      expect(screen.getByText(/correo electrónico inválido/i)).toBeInTheDocument()
    )
  })

  it('muestra error con contraseña muy corta', async () => {
    render(<SignupForm />)
    await userEvent.type(screen.getByLabelText(/contraseña/i), '123')
    fireEvent.blur(screen.getByLabelText(/contraseña/i))
    await waitFor(() =>
      expect(screen.getByText(/mínimo 8 caracteres/i)).toBeInTheDocument()
    )
  })
})
```

- [ ] **Step 2: Correr test — debe fallar**

```bash
npm run test:run
```

Resultado esperado: FAIL — "Cannot find module '@/components/auth/SignupForm'"

- [ ] **Step 3: Crear components/auth/SignupForm.tsx**

```typescript
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

type F = { company_name: string; email: string; password: string }
type E = Partial<Record<keyof F, string>>

function validate(f: F): E {
  const e: E = {}
  if (!f.company_name.trim()) e.company_name = 'El nombre de empresa es requerido'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Correo electrónico inválido'
  if (f.password.length < 8) e.password = 'Mínimo 8 caracteres'
  return e
}

export default function SignupForm() {
  const [form, setForm] = useState<F>({ company_name: '', email: '', password: '' })
  const [errors, setErrors] = useState<E>({})
  const [touched, setTouched] = useState<Partial<Record<keyof F, boolean>>>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const touch = (field: keyof F) => {
    setTouched(t => ({ ...t, [field]: true }))
    setErrors(validate(form))
  }

  const change = (field: keyof F, value: string) => {
    const next = { ...form, [field]: value }
    setForm(next)
    if (touched[field]) setErrors(validate(next))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate(form)
    setErrors(errs)
    setTouched({ company_name: true, email: true, password: true })
    if (Object.keys(errs).length > 0) return
    setLoading(true)
    setServerError(null)
    const { error } = await createClient().auth.signUp({
      email: form.email, password: form.password,
      options: { data: { company_name: form.company_name } },
    })
    setLoading(false)
    if (error) { setServerError('Error al crear la cuenta. Intenta de nuevo.'); return }
    setSuccess(true)
  }

  if (success) return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6 text-center space-y-2">
        <h2 className="text-xl font-semibold">Revisa tu correo</h2>
        <p className="text-muted-foreground text-sm">
          Enviamos un enlace de verificación a <strong>{form.email}</strong>
        </p>
      </CardContent>
    </Card>
  )

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Crear cuenta</CardTitle>
        <CardDescription>Empieza a encontrar licitaciones relevantes</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          {([ ['company_name','Nombre de empresa','Constructora Ejemplo SA de CV','text'],
              ['email','Correo electrónico','contacto@empresa.com','email'],
              ['password','Contraseña','Mínimo 8 caracteres','password'],
          ] as [keyof F, string, string, string][]).map(([field, label, placeholder, type]) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={field}>{label}</Label>
              <Input id={field} type={type} placeholder={placeholder}
                value={form[field]}
                onChange={e => change(field, e.target.value)}
                onBlur={() => touch(field)} />
              {touched[field] && errors[field] && (
                <p className="text-sm text-destructive">{errors[field]}</p>
              )}
            </div>
          ))}
          {serverError && <p className="text-sm text-destructive">{serverError}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <a href="/login" className="text-primary hover:underline">Inicia sesión</a>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Crear components/auth/LoginForm.tsx**

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    const { error } = await createClient().auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError('Correo o contraseña incorrectos.'); return }
    router.push('/dashboard'); router.refresh()
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>Accede a tu panel de licitaciones</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" value={email}
              onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" value={password}
              onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <a href="/signup" className="text-primary hover:underline">Regístrate gratis</a>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 5: Crear app/(auth)/layout.tsx**

```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {children}
    </main>
  )
}
```

- [ ] **Step 6: Crear app/(auth)/signup/page.tsx**

```typescript
import SignupForm from '@/components/auth/SignupForm'
export const metadata = { title: 'Crear cuenta — LicitaAI' }
export default function SignupPage() { return <SignupForm /> }
```

- [ ] **Step 7: Crear app/(auth)/login/page.tsx**

```typescript
import LoginForm from '@/components/auth/LoginForm'
export const metadata = { title: 'Iniciar sesión — LicitaAI' }
export default function LoginPage() { return <LoginForm /> }
```

- [ ] **Step 8: Crear app/auth/callback/route.ts**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cs) { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}/dashboard`)
  }
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
```

- [ ] **Step 9: Configurar redirect URL en Supabase**

En supabase.com → Authentication → URL Configuration:
- Site URL: `http://localhost:3000`
- Redirect URLs: agregar `http://localhost:3000/auth/callback`

- [ ] **Step 10: Correr todos los tests**

```bash
npm run test:run
```

Resultado esperado: PASS

- [ ] **Step 11: Verificar visualmente**

```bash
npm run dev
```

- http://localhost:3000/signup — formulario de registro
- http://localhost:3000/login — formulario de login
- http://localhost:3000/dashboard — debe redirigir a /login

- [ ] **Step 12: Commit**

```bash
git add .
git commit -m "feat: agregar signup, login y callback de auth"
```

---

### Task 7: Onboarding Wizard

**Files:**
- Create: `app/onboarding/page.tsx`
- Create: `components/onboarding/OnboardingWizard.tsx`

- [ ] **Step 1: Escribir test del wizard**

Crear `__tests__/components/onboarding/OnboardingWizard.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: () => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  }),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

describe('OnboardingWizard', () => {
  it('muestra paso 1 al inicio', () => {
    render(<OnboardingWizard />)
    expect(screen.getByText(/paso 1 de 3/i)).toBeInTheDocument()
    expect(screen.getByText(/en qué sectores/i)).toBeInTheDocument()
  })

  it('avanza al paso 2 al clicar Siguiente', async () => {
    render(<OnboardingWizard />)
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(screen.getByText(/paso 2 de 3/i)).toBeInTheDocument()
    expect(screen.getByText(/en qué estados/i)).toBeInTheDocument()
  })

  it('regresa al paso 1 al clicar Atrás desde paso 2', async () => {
    render(<OnboardingWizard />)
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    await userEvent.click(screen.getByRole('button', { name: /atrás/i }))
    expect(screen.getByText(/paso 1 de 3/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Correr test — debe fallar**

```bash
npm run test:run
```

Resultado esperado: FAIL

- [ ] **Step 3: Crear components/onboarding/OnboardingWizard.tsx**

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { MEXICO_SECTORS, MEXICO_STATES, AMOUNT_PRESETS } from '@/lib/constants'

type State = { sectors: string[]; states: string[]; min_amount: number; max_amount: number }

export default function OnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<State>({ sectors: [], states: [], min_amount: 0, max_amount: 999_999_999 })

  const toggle = <K extends 'sectors' | 'states'>(key: K, val: string) =>
    setData(d => ({ ...d, [key]: d[key].includes(val) ? d[key].filter(x => x !== val) : [...d[key], val] }))

  const finish = async () => {
    setLoading(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return
    await sb.from('user_filters').upsert({ user_id: user.id, ...data, keywords: [] })
    await sb.from('users').update({ onboarding_completed: true }).eq('id', user.id)
    router.push('/dashboard')
  }

  const btnBase = 'rounded-lg border text-sm transition-all px-4 py-2'
  const active = 'bg-blue-600 border-blue-500 text-white'
  const inactive = 'border-slate-700 text-slate-300 hover:border-slate-500'

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 rounded-xl p-8 border border-slate-800">
        <p className="text-slate-400 text-sm mb-2">Paso {step} de 3</p>
        <div className="w-full bg-slate-800 rounded-full h-1.5 mb-8">
          <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${(step/3)*100}%` }} />
        </div>

        {step === 1 && (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">¿En qué sectores trabaja tu empresa?</h2>
            <p className="text-slate-400 mb-6">Selecciona todos los que apliquen. Puedes cambiar esto después.</p>
            <div className="flex flex-wrap gap-3">
              {MEXICO_SECTORS.map(s => (
                <button key={s.id} onClick={() => toggle('sectors', s.id)}
                  className={`${btnBase} ${data.sectors.includes(s.id) ? active : inactive}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">¿En qué estados de México opera tu empresa?</h2>
            <p className="text-slate-400 mb-6">Selecciona todos donde puedas ejecutar contratos.</p>
            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
              {MEXICO_STATES.map(s => (
                <button key={s} onClick={() => toggle('states', s)}
                  className={`${btnBase} px-3 py-1.5 ${data.states.includes(s) ? active : inactive}`}>
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">¿Qué rango de monto de contrato te interesa?</h2>
            <p className="text-slate-400 mb-6">Selecciona el rango que mejor se ajusta a tu empresa.</p>
            <div className="space-y-3">
              {AMOUNT_PRESETS.map(p => (
                <button key={p.label} onClick={() => setData(d => ({ ...d, min_amount: p.min, max_amount: p.max }))}
                  className={`w-full text-left px-5 py-4 rounded-lg border text-sm transition-all ${
                    data.min_amount === p.min && data.max_amount === p.max ? active : inactive
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="flex justify-between mt-10">
          <Button variant="ghost" onClick={() => setStep(s => s-1)} disabled={step === 1} className="text-slate-400">
            Atrás
          </Button>
          {step < 3
            ? <Button onClick={() => setStep(s => s+1)}>Siguiente</Button>
            : <Button onClick={finish} disabled={loading}>{loading ? 'Guardando...' : 'Ir al Dashboard'}</Button>
          }
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Crear app/onboarding/page.tsx**

```typescript
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'
export const metadata = { title: 'Configurar mi cuenta — LicitaAI' }
export default function OnboardingPage() { return <OnboardingWizard /> }
```

- [ ] **Step 5: Correr tests**

```bash
npm run test:run
```

Resultado esperado: PASS

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: agregar onboarding wizard de 3 pasos con guardado en Supabase"
```

---

### Task 8: Dashboard Shell

**Files:**
- Create: `app/(app)/layout.tsx`
- Create: `app/(app)/dashboard/page.tsx`
- Create: `components/layout/AppShell.tsx`

- [ ] **Step 1: Crear components/layout/AppShell.tsx**

```typescript
'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function AppShell({ children, companyName }: { children: React.ReactNode; companyName: string }) {
  const router = useRouter()
  const signOut = async () => {
    await createClient().auth.signOut()
    router.push('/login'); router.refresh()
  }
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg">🏛 LicitaAI</span>
          <span className="text-slate-500 text-sm hidden md:inline">|</span>
          <span className="text-slate-400 text-sm hidden md:inline">{companyName}</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="/settings" className="text-slate-400 hover:text-white text-sm transition-colors">Configuración</a>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-slate-400">Salir</Button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Crear app/(app)/layout.tsx**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('company_name, onboarding_completed')
    .eq('id', user.id).single()

  if (!profile?.onboarding_completed) redirect('/onboarding')

  return <AppShell companyName={profile.company_name}>{children}</AppShell>
}
```

- [ ] **Step 3: Crear app/(app)/dashboard/page.tsx**

```typescript
import { getScoreColor, formatAmount, getDaysUntilDeadline } from '@/lib/filters'

export const metadata = { title: 'Dashboard — LicitaAI' }

const MOCK = [
  { id:'1', title:'Suministro material médico — IMSS Jalisco', agency:'IMSS', amount:1_200_000,
    deadline: new Date(Date.now()+21*864e5).toISOString(), score:91 },
  { id:'2', title:'Mantenimiento instalaciones — PEMEX Refinería', agency:'PEMEX', amount:3_800_000,
    deadline: new Date(Date.now()+14*864e5).toISOString(), score:72 },
  { id:'3', title:'Servicios limpieza escolar — SEP Nacional', agency:'SEP', amount:280_000,
    deadline: new Date(Date.now()+6*864e5).toISOString(), score:31 },
]

const colorClass = { green:'text-green-400', yellow:'text-yellow-400', red:'text-red-400' }

export default function DashboardPage() {
  const high = MOCK.filter(l => l.score >= 70).length
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Licitaciones de hoy — México</h1>
        <p className="text-slate-400 text-sm">Encontradas: {MOCK.length} · Alta compatibilidad: {high}</p>
      </div>
      <div className="space-y-3">
        {MOCK.map(l => {
          const color = getScoreColor(l.score)
          const days = getDaysUntilDeadline(l.deadline)
          return (
            <div key={l.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between hover:border-slate-600 transition-colors">
              <div className="flex items-center gap-4">
                <span className={`text-2xl font-bold w-14 ${colorClass[color]}`}>{l.score}%</span>
                <div>
                  <p className="font-medium">{l.title}</p>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {formatAmount(l.amount)} · {days !== null ? `Vence en ${days} días` : 'Sin fecha'}
                  </p>
                </div>
              </div>
              <span className="text-blue-400 text-sm ml-4 whitespace-nowrap">Ver detalle →</span>
            </div>
          )
        })}
      </div>
      <div className="mt-8 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <p className="text-slate-400 text-sm text-center">
          🔄 El motor de búsqueda comenzará a traer licitaciones reales de CompraNet próximamente.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Correr todos los tests**

```bash
npm run test:run
```

Resultado esperado: todos PASS

- [ ] **Step 5: Probar el flujo completo**

```bash
npm run dev
```

1. Ir a http://localhost:3000/signup → crear cuenta
2. Verificar email → clic en el enlace
3. Ir a http://localhost:3000/login → iniciar sesión
4. Completar los 3 pasos del onboarding
5. Ver el dashboard con los datos de ejemplo

- [ ] **Step 6: Commit final del Plan A**

```bash
git add .
git commit -m "feat: Plan A completo — auth, onboarding y dashboard shell funcionando"
```

---

## Verificación final del Plan A

Antes de pasar al Plan B, verificar manualmente:

- [ ] Registro de nuevo usuario con email de verificación ✓
- [ ] Login con credenciales correctas redirige a /dashboard ✓
- [ ] Login con credenciales incorrectas muestra error ✓
- [ ] Usuario no autenticado en /dashboard redirige a /login ✓
- [ ] Usuario autenticado en /login redirige a /dashboard ✓
- [ ] Onboarding guarda filtros en Supabase (verificar en Table Editor) ✓
- [ ] Dashboard muestra licitaciones con colores según score ✓
- [ ] Botón Salir cierra la sesión y redirige a /login ✓

Todos PASS → el Plan A está completo. Continuar con el **Plan B: Motor de Automatización**.
