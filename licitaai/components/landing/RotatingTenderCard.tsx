'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'

type Tender = {
  portal: string
  country: string
  title: string
  tags: string[]
  deadline: string
  score: number
}

// Ejemplos ilustrativos por país. Cuando exista el feed real,
// esta lista se puede alimentar desde la base de datos.
const TENDERS: Tender[] = [
  {
    portal: 'CompraNet · México',
    country: 'México',
    title: 'Servicio de mantenimiento de áreas verdes — Municipio de Guadalajara',
    tags: ['Jalisco', '$1.8M MXN', 'Mantenimiento'],
    deadline: 'Cierra en 6 días',
    score: 92,
  },
  {
    portal: 'SECOP II · Colombia',
    country: 'Colombia',
    title: 'Suministro de equipos de cómputo — Alcaldía de Medellín',
    tags: ['Antioquia', '$620M COP', 'Tecnología'],
    deadline: 'Cierra en 9 días',
    score: 88,
  },
  {
    portal: 'ChileCompra · Chile',
    country: 'Chile',
    title: 'Servicio de aseo y mantención de edificios — Municipalidad de Providencia',
    tags: ['Santiago', '$95M CLP', 'Limpieza'],
    deadline: 'Cierra en 4 días',
    score: 90,
  },
  {
    portal: 'SEACE · Perú',
    country: 'Perú',
    title: 'Adquisición de mobiliario escolar — Gobierno Regional de Arequipa',
    tags: ['Arequipa', 'S/ 480K', 'Educación'],
    deadline: 'Cierra en 7 días',
    score: 74,
  },
]

function scoreColor(score: number) {
  if (score >= 80) return { ring: '#16a34a', text: 'text-green-600', label: 'Alta compatibilidad' }
  if (score >= 60) return { ring: '#d97706', text: 'text-amber-600', label: 'Compatibilidad media' }
  return { ring: '#dc2626', text: 'text-red-600', label: 'Compatibilidad baja' }
}

export default function RotatingTenderCard() {
  const [i, setI] = useState(0)
  const [show, setShow] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setShow(false)
      setTimeout(() => {
        setI((prev) => (prev + 1) % TENDERS.length)
        setShow(true)
      }, 350)
    }, 6000)
    return () => clearInterval(id)
  }, [])

  const t = TENDERS[i]
  const c = scoreColor(t.score)

  return (
    <div className="relative">
      <div
        className={`bg-white border border-slate-200 rounded-2xl shadow-xl p-6 max-w-md mx-auto transition-opacity duration-300 ${
          show ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-3 py-1">{t.portal}</span>
          <span className="text-xs text-amber-600 font-medium">{t.deadline}</span>
        </div>
        <h3 className="font-semibold text-slate-900 leading-snug mb-3 min-h-[3.5rem]">{t.title}</h3>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-5">
          {t.tags.map((tag) => (
            <span key={tag} className="bg-slate-100 rounded px-2 py-1">{tag}</span>
          ))}
        </div>
        <div className="flex items-center gap-4 border-t border-slate-100 pt-4">
          <div
            className="relative w-16 h-16 shrink-0 rounded-full"
            style={{ background: `conic-gradient(${c.ring} ${t.score}%, #e2e8f0 0)` }}
          >
            <div className="absolute inset-[5px] rounded-full bg-white flex items-center justify-center">
              <span className="text-base font-bold" style={{ color: c.ring }}>{t.score}%</span>
            </div>
          </div>
          <div>
            <p className={`font-semibold text-sm ${c.text}`}>{c.label}</p>
            <p className="text-slate-500 text-xs">Coincide con tu sector y tu rango de monto.</p>
          </div>
        </div>
      </div>

      {/* indicadores de país */}
      <div className="flex justify-center gap-1.5 mt-4">
        {TENDERS.map((tender, idx) => (
          <span
            key={tender.country}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === i ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-300'
            }`}
          />
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-4 max-w-xs absolute -bottom-2 -left-2 hidden sm:flex items-center gap-3">
        <Bell className="h-5 w-5 text-blue-600 shrink-0" />
        <p className="text-xs text-slate-600">Te avisamos por WhatsApp cuando aparece una oportunidad así.</p>
      </div>
    </div>
  )
}
