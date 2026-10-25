import { supabase } from './supabase'

export async function entrar(email, senha) {
  if (!supabase) throw new Error('Supabase não configurado')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
  if (error) throw error
  return data
}

export async function cadastrar(email, senha) {
  if (!supabase) throw new Error('Supabase não configurado')
  const { data, error } = await supabase.auth.signUp({ email, password: senha })
  if (error) throw error
  return data
}

export async function sair() {
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function recuperarSenha(email) {
  if (!supabase) throw new Error('Supabase não configurado')
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: window.location.origin,
  })
  if (error) throw error
}

export async function usuarioAtual() {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data.user
}
