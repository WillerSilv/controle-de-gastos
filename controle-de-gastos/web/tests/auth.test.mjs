import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { create, act } from 'react-test-renderer'
import { createServer } from 'vite'

test('login, troca de conta e recuperação de senha', async () => {
  process.env.VITE_SUPABASE_URL = 'https://example.supabase.co'
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'test'
  globalThis.window = { location: { hash: '' } }
  let callback
  let password
  globalThis.__controleGastosSupabase = { auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: (listener) => {
      callback = listener
      return { data: { listener: null, subscription: { unsubscribe() {} } } }
    },
    updateUser: async (data) => { password = data.password; return { error: null } },
  } }
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  let renderer
  try {
    const { default: Gate } = await server.ssrLoadModule('/src/components/AuthGate.jsx')
    let mounts = 0
    let unmounts = 0
    function Private({ user }) {
      React.useEffect(() => { mounts++; return () => { unmounts++ } }, [])
      return React.createElement('section', { id: 'private' }, user.id)
    }
    await act(async () => { renderer = create(React.createElement(Gate, null, React.createElement(Private))) })
    assert.equal(mounts, 0, 'não monta dados antes do login')
    await act(async () => callback('SIGNED_IN', { user: { id: 'A' } }))
    assert.equal(mounts, 1)
    await act(async () => callback('TOKEN_REFRESHED', { user: { id: 'A' } }))
    assert.equal(mounts, 1, 'renovar token não reinicia a tela')
    await act(async () => callback('SIGNED_IN', { user: { id: 'B' } }))
    assert.equal(mounts, 2)
    assert.equal(unmounts, 1, 'troca de usuário descarta o estado anterior')
    await act(async () => callback('SIGNED_OUT', null))
    assert.equal(unmounts, 2)
    await act(async () => callback('PASSWORD_RECOVERY', { user: { id: 'B' } }))
    assert.equal(renderer.root.findAllByType(Private).length, 0)
    const fields = renderer.root.findAllByType('input')
    await act(async () => {
      fields[0].props.onChange({ target: { value: 'nova-senha' } })
      fields[1].props.onChange({ target: { value: 'diferente' } })
    })
    await act(async () => renderer.root.findByType('form').props.onSubmit({ preventDefault() {} }))
    assert.equal(password, undefined, 'não salva senhas diferentes')
    await act(async () => fields[1].props.onChange({ target: { value: 'nova-senha' } }))
    await act(async () => renderer.root.findByType('form').props.onSubmit({ preventDefault() {} }))
    assert.equal(password, 'nova-senha')
    await act(async () => renderer.root.findByType('button').props.onClick())
    assert.equal(renderer.root.findByType(Private).props.user.id, 'B')
  } finally {
    if (renderer) await act(async () => renderer.unmount())
    await server.close()
    delete globalThis.__controleGastosSupabase
    delete globalThis.window
  }
})
