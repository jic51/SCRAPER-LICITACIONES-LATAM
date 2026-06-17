'use client'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

type F = { company_name: string; email: string; password: string }
type E = Partial<Record<keyof F, string>>

function validate(f: F): E {
  const e: E = {}
  if (!f.company_name.trim()) e.company_name = 'El nombre de empresa es requerido'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Correo electrónico inválido'
  if (f.password.length < 8) e.password = 'Mínimo 8 caracteres'
  return e
}

export default function SignupForm() {
  const [form, setForm] = useState<F>({ company_name: '', email: '', password: '' })
  const [errors, setErrors] = useState<E>({})
  const [touched, setTouched] = useState<Partial<Record<keyof F, boolean>>>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const touch = (field: keyof F) => {
    setTouched(t => ({ ...t, [field]: true }))
    setErrors(validate(form))
  }

  const change = (field: keyof F, value: string) => {
    const next = { ...form, [field]: value }
    setForm(next)
    if (touched[field]) setErrors(validate(next))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate(form)
    setErrors(errs)
    setTouched({ company_name: true, email: true, password: true })
    if (Object.keys(errs).length > 0) return
    setLoading(true)
    setServerError(null)
    const { error } = await createClient().auth.signUp({
      email: form.email, password: form.password,
      options: { data: { company_name: form.company_name } },
    })
    setLoading(false)
    if (error) {
      // Mostrar la causa real para poder diagnosticar (antes se ocultaba)
      console.error('Signup error:', error)
      const msg = (error.message || '').toLowerCase()
      if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already')) {
        setServerError('Este correo ya está registrado. Inicia sesión o usa otro correo.')
      } else if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('exceeded')) {
        setServerError('Demasiados intentos en poco tiempo. Espera unos minutos e inténtalo de nuevo.')
      } else if (msg.includes('database error') || msg.includes('saving new user')) {
        setServerError('Error de base de datos al crear el perfil (revisa el trigger). Detalle: ' + error.message)
      } else {
        setServerError('No se pudo crear la cuenta. Detalle: ' + error.message)
      }
      return
    }
    setSuccess(true)
  }

  if (success) return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6 text-center space-y-2">
        <h2 className="text-xl font-semibold">Revisa tu correo</h2>
        <p className="text-muted-foreground text-sm">
          Enviamos un enlace de verificación a <strong>{form.email}</strong>
        </p>
      </CardContent>
    </Card>
  )

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Crear cuenta</CardTitle>
        <CardDescription>Empieza a encontrar licitaciones relevantes</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          {([ ['company_name','Nombre de empresa','Constructora Ejemplo SA de CV','text'],
              ['email','Correo electrónico','contacto@empresa.com','email'],
              ['password','Contraseña','Mínimo 8 caracteres','password'],
          ] as [keyof F, string, string, string][]).map(([field, label, placeholder, type]) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={field}>{label}</Label>
              <div className="relative">
                <Input id={field}
                  type={field === 'password' && showPassword ? 'text' : type}
                  placeholder={placeholder}
                  className={field === 'password' ? 'pr-10' : undefined}
                  value={form[field]}
                  onChange={e => change(field, e.target.value)}
                  onBlur={() => touch(field)} />
                {field === 'password' && (
                  <button type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                )}
              </div>
              {touched[field] && errors[field] && (
                <p className="text-sm text-destructive">{errors[field]}</p>
              )}
            </div>
          ))}
          {serverError && <p className="text-sm text-destructive">{serverError}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <a href="/login" className="text-primary hover:underline">Inicia sesión</a>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
