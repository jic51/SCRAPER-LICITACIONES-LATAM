import { createClient } from '@/lib/supabase/server'
import SettingsForm from '@/components/settings/SettingsForm'
import type { UserFilters } from '@/lib/types'

export const metadata = { title: 'Configuración — LicitaAI' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: filtersRow }] = await Promise.all([
    supabase.from('users')
      .select('email, company_name, country_code, plan_id')
      .eq('id', user!.id).single(),
    supabase.from('user_filters')
      .select('sectors, states, min_amount, max_amount, keywords')
      .eq('user_id', user!.id).maybeSingle(),
  ])

  const filters: UserFilters = {
    sectors: filtersRow?.sectors ?? [],
    states: filtersRow?.states ?? [],
    min_amount: filtersRow?.min_amount ?? 0,
    max_amount: filtersRow?.max_amount ?? 999_999_999,
    keywords: filtersRow?.keywords ?? [],
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Configuración</h1>
        <p className="text-slate-400 text-sm">
          Actualiza tus filtros para que LicitaAI encuentre las licitaciones más relevantes para tu empresa.
        </p>
      </div>

      {/* Información de cuenta (solo lectura) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
        <h2 className="font-semibold mb-4 text-slate-200">Tu cuenta</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Empresa</dt>
            <dd className="text-white">{profile?.company_name ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Correo</dt>
            <dd className="text-white">{profile?.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">País</dt>
            <dd className="text-white">{profile?.country_code === 'MX' ? '🇲🇽 México' : profile?.country_code}</dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Plan</dt>
            <dd className="text-white capitalize">{profile?.plan_id ?? 'starter'}</dd>
          </div>
        </dl>
      </div>

      {/* Formulario de filtros (client component) */}
      <SettingsForm initialFilters={filters} />
    </div>
  )
}
