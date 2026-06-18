'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  MEXICO_SECTORS, AMOUNT_PRESETS, COUNTRIES, STATES_BY_COUNTRY,
} from '@/lib/constants'

type State = { country: string; sectors: string[]; states: string[]; min_amount: number; max_amount: number }

const TOTAL_STEPS = 4

export default function OnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<State>({
    country: 'MX', sectors: [], states: [], min_amount: 0, max_amount: 999_999_999,
  })

  const toggle = <K extends 'sectors' | 'states'>(key: K, val: string) =>
    setData(d => ({ ...d, [key]: d[key].includes(val) ? d[key].filter(x => x !== val) : [...d[key], val] }))

  const selectedCountry = COUNTRIES.find(c => c.code === data.country)
  const countryStates = STATES_BY_COUNTRY[data.country] ?? []
  const countryName = selectedCountry?.name ?? ''
  // No se puede avanzar si el país elegido aún no está disponible
  const canAdvanceCountry = selectedCountry?.status === 'available'

  const finish = async () => {
    setLoading(true)
    setError(null)
    try {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) {
        setError('Tu sesión expiró. Por favor recarga la página.')
        setLoading(false)
        return
      }
      const { error: filterError } = await sb.from('user_filters').upsert({
        user_id: user.id,
        sectors: data.sectors,
        states: data.states,
        min_amount: data.min_amount,
        max_amount: data.max_amount,
        keywords: [],
      }, { onConflict: 'user_id' })
      if (filterError) throw filterError
      const { error: profileError } = await sb.from('users')
        .update({ onboarding_completed: true, country_code: data.country })
        .eq('id', user.id)
      if (profileError) throw profileError
      router.push('/dashboard')
    } catch (e) {
      // Mostrar la causa real para poder diagnosticar (antes se ocultaba)
      console.error('Onboarding save error:', e)
      const msg = e instanceof Error ? e.message : 'Error desconocido'
      setError('No se pudo guardar la configuración. Detalle: ' + msg)
      setLoading(false)
    }
  }

  const btnBase = 'rounded-lg border text-sm transition-all px-4 py-2'
  const active = 'bg-blue-600 border-blue-500 text-white'
  const inactive = 'border-slate-700 text-slate-300 hover:border-slate-500'

  const nextDisabled = step === 1 && !canAdvanceCountry

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 rounded-xl p-8 border border-slate-800">
        <p className="text-slate-400 text-sm mb-2">Paso {step} de {TOTAL_STEPS}</p>
        <div className="w-full bg-slate-800 rounded-full h-1.5 mb-8">
          <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>

        {step === 1 && (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">¿En qué país buscas licitaciones?</h2>
            <p className="text-slate-400 mb-6">Empieza por un país. Pronto podrás agregar más desde tu configuración.</p>
            <div className="grid sm:grid-cols-3 gap-3">
              {COUNTRIES.map(c => {
                const isSel = data.country === c.code
                const isSoon = c.status === 'soon'
                return (
                  <button
                    key={c.code}
                    onClick={() => setData(d => ({ ...d, country: c.code }))}
                    className={`text-left rounded-xl border p-4 transition-all ${
                      isSel
                        ? 'border-blue-500 bg-blue-600/10'
                        : 'border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <div className="text-2xl mb-1">{c.flag}</div>
                    <div className="font-medium text-white">{c.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{c.portal}</div>
                    {isSoon
                      ? <span className="inline-block mt-2 text-xs text-slate-400 bg-slate-800 rounded-full px-2 py-0.5">Próximamente</span>
                      : <span className="inline-block mt-2 text-xs text-green-400 bg-green-500/10 rounded-full px-2 py-0.5">Disponible</span>}
                  </button>
                )
              })}
            </div>
            {!canAdvanceCountry && (
              <p className="text-sm text-amber-400 mt-4">
                Aún no estamos en {countryName}. Mientras tanto, elige México para empezar — te
                avisaremos en cuanto abramos {countryName}.
              </p>
            )}
          </>
        )}

        {step === 2 && (
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

        {step === 3 && (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">¿En qué estados de {countryName} opera tu empresa?</h2>
            <p className="text-slate-400 mb-6">Selecciona todos donde puedas ejecutar contratos.</p>
            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
              {countryStates.map(s => (
                <button key={s} onClick={() => toggle('states', s)}
                  className={`${btnBase} px-3 py-1.5 ${data.states.includes(s) ? active : inactive}`}>
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
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

        {error && <p className="text-sm text-red-400 mt-4 text-center">{error}</p>}

        <div className="flex justify-between mt-10">
          <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 1} className="text-slate-400">
            Atrás
          </Button>
          {step < TOTAL_STEPS
            ? <Button onClick={() => setStep(s => s + 1)} disabled={nextDisabled}>Siguiente</Button>
            : <Button onClick={finish} disabled={loading}>{loading ? 'Guardando...' : 'Ir al Dashboard'}</Button>
          }
        </div>
      </div>
    </div>
  )
}
