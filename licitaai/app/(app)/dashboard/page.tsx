import { getScoreColor, formatAmount, getDaysUntilDeadline } from '@/lib/filters'

export const metadata = { title: 'Dashboard — LicitaAI' }

// TODO: replace with real Supabase data in Plan B
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
