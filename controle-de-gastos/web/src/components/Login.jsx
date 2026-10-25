import { useState } from 'react'
import { cadastrar, entrar, recuperarSenha } from '../lib/auth'

export default function Login({ onAuthenticated }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [modoCadastro, setModoCadastro] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function enviar(event) {
    event.preventDefault()
    setMensagem('')
    setCarregando(true)
    try {
      const resultado = modoCadastro ? await cadastrar(email.trim(), senha) : await entrar(email.trim(), senha)
      if (modoCadastro && !resultado.session) {
        setMensagem('Cadastro realizado. Verifique seu e-mail para confirmar a conta.')
      } else {
        onAuthenticated?.(resultado.user)
      }
    } catch (error) {
      setMensagem(error.message || 'Não foi possível concluir a operação.')
    } finally {
      setCarregando(false)
    }
  }

  async function esquecerSenha() {
    if (!email.trim()) {
      setMensagem('Digite seu e-mail para receber o link de recuperação.')
      return
    }
    setCarregando(true)
    setMensagem('')
    try {
      await recuperarSenha(email)
      setMensagem('Link de recuperação enviado. Verifique seu e-mail.')
    } catch (error) {
      setMensagem(error.message || 'Não foi possível enviar o link de recuperação.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={enviar}>
        <h1>Controle de Gastos</h1>
        <p>{modoCadastro ? 'Crie sua conta' : 'Entre na sua conta'}</p>
        <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} minLength={6} required />
        <button type="submit" disabled={carregando}>{carregando ? 'Aguarde...' : modoCadastro ? 'Criar conta' : 'Entrar'}</button>
        {mensagem && <p role="status">{mensagem}</p>}
        {!modoCadastro && <button type="button" onClick={esquecerSenha} disabled={carregando}>Esqueci minha senha</button>}
        <button type="button" onClick={() => setModoCadastro((valor) => !valor)}>
          {modoCadastro ? 'Já tenho uma conta' : 'Criar uma conta'}
        </button>
      </form>
    </main>
  )
}
