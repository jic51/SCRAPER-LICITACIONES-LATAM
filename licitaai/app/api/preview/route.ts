import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { estimateMatchScore } from '@/lib/filters'
import type { Licitacion, UserFilters } from '@/lib/types'

// Devuelve un "teaser" de licitaciones para visitantes SIN cuenta.
// Usa la llave de servicio en el servidor (nunca se expone al navegador) y
// solo regresa el total y las 3 mejores coincidencias; el resto queda detrás
// del registro.
export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor.' },
      { status: 500 }
    )
  }

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* body vacío */ }

  const country = typeof body.country === 'string' ? body.country : 'MX'
  const sectors = Array.isArray(body.sectors) ? (body.sectors as string[]) : []
  const min_amount = typeof body.min_amount === 'number' ? body.min_amount : 0
  const max_amount = typeof body.max_amount === 'number' ? body.max_amount : 999_999_999

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

  const { data, error } = await supabase
    .from('licitaciones')
    .select('id, title, agency, sector, state, amount, deadline')
    .eq('country_code', country)
    .limit(100)

  if (error) {
    return NextResponse.json({ error: 'No se pudo consultar licitaciones.' }, { status: 500 })
  }

  const filters: UserFilters = { sectors, states: [], min_amount, max_amount, keywords: [] }

  const scored = (data ?? [])
    .map((l) => ({
      id: l.id as string,
      title: l.title as string,
      agency: l.agency as string | null,
      amount: l.amount as number | null,
      deadline: l.deadline as string | null,
      score: estimateMatchScore(l as unknown as Licitacion, filters),
    }))
    .sort((a, b) => b.score - a.score)

  return NextResponse.json({
    total: scored.length,
    high: scored.filter((s) => s.score >= 70).length,
    sample: scored.slice(0, 3),
  })
}
