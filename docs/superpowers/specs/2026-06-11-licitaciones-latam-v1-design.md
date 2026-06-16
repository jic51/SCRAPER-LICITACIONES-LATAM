# Scraper Licitaciones LATAM — Diseño V1

**Fecha:** 2026-06-11
**Estado:** Aprobado
**Versión:** 1.0

---

## Resumen Ejecutivo

**LicitaAI** es un SaaS B2B para PYMES contratistas en LATAM que automatiza la búsqueda, análisis y seguimiento de licitaciones de gobierno. El sistema scrapeea portales de gobierno, calcula un **Fit Score** por IA comparando cada licitación contra el perfil de la empresa cliente, y entrega los resultados vía dashboard web y alertas de WhatsApp.

**Meta de negocio:** $10,000 USD MRR  
**Mercado inicial:** México (CompraNet)  
**Roadmap geográfico:** México (V1) → Colombia SECOP II (V2) → Chile ChileCompra (V3)

---

## Propuesta de Valor

> "Tu empresa nunca más pierde una licitación de gobierno"

El cliente no compra software — compra un **Director de Licitaciones Virtual** que trabaja 24/7, cuesta menos que un empleado de medio tiempo, y le dice exactamente qué licitaciones puede ganar antes de invertir tiempo en una propuesta.

**Diferenciador único en LATAM:** Ningún competidor en español calcula compatibilidad empresa-licitación automáticamente. GovDash, Sweetspot y DeepRFP existen solo en inglés para el mercado USA.

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────┐
│                  CLIENTE (navegador)                 │
│           Dashboard Web — Next.js + Vercel           │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────┐
│              SUPABASE (cerebro central)              │
│   PostgreSQL │ Auth │ Almacenamiento PDFs │ Realtime │
└──────┬───────┴──────────────────┬───────────────────┘
       │                          │
┌──────▼──────────┐    ┌──────────▼─────────────────┐
│  WORKER NOCTURN │    │     SERVICIOS EXTERNOS      │
│  Playwright en  │    │  Anthropic API (Fit Score)  │
│  DigitalOcean   │    │  360dialog (WhatsApp)       │
│  Scraper de     │    │  Stripe (facturación)       │
│  CompraNet      │    └────────────────────────────-┘
└─────────────────┘
```

**Flujo principal:**
1. Worker nocturno scrapeea CompraNet y guarda licitaciones nuevas en Supabase
2. Claude Haiku compara cada licitación contra los filtros del usuario y genera Fit Score
3. Supabase dispara notificaciones: WhatsApp vía 360dialog y/o badge en dashboard
4. Cliente revisa resultados, marca interés y accede al análisis completo

---

## Stack Tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| Frontend | Next.js + TypeScript + Tailwind CSS + shadcn/ui | Ecosistema SaaS más completo, deploy automático en Vercel |
| Base de datos | Supabase (PostgreSQL) | Row-Level Security nativo para aislamiento multi-tenant |
| Auth | Supabase Auth | Incluido, email + Google OAuth |
| Automatización | Playwright en DigitalOcean ($12/mes) | Open source, sin dependencia de terceros, full control |
| IA | Anthropic Claude API (Haiku + Sonnet) | Mejor manejo de PDFs largos, contexto grande |
| WhatsApp | 360dialog BSP | Más económico para LATAM, especializado en WhatsApp |
| Pagos | Stripe | Estándar SaaS, maneja MXN y IVA automático |
| Hosting frontend | Vercel | Deploy automático desde GitHub, gratuito en V1 |

**Costo mensual de infraestructura (antes de clientes):** ~$82–112 USD/mes

---

## Modelo de Datos

### Tablas principales (Supabase/PostgreSQL)

```sql
-- Usuarios
users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  phone text,
  company_name text NOT NULL,
  country_code text DEFAULT 'MX',
  plan_id text REFERENCES plans(id),
  credits_used_this_month int DEFAULT 0,
  whatsapp_enabled boolean DEFAULT false,
  email_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
)

-- Filtros de búsqueda del usuario
user_filters (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  sectors text[],          -- ['construccion', 'tecnologia', 'limpieza']
  states text[],           -- ['CDMX', 'Jalisco', 'Nuevo León']
  min_amount bigint,       -- en MXN
  max_amount bigint,
  keywords text[]          -- palabras clave adicionales opcionales
)

-- Licitaciones scrapeadas
licitaciones (
  id uuid PRIMARY KEY,
  portal_id text UNIQUE,   -- ID único en CompraNet
  title text NOT NULL,
  agency text,
  sector text,
  state text,
  amount bigint,           -- en MXN
  deadline timestamptz,
  pdf_url text,
  country_code text DEFAULT 'MX',
  found_at timestamptz DEFAULT now()
)

-- Scores de compatibilidad por usuario
fit_scores (
  id uuid PRIMARY KEY,
  licitacion_id uuid REFERENCES licitaciones(id),
  user_id uuid REFERENCES users(id),
  score int CHECK (score >= 0 AND score <= 100),
  analysis jsonb,          -- breakdown por requisito
  score_source text,       -- 'full_pdf' | 'title_only' (si PDF no disponible)
  status text DEFAULT 'calculado',
  -- valores: 'pendiente' | 'calculado' | 'descartado' | 'interesado'
  created_at timestamptz DEFAULT now()
)

-- Historial de notificaciones enviadas
notifications (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  licitacion_ids uuid[],
  channel text,            -- 'whatsapp' | 'dashboard' | 'email'
  sent_at timestamptz DEFAULT now(),
  confirmed boolean DEFAULT false
)

-- Planes de suscripción
plans (
  id text PRIMARY KEY,     -- 'starter' | 'pro' | 'business'
  name text NOT NULL,
  monthly_price_usd int,
  monthly_fit_scores int,  -- -1 = ilimitado
  monthly_alerts int       -- -1 = ilimitado
)
```

**Seguridad:** Todas las tablas tienen Row-Level Security (RLS) activado. Cada usuario solo puede leer y escribir sus propios registros. El aislamiento por `country_code` es automático — un usuario con `country_code = 'MX'` nunca ve datos de Colombia aunque estén en la misma base de datos.

---

## Planes y Precios

| Plan | Precio/mes | Fit Scores/mes | Alertas WhatsApp/mes | Usuarios |
|---|---|---|---|---|
| **Starter** | $29 USD | 20 | 15 | 1 |
| **Pro** | $79 USD | 100 | 60 | 1 |
| **Business** | $179 USD | Ilimitados | Ilimitados | 3 |

**Rate limiting:** Cuando un usuario agota sus créditos, el botón "Ver Fit Score" se bloquea y muestra: *"Alcanzaste tu límite este mes. Actualiza tu plan para continuar."* Los créditos se reinician el día 1 de cada mes vía webhook de Stripe.

---

## Pantallas del Sistema

### 1. Landing Page (`/`)
Propuesta de valor, lista de precios, CTA de registro. Sin elementos innecesarios.

### 2. Registro (`/signup`)
Campos: email, contraseña, nombre de empresa. País fijo México en V1. Verificación de email obligatoria.

### 3. Onboarding (`/onboarding`) — solo primera vez, 3 pasos
- **Paso 1:** ¿En qué sectores trabaja tu empresa? (multi-selección)
- **Paso 2:** ¿En qué estados de México opera? (multi-selección)
- **Paso 3:** ¿Qué rango de monto de contrato te interesa? (slider MXN)

Sin solicitar datos financieros ni certificaciones. Toda información adicional es opcional y se puede agregar desde Configuración.

### 4. Dashboard principal (`/dashboard`)
```
Header: Logo | Plan actual | Badge notificaciones | Perfil
───────────────────────────────────────────────────────
Título: "Licitaciones de hoy — México"
Resumen: "Encontradas: 12  │  Alta compatibilidad: 3"
Filtros activos: [Construcción] [CDMX] [$500K-$5M]
───────────────────────────────────────────────────────
🟢 91% │ IMSS – Suministro material médico
        $1.2M MXN │ Vence en 21 días │ [Ver detalle]
🟡 72% │ PEMEX – Mantenimiento de instalaciones
        $3.8M MXN │ Vence en 14 días │ [Ver detalle]
🔴 31% │ SEP – Servicios de limpieza escolar
        $280K MXN │ Vence en 6 días  │ [Ver detalle]
```

Colores: Verde ≥70%, Amarillo 40-69%, Rojo <40%.  
Si hay Fit Scores pendientes de procesar, aparece un spinner con "Analizando..."

### 5. Detalle de licitación (`/dashboard/licitacion/[id]`)
- Título, dependencia, monto, fecha límite, enlace directo a CompraNet
- Breakdown visual del Fit Score: cada requisito detectado con ✅ / ⚠️ / ❌
- Botón: **"Me interesa"** → cambia status a 'interesado', confirma en WhatsApp si está activado
- Botón: **"Descartar"** → oculta de la lista principal

### 6. Configuración (`/settings`)
- Editar filtros de búsqueda (sector, estado, monto)
- Canal de notificaciones: activar/desactivar WhatsApp (+ campo de teléfono), email
- Ver plan actual y créditos usados este mes
- Botón de upgrade de plan (abre Stripe Billing Portal)

---

## Flujo de Automatización Nocturna

```
2:00am (hora del centro, México)
│
├─ [1] SCRAPER (Playwright en DigitalOcean)
│     Abre CompraNet en modo headless
│     Busca licitaciones de las últimas 24 horas
│     Extrae: título, dependencia, sector, estado,
│             monto, fecha límite, enlace PDF
│     Guarda solo registros nuevos (dedup por portal_id)
│     Cierra navegador
│
├─ [2] FIT SCORE ENGINE
│     Para cada licitación nueva:
│       Para cada usuario activo:
│         Si la licitación coincide con sus filtros
│         Y el usuario tiene créditos disponibles:
│           Descarga PDF del pliego (si disponible)
│           Envía a Claude Haiku para análisis
│           Guarda score + breakdown en fit_scores
│           Descuenta 1 crédito al usuario
│
└─ [3] NOTIFICACIONES
      Para cada usuario con licitaciones score > 40%:
        Agrupa todas en UN solo mensaje del día
        Envía por WhatsApp si está activado (360dialog)
        Marca badge en dashboard
        Registra en tabla notifications
```

**Reintentos si CompraNet falla:**
- 2:00am → 4:00am → 7:00am → 11:00am
- Si los 4 fallan: dashboard muestra "Actualizando..." con datos en caché
- Nunca se muestra un error técnico al usuario

---

## Sistema de Resiliencia

| Falla | Comportamiento del sistema |
|---|---|
| CompraNet caído | Reintento x4 en horarios escalonados. Dashboard muestra datos del día anterior con indicador "Última actualización hace X horas" |
| Nuestro IP bloqueado | En V1: retry con espera larga. En V1.5: agregar proxies residenciales (BrightData, $50-100/mes) |
| Claude API no disponible | Licitaciones se muestran sin Fit Score con "Análisis en proceso". Se procesan cuando la API se recupera |
| 360dialog/WhatsApp falla | Dashboard siempre funciona como fallback. Email de respaldo si está configurado |
| PDF del pliego no disponible | Score calculado solo con título y descripción visible. Se indica con ⚠️ en el UI |

**Principio:** El usuario siempre ve algo útil. Nunca una pantalla rota o un mensaje de error técnico.

---

## Plan de Testing Antes de Lanzar

### Fase 1 — Testing técnico
- [ ] 3 corridas exitosas consecutivas del scraper de CompraNet
- [ ] Validar Fit Scores con 10 licitaciones reales + 3 perfiles de empresa ficticios
- [ ] Enviar mensajes de prueba de WhatsApp al número propio
- [ ] Completar ciclo de Stripe en modo test: suscripción → límite de créditos → upgrade

### Fase 2 — Beta privada (semanas 9-10)
- [ ] 3-5 empresas contratistas reales en México con acceso gratuito 30 días
- [ ] Recopilar feedback sobre precisión de Fit Scores
- [ ] Ajustar filtros y prompt de Claude según feedback real

---

## Plan de Lanzamiento

```
Semanas 1-8  → Construcción del V1
Semanas 9-10 → Beta privada gratuita (3-5 empresas)
Semana 11    → Lanzamiento público con precio

Canales de adquisición México:
• LinkedIn: grupos de contratistas y proveedores del gobierno
• Facebook: grupos "Licitaciones México" (miles de miembros)
• Cold outreach: empresas adjudicadas en CompraNet (datos públicos)
```

---

## Fuera del Alcance de V1

Los siguientes features están identificados pero explícitamente excluidos de V1 para mantener el alcance manejable para un solo desarrollador:

| Feature | Versión objetivo |
|---|---|
| Generación de borradores de propuesta (Claude Sonnet) | V2 |
| Checklist de documentos requeridos | V2 |
| Pipeline kanban de bids activos | V2 |
| Colombia — SECOP II | V2 |
| Chile — ChileCompra | V3 |
| Portales IMSS, PEMEX, CFE | V1.5 |
| Proxies residenciales anti-bloqueo | V1.5 |
| Inteligencia de competidores | V3 |
| App móvil | V3 |
| Multi-usuario por empresa | V2 |

---

## Estimación de Tiempo (1 desarrollador)

| Módulo | Tiempo estimado |
|---|---|
| Setup proyecto + auth (Supabase + Next.js) | 3 días |
| Onboarding y perfil de filtros | 2 días |
| Dashboard principal + lista de licitaciones | 4 días |
| Scraper CompraNet (Playwright) | 5 días |
| Motor de Fit Score (Claude API) | 4 días |
| Sistema de notificaciones (WhatsApp + dashboard) | 3 días |
| Stripe billing + límites de uso | 3 días |
| Worker nocturno + sistema de reintentos | 2 días |
| Página de detalle de licitación | 2 días |
| Landing page + configuración | 2 días |
| Testing + ajustes | 4 días |
| **Total estimado** | **~38 días hábiles (8 semanas)** |
