import React, { useState, useRef } from 'react';

const hoje = () => { const d = new Date(); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; };
const vazio = { descricao: '', valor: '', categoria: 'Outros', pagamento: 'Pix', data_inicio: hoje(), data_fim: '', frequencia: 'mensal' };

export default function RecorrenciasView({ itens, config, onSalvar, onExcluir, onConfirmar, onAlternar }) {
  const bloqueio = useRef(false);
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  async function executar(acao) {
    if (bloqueio.current) return;
    bloqueio.current = true; setOcupado(true); setErro('');
    try { await acao(); } catch (e) { setErro(e.message || 'Falha ao conectar.'); }
    finally { bloqueio.current = false; setOcupado(false); }
  }

  const [form, setForm] = useState(vazio);
  const atualizar = (campo, valor) => setForm((atual) => ({ ...atual, [campo]: valor }));
  const enviar = async (e) => { e.preventDefault(); await onSalvar(form); setForm(vazio); };
  return <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <div><h2 style={title}>Despesas recorrentes</h2><p style={muted}>Cadastre contas periódicas e confirme cada ocorrência antes de contabilizá-la.</p></div>
    <p role="alert">{erro}</p><form className="surface-panel" onSubmit={(e) => { e.preventDefault(); executar(() => enviar(e)); }} style={formStyle}>
      {['descricao', 'valor', 'data_inicio', 'data_fim'].map((campo) => <label key={campo} style={label}>{campo === 'descricao' ? 'Descrição' : campo === 'valor' ? 'Valor' : campo === 'data_inicio' ? 'Data inicial' : 'Data final (opcional)'}<input type={campo === 'valor' ? 'number' : 'text'} min={campo === 'valor' ? '0.01' : undefined} step={campo === 'valor' ? '0.01' : undefined} value={form[campo]} onChange={(e) => atualizar(campo, e.target.value)} required={campo !== 'data_fim'} style={input} /></label>)}
      <label style={label}>Categoria<select value={form.categoria} onChange={(e) => atualizar('categoria', e.target.value)} style={input}>{config.categorias.map((c) => <option key={c}>{c}</option>)}</select></label>
      <label style={label}>Pagamento<select value={form.pagamento} onChange={(e) => atualizar('pagamento', e.target.value)} style={input}>{config.formas_pagamento.map((p) => <option key={p}>{p}</option>)}</select></label>
      <label style={label}>Frequência<select value={form.frequencia} onChange={(e) => atualizar('frequencia', e.target.value)} style={input}><option value="semanal">Semanal</option><option value="mensal">Mensal</option><option value="anual">Anual</option></select></label>
      <button disabled={ocupado} type="submit" style={button}>Adicionar recorrência</button>
    </form>
    <div className="surface-panel" style={{ padding: 20 }}>{itens.length === 0 ? <p style={muted}>Nenhuma recorrência cadastrada.</p> : itens.map((item) => <div key={item.id} style={row}><div><strong>{item.descricao}</strong><div style={muted}>{item.frequencia} · {item.data_inicio} · {item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div><div style={{ color: item.proxima_data ? 'var(--warning)' : 'var(--text-muted)', fontSize: 13 }}>{item.proxima_data ? `Próxima ocorrência: ${item.proxima_data}` : 'Sem ocorrência prevista'}</div></div><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button disabled={ocupado || !item.proxima_data} style={smallButton} onClick={() => executar(() => onConfirmar(item.id))} >Confirmar</button><button disabled={ocupado} style={smallButton} onClick={() => executar(() => onAlternar(item))}>{item.status === 'ativa' ? 'Pausar' : 'Reativar'}</button><button disabled={ocupado} style={{ ...smallButton, color: 'var(--danger)' }} onClick={() => executar(() => onExcluir(item.id))}>Excluir</button></div></div>)}</div>
  </div>;
}
const title = { fontSize: 24, fontWeight: 700, color: 'var(--text-main)' }; const muted = { color: 'var(--text-muted)', fontSize: 14 }; const label = { display: 'flex', flexDirection: 'column', gap: 6, color: 'var(--text-main)', fontSize: 13 }; const input = { padding: '10px 12px', borderRadius: 8, background: 'var(--bg-primary)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }; const formStyle = { padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, alignItems: 'end' }; const button = { ...input, background: 'var(--primary-strong)', border: 0, fontWeight: 600, cursor: 'pointer' }; const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }; const smallButton = { ...button, padding: '7px 10px', fontSize: 12 };
