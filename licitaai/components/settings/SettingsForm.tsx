'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { MEXICO_SECTORS, MEXICO_STATES, AMOUNT_PRESETS } from '@/lib/constants'
import type { UserFilters } from '@/lib/types'

type Props = { initialFilters: UserFilters }

export default function SettingsForm({ initialFilters }: Props) {
  const router = useRouter()
  const [filters, setFilters] = useState<UserFilters>(initialFilters)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggle = <K extends 'sectors' | 'states'>(key: K, val: string) =>
    setFilters(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val],
    }))

  const selectedPreset = AMOUNT_PRESETS.find(
    p => p.min === filters.min_amount && p.max === filters.max_amount
  )

  const addKeyword = () => {
    const kw = keyword.trim().toLowerCase()
    if (kw && !filters.keywords.includes(kw)) {
      setFilters(f => ({ ...f, keywords: [...f.keywords, kw] }))
    }
    setKeyword('')
  }

  const removeKeyword = (kw: string) =>
    setFilters(f => ({ ...f, keywords: f.keywords.filter(k => k !== kw) }))

  const save = async () => {
    setLoading(true)
    setSaved(false)
    setError(null)
    try {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { setError('Sesión expirada. Recarga la página.'); return }

      const { error: err } = await sb.from('user_filters').upsert({
        user_id: user.id,
        sectors: filters.sectors,
        states: filters.states,
        min_amount: filters.min_amount,
        max_amount: filters.max_amount,
        keywords: filters.keywords,
      })
      if (err) throw err

      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : JSON.stringify(e)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Sectores */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="font-semibold mb-1 text-slate-200">Sectores de tu empresa</h2>
        <p className="text-slate-500 text-xs mb-4">Selecciona todos los que apliquen.</p>
        <div className="grid grid-cols-2 gap-2">
          {MEXICO_SECTORS.map(s => {
            const active = filters.sectors.includes(s.id)
            return (
              <button
                key={s.id}
                onClick={() => toggle('sectors', s.id)}
                className={`text-left px-3 py-2.5 rounded-lg text-sm border transition-colors ${
                  active
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                {active ? '✓ ' : ''}{s.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Estados */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="font-semibold mb-1 text-slate-200">Estados de interés</h2>
        <p className="text-slate-500 text-xs mb-4">Deja vacío para ver todos los estados.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
          {MEXICO_STATES.map(s => {
            const active = filters.states.includes(s)
            return (
              <button
                key={s}
                onClick={() => toggle('states', s)}
                className={`text-left px-3 py-2 rounded-lg text-sm border transition-colors ${
                  active
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                {active ? '✓ ' : ''}{s}
              </button>
            )
          })}
        </div>
        {filters.states.length > 0 && (
          <button
            onClick={() => setFilters(f => ({ ...f, states: [] }))}
            className="mt-3 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Deseleccionar todos ({filters.states.length})
          </button>
        )}
      </div>

      {/* Monto */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="font-semibold mb-1 text-slate-200">Rango de monto</h2>
        <p className="text-slate-500 text-xs mb-4">Solo licitaciones dentro de este rango.</p>
        <div className="space-y-2">
          {AMOUNT_PRESETS.map(p => {
            const active = p.min === filters.min_amount && p.max === filters.max_amount
            return (
              <button
                key={p.label}
                onClick={() => setFilters(f => ({ ...f, min_amount: p.min, max_amount: p.max }))}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm border transition-colors ${
                  active
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                {active ? '● ' : '○ '}{p.label}
              </button>
            )
          })}
          {!selectedPreset && (
            <p className="text-xs text-slate-500 mt-2">
              Rango personalizado activo: ${filters.min_amount.toLocaleString()} – ${filters.max_amount.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Palabras clave */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="font-semibold mb-1 text-slate-200">Palabras clave</h2>
        <p className="text-slate-500 text-xs mb-4">
          Términos específicos que aparecen en las licitaciones que te interesan.
        </p>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addKeyword()}
            placeholder="Ej: mantenimiento, servidor, auditoría..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <Button
            size="sm"
            onClick={addKeyword}
            disabled={!keyword.trim()}
            className="shrink-0"
          >
            Agregar
          </Button>
        </div>
        {filters.keywords.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {filters.keywords.map(kw => (
              <span
                key={kw}
                className="inline-flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-slate-300 text-sm px-3 py-1 rounded-full"
              >
                {kw}
                <button
                  onClick={() => removeKeyword(kw)}
                  className="text-slate-500 hover:text-red-400 transition-colors leading-none"
                  aria-label={`Eliminar "${kw}"`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-slate-600 text-xs">Sin palabras clave — se muestran todas las licitaciones.</p>
        )}
      </div>

      {/* Guardar */}
      <div className="flex items-center gap-4">
        <Button onClick={save} disabled={loading} className="px-8">
          {loading ? 'Guardando…' : 'Guardar cambios'}
        </Button>
        {saved && <span className="text-green-400 text-sm">✓ Cambios guardados</span>}
        {error && <span className="text-red-400 text-sm">{error}</span>}
      </div>
    </div>
  )
}
