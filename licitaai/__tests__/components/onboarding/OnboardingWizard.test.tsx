import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: () => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  }),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

describe('OnboardingWizard', () => {
  it('muestra paso 1 al inicio', () => {
    render(<OnboardingWizard />)
    expect(screen.getByText(/paso 1 de 3/i)).toBeInTheDocument()
    expect(screen.getByText(/en qué sectores/i)).toBeInTheDocument()
  })

  it('avanza al paso 2 al clicar Siguiente', async () => {
    render(<OnboardingWizard />)
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(screen.getByText(/paso 2 de 3/i)).toBeInTheDocument()
    expect(screen.getByText(/en qué estados/i)).toBeInTheDocument()
  })

  it('regresa al paso 1 al clicar Atrás desde paso 2', async () => {
    render(<OnboardingWizard />)
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    await userEvent.click(screen.getByRole('button', { name: /atrás/i }))
    expect(screen.getByText(/paso 1 de 3/i)).toBeInTheDocument()
  })
})
