import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignupForm from '@/components/auth/SignupForm'

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signUp: vi.fn().mockResolvedValue({ error: null }) },
  }),
}))

describe('SignupForm', () => {
  it('muestra los 3 campos requeridos', () => {
    render(<SignupForm />)
    expect(screen.getByLabelText(/nombre de empresa/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
  })

  it('muestra error con email inválido', async () => {
    render(<SignupForm />)
    await userEvent.type(screen.getByLabelText(/correo electrónico/i), 'no-es-email')
    fireEvent.blur(screen.getByLabelText(/correo electrónico/i))
    await waitFor(() =>
      expect(screen.getByText(/correo electrónico inválido/i)).toBeInTheDocument()
    )
  })

  it('muestra error con contraseña muy corta', async () => {
    render(<SignupForm />)
    await userEvent.type(screen.getByLabelText(/contraseña/i), '123')
    fireEvent.blur(screen.getByLabelText(/contraseña/i))
    await waitFor(() =>
      expect(screen.getByText(/mínimo 8 caracteres/i)).toBeInTheDocument()
    )
  })
})
