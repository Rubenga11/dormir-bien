'use client'
// app/admin/login/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiUrl } from '@/lib/api'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    if (!password) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch(apiUrl('/api/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.token) localStorage.setItem('breathe-admin-token', data.token)
        router.push('/admin/dashboard')
      } else {
        setError('Contraseña incorrecta')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="stars-bg" />
      <div className="aurora-bg">
        <div className="aurora-blob a1" />
        <div className="aurora-blob a2" />
      </div>
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <div className="glass-card w-full max-w-sm p-10 text-center">
          <h3 className="font-serif font-light text-moon text-3xl mb-1">Panel Admin</h3>
          <p className="text-[0.58rem] text-lavender tracking-widest mb-8">
            acceso restringido · breathe analytics
          </p>

          <div className="mb-4 text-left">
            <label className="block text-[0.58rem] tracking-widest uppercase text-lavender mb-2">
              Contraseña
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-400/70 text-[0.62rem] tracking-wider mb-4">{error}</p>
          )}

          <button
            className="btn-primary w-full mt-2"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Verificando…' : 'Entrar'}
          </button>
        </div>
      </div>
    </>
  )
}
