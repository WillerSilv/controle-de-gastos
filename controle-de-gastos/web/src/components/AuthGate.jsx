import { cloneElement, useEffect, useState } from 'react'
import Login from './Login'
import NovaSenha from './NovaSenha'
import { supabase } from '../lib/supabase'

export default function AuthGate({ children }) {
  const [sessao, setSessao] = useState(undefined)
  const [recuperando, setRecuperando] = useState(() =>
    new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery')

  useEffect(() => {
    if (!supabase) {
      setSessao(null)
      return undefined
    }
    let ativo = true
    let recebeuEvento = false
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!ativo) return
      recebeuEvento = true
      if (event === 'PASSWORD_RECOVERY') setRecuperando(true)
      if (!session) setRecuperando(false)
      setSessao(session)
    })
    supabase.auth.getSession().then(({ data, error }) => {
      if (ativo && !recebeuEvento) setSessao(error ? null : data.session)
    }).catch(() => {
      if (ativo && !recebeuEvento) setSessao(null)
    })
    return () => { ativo = false; listener.subscription.unsubscribe() }
  }, [])

  if (sessao === undefined) {
    return <main className="auth-loading" aria-live="polite">Carregando sua conta...</main>
  }
  if (!sessao) return <Login />
  if (recuperando) return <NovaSenha onConcluido={() => setRecuperando(false)} />
  return cloneElement(children, { key: sessao.user.id, user: sessao.user })
}
