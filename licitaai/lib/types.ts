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
  published_at: string | null
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
