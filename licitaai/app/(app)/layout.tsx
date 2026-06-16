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
