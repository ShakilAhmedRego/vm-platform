'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/dashboard/dealflow')
    })
  }, [router])

  const missingEnv =
    !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    router.push('/dashboard/dealflow')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-[min(420px,calc(100vw-24px))] bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gray-900" />
          <div>
            <div className="text-lg font-semibold text-gray-900">VerifiedMeasure</div>
            <div className="text-xs text-gray-500">Sign in to continue</div>
          </div>
        </div>

        {missingEnv && (
          <div className="mt-4 text-xs text-red-600">
            Missing env vars: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div>
            <label className="text-xs text-gray-600">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-gray-200 text-sm outline-none"
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-600">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-gray-200 text-sm outline-none"
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 px-3 py-2 rounded-md bg-gray-900 text-white text-sm font-medium disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-4 text-xs text-gray-500">
          If login broke after redeploy: re-check Vercel env vars + Supabase project URL/key.
        </div>
      </div>
    </div>
  )
}
