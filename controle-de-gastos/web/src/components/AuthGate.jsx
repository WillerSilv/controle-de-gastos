import { cloneElement, useEffect, useState } from 'react'
import Login from './Login'
import { supabase } from '../lib/supabase'

export default function AuthGate({ children }) {
  const [sessao, setSessao] = useState(undefined)

  useEffect(() => {
    if (!supabase) {
      setSessao(null)
      return undefined
    }
    supabase.auth.getSession().then(({ data }) => setSessao(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSessao(session))
    return () => listener.subscription.unsubscribe()
  }, [])

  if (sessao === undefined) {
    return <main className="auth-loading" aria-live="polite">Carregando sua conta...</main>
  }
  if (!sessao) return <Login onAuthenticated={(user) => setSessao({ user })} />
  return cloneElement(children, { user: sessao.user })
}
