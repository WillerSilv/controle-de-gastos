import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function NovaSenha({ onConcluido }) {
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [concluido, setConcluido] = useState(false)

  async function salvar(event) {
    event.preventDefault()
    if (salvando) return
    if (senha !== confirmacao) {
      setMensagem('As senhas precisam ser iguais.')
      return
    }
    setSalvando(true)
    setMensagem('')
    try {
      const { error } = await supabase.auth.updateUser({ password: senha })
      if (error) throw error
      setSenha('')
      setConfirmacao('')
      setConcluido(true)
    } catch (error) {
      setMensagem(error.message || 'Não foi possível salvar a nova senha.')
    } finally {
      setSalvando(false)
    }
  }

  return <main className="login-page">
    <form className="login-card" onSubmit={salvar}>
      <h1>{concluido ? 'Senha atualizada' : 'Crie uma nova senha'}</h1>
      {concluido ? <>
        <p role="status">Sua nova senha foi salva.</p>
        <button type="button" onClick={onConcluido}>Continuar</button>
      </> : <>
        <p>Use pelo menos 6 caracteres.</p>
        <input aria-label="Nova senha" placeholder="Nova senha" type="password" autoComplete="new-password" minLength={6} required value={senha} onChange={(e) => setSenha(e.target.value)} disabled={salvando} />
        <input aria-label="Confirme a nova senha" placeholder="Confirme a nova senha" type="password" autoComplete="new-password" minLength={6} required value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} disabled={salvando} />
        {mensagem && <p role="alert">{mensagem}</p>}
        <button disabled={salvando} type="submit">{salvando ? 'Salvando...' : 'Salvar nova senha'}</button>
      </>}
    </form>
  </main>
}
