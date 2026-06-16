'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function AppShell({ children, companyName }: { children: React.ReactNode; companyName: string }) {
  const router = useRouter()
  const signOut = async () => {
    await createClient().auth.signOut()
    router.push('/login'); router.refresh()
  }
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg">🏛 LicitaAI</span>
          <span className="text-slate-500 text-sm hidden md:inline">|</span>
          <span className="text-slate-400 text-sm hidden md:inline">{companyName}</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="/settings" className="text-slate-400 hover:text-white text-sm transition-colors">Configuración</a>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-slate-400">Salir</Button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
