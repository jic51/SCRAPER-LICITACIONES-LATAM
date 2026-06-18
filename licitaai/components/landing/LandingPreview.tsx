'use client'

import { useState } from 'react'
import { Search, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { COUNTRIES, MEXICO_SECTORS, AMOUNT_PRESETS } from '@/lib/constants'
import { getScoreColor, formatAmount, getDaysUntilDeadline } from '@/lib/filters'

type SampleItem = {
  id: string
  title: string
  agency: string | null
  amount: number | null
  deadline: string | null
  score: number
}
type PreviewResult = { total: number; high: number; sample: SampleItem[] }

const scoreText = { green: 'text-green-600', yellow: 'text-amber-600', red: 'text-red-500' }

export default function LandingPreview() {
  const [country, setCountry] = useState('MX')
  const [sectors, setSectors] = useState<string[]>([])
  const [amountIdx, setAmountIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PreviewResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selected = COUNTRIES.find((c) => c.code === country)
  const available = selected?.status === 'available'

  const toggleSector = (id: string) =>
    setSectors((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const search = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const preset = AMOUNT_PRESETS[amountIdx]
      const res = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country, sectors, min_amount: preset.min, max_amount: preset.max,
        }),
      })
      if (!res.ok) throw new Error('request')
      setResult(await res.json())
    } catch {
      setError('No pudimos cargar el preview. Intenta de nuevo en un momento.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="probar" className="max-w-5xl mx-auto px-6 py-20">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-blue-600 font-semibold text-sm uppercase tracking-wide">Pruébalo ahora</span>
        <h2 className="text-3xl font-bold mt-3 mb-3">Mira tus licitaciones antes de registrarte</h2>
        <p className="text-slate-600">
          Elige tu país y lo que buscas. Te mostramos al instante cuántas oportunidades hay para ti
          —sin crear cuenta.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
        {/* País */}
        <label className="block text-sm font-medium text-slate-700 mb-2">País</label>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              onClick={() => { setCountry(c.code); setResult(null) }}
              className={`rounded-xl border p-3 text-left transition-all ${
                country === c.code ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-xl">{c.flag}</div>
              <div className="font-medium text-slate-900 text-sm mt-1">{c.name}</div>
              <span className={`text-xs ${c.status === 'available' ? 'text-green-600' : 'text-slate-400'}`}>
                {c.status === 'available' ? 'Disponible' : 'Próximamente'}
              </span>
            </button>
          ))}
        </div>

        {/* Sectores */}
        <label className="block text-sm font-medium text-slate-700 mb-2">¿Qué sectores? (opcional)</label>
        <div className="flex flex-wrap gap-2 mb-6">
          {MEXICO_SECTORS.filter((s) => s.id !== 'otro').map((s) => (
            <button
              key={s.id}
              onClick={() => toggleSector(s.id)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                sectors.includes(s.id)
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-slate-300 text-slate-600 hover:border-slate-400'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Monto */}
        <label className="block text-sm font-medium text-slate-700 mb-2">Rango de monto</label>
        <select
          value={amountIdx}
          onChange={(e) => setAmountIdx(Number(e.target.value))}
          className="w-full sm:w-auto border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 mb-6"
        >
          {AMOUNT_PRESETS.map((p, idx) => (
            <option key={p.label} value={idx}>{p.label}</option>
          ))}
        </select>

        {/* Acción */}
        <div>
          {available ? (
            <button
              onClick={search}
              disabled={loading}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-7 py-3 rounded-lg transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading ? 'Buscando...' : 'Buscar licitaciones'}
            </button>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              Aún no estamos en {selected?.name}. Déjanos tu correo y te avisamos en cuanto abramos.{' '}
              <a href="/signup" className="font-medium underline underline-offset-2">Avísame</a>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-500 mt-4">{error}</p>}

        {/* Resultados */}
        {result && (
          <div className="mt-8 border-t border-slate-100 pt-6">
            {result.total === 0 ? (
              <div className="text-center py-6">
                <p className="font-medium text-slate-900 mb-1">Aún no hay coincidencias con esos filtros</p>
                <p className="text-slate-600 text-sm mb-4">
                  Llegan licitaciones nuevas cada día. Crea tu cuenta y te avisamos en cuanto aparezca una para ti.
                </p>
                <a href="/signup" className="text-blue-600 font-medium hover:underline">Crear cuenta gratis →</a>
              </div>
            ) : (
              <>
                <p className="font-semibold text-slate-900 mb-4">
                  🎯 Encontramos <span className="text-blue-600">{result.total}</span> licitaciones para ti
                  {result.high > 0 && <> · <span className="text-green-600">{result.high} de alta compatibilidad</span></>}
                </p>
                <div className="space-y-3">
                  {result.sample.map((l) => {
                    const color = getScoreColor(l.score)
                    const days = getDaysUntilDeadline(l.deadline)
                    return (
                      <div key={l.id} className="flex items-center gap-4 border border-slate-200 rounded-xl p-4">
                        <span className={`text-xl font-bold w-12 shrink-0 ${scoreText[color]}`}>{l.score}%</span>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 text-sm truncate">{l.title}</p>
                          <p className="text-slate-500 text-xs mt-0.5">
                            {l.agency ? `${l.agency} · ` : ''}{formatAmount(l.amount)}
                            {days !== null ? ` · Vence en ${days} días` : ''}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {result.total > result.sample.length && (
                  <div className="mt-4 relative">
                    <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50">
                      <Lock className="h-5 w-5 text-slate-400 mx-auto mb-2" />
                      <p className="font-medium text-slate-900 mb-1">
                        {result.total - result.sample.length} licitaciones más te esperan
                      </p>
                      <p className="text-slate-600 text-sm mb-4">
                        Crea tu cuenta gratis para verlas todas, guardar tus filtros y recibir alertas por WhatsApp.
                      </p>
                      <a href="/signup" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2">
                        Desbloquear gratis <ArrowRight className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
