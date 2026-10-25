import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Edit2, Plus, Save, Trash2 } from 'lucide-react';

const moeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor) || 0);
const statusConfig = {
  normal: { label: 'Dentro do limite', color: '#10b981' },
  alerta: { label: 'Próximo do limite', color: '#f59e0b' },
  excedido: { label: 'Limite excedido', color: '#ef4444' },
};

export default function OrcamentoView({ orcamentoInfo, resumo, mesSelecionado, orcamentosCategoria, onSalvarOrcamento, onSalvarOrcamentoCategoria, onExcluirOrcamentoCategoria }) {
  const [valor, setValor] = useState('');
  const [alerta, setAlerta] = useState('80');
  const [salvando, setSalvando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [categoria, setCategoria] = useState('');
  const [valorCategoria, setValorCategoria] = useState('');
  const [alertaCategoria, setAlertaCategoria] = useState('80');

  useEffect(() => {
    setValor(orcamentoInfo?.orcamento ? String(orcamentoInfo.orcamento) : '');
    setAlerta(orcamentoInfo?.alerta ? String(Math.round(orcamentoInfo.alerta * 100)) : '80');
  }, [orcamentoInfo]);

  const percentualGlobal = useMemo(() => {
    const limite = Number(orcamentoInfo?.orcamento) || 0;
    return limite ? ((Number(resumo?.relatorio?.total_gastos) || 0) / limite) * 100 : 0;
  }, [orcamentoInfo, resumo]);
  const itens = orcamentosCategoria?.itens || [];
  const total = orcamentosCategoria?.limite_total || 0;
  const gastoTotal = orcamentosCategoria?.gasto_total || 0;
  const percentualTotal = total ? Math.min((gastoTotal / total) * 100, 100) : 0;

  const limparEdicao = () => { setEditando(null); setCategoria(''); setValorCategoria(''); setAlertaCategoria('80'); };
  const iniciarEdicao = (item) => { setEditando(item); setCategoria(item.categoria); setValorCategoria(String(item.valor)); setAlertaCategoria(String(Math.round(item.alerta * 100))); };
  const salvarGlobal = async (event) => { event.preventDefault(); setSalvando(true); try { await onSalvarOrcamento(Number(valor), Number(alerta) / 100); } finally { setSalvando(false); } };
  const salvarCategoria = async (event) => { event.preventDefault(); await onSalvarOrcamentoCategoria({ ...(editando ? { id: editando.id } : {}), mes: mesSelecionado, categoria, valor: Number(valorCategoria), alerta: Number(alertaCategoria) / 100 }); limparEdicao(); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in">
      <div><h2 style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc' }}>Orçamento</h2><p style={{ fontSize: '14px', color: '#94a3b8' }}>Configurações e limites de {mesSelecionado || 'mês selecionado'}.</p></div>
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 18px', color: '#f8fafc' }}>Orçamento mensal geral</h3>
        <form onSubmit={salvarGlobal} className="orcamento-form" style={formGrid}>
          <label style={labelStyle}>Limite mensal<input type="number" min="0.01" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} required style={inputStyle} /></label>
          <label style={labelStyle}>Alerta (%)<input type="number" min="1" max="99" step="1" value={alerta} onChange={(e) => setAlerta(e.target.value)} required style={inputStyle} /></label>
          <button type="submit" disabled={salvando} style={buttonStyle}><Save size={16} /> {salvando ? 'Salvando...' : 'Salvar'}</button>
        </form>
        {Number(orcamentoInfo?.orcamento) > 0 && <div style={{ marginTop: '20px' }}><div style={summaryLine}><span>Uso no mês</span><strong style={{ color: percentualGlobal >= 100 ? '#ef4444' : '#f8fafc' }}>{percentualGlobal.toFixed(0)}%</strong></div><div style={trackStyle}><div style={{ ...fillStyle, width: `${Math.min(percentualGlobal, 100)}%`, background: percentualGlobal >= 100 ? '#ef4444' : percentualGlobal >= Number(alerta) ? '#f59e0b' : '#6366f1' }} /></div></div>}
      </div>
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={summaryLine}><div><h3 style={{ margin: 0, color: '#f8fafc' }}>Limites por categoria</h3><p style={{ color: '#94a3b8', fontSize: '13px', margin: '6px 0 0' }}>Cada categoria pode ter um limite próprio.</p></div><div style={{ color: '#cbd5e1', fontSize: '13px' }}>{moeda(gastoTotal)} de {moeda(total)} usados</div></div>
        <div style={trackStyle}><div style={{ ...fillStyle, width: `${percentualTotal}%`, background: percentualTotal >= 100 ? '#ef4444' : '#6366f1' }} /></div>
        <form onSubmit={salvarCategoria} className="orcamento-categoria-form" style={categoryGrid}>
          <label style={labelStyle}>Categoria<select value={categoria} onChange={(e) => setCategoria(e.target.value)} required style={inputStyle}><option value="">Selecione</option>{['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Educação', 'Outros'].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label style={labelStyle}>Limite<input type="number" min="0.01" step="0.01" value={valorCategoria} onChange={(e) => setValorCategoria(e.target.value)} required style={inputStyle} /></label>
          <label style={labelStyle}>Alerta (%)<input type="number" min="1" max="99" value={alertaCategoria} onChange={(e) => setAlertaCategoria(e.target.value)} required style={inputStyle} /></label>
          <div style={{ display: 'flex', gap: '8px' }}><button type="submit" style={buttonStyle}>{editando ? <Edit2 size={16} /> : <Plus size={16} />} {editando ? 'Atualizar' : 'Adicionar'}</button>{editando && <button type="button" onClick={limparEdicao} style={secondaryButton}>Cancelar</button>}</div>
        </form>
        {itens.length === 0 ? <div style={emptyStyle}>Nenhum limite por categoria cadastrado neste mês.</div> : <div style={{ display: 'grid', gap: '12px' }}>{itens.map((item) => { const cfg = statusConfig[item.status] || statusConfig.normal; return <div key={item.id} style={itemStyle}><div style={summaryLine}><strong style={{ color: '#f8fafc' }}>{item.categoria}</strong><span style={{ color: cfg.color, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>{item.status !== 'normal' && <AlertTriangle size={14} />}{cfg.label}</span></div><div style={{ color: '#cbd5e1', fontSize: '13px', margin: '9px 0' }}>{moeda(item.gasto)} de {moeda(item.valor)} · saldo {moeda(item.saldo)}</div><div style={trackStyle}><div style={{ ...fillStyle, width: `${Math.min(item.percentual_uso * 100, 100)}%`, background: cfg.color }} /></div><div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}><button type="button" onClick={() => iniciarEdicao(item)} style={iconButton}><Edit2 size={14} /></button><button type="button" onClick={() => onExcluirOrcamentoCategoria(item.id)} style={{ ...iconButton, color: '#ef4444' }}><Trash2 size={14} /></button></div></div>; })}</div>}
      </div>
    </div>
  );
}

const formGrid = { display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) minmax(140px, 1fr) auto', gap: '16px', alignItems: 'end' };
const categoryGrid = { display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) minmax(120px, 1fr) 100px auto', gap: '12px', alignItems: 'end', margin: '22px 0' };
const labelStyle = { color: '#cbd5e1', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' };
const inputStyle = { width: '100%', boxSizing: 'border-box', marginTop: '6px', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,.12)', background: '#0f172a', color: '#f8fafc' };
const buttonStyle = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '10px 14px', border: 0, borderRadius: '8px', background: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' };
const secondaryButton = { ...buttonStyle, background: 'rgba(255,255,255,.08)', color: '#cbd5e1' };
const iconButton = { ...secondaryButton, padding: '7px', color: '#cbd5e1' };
const summaryLine = { display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' };
const itemStyle = { border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', padding: '14px 16px' };
const emptyStyle = { padding: '26px', textAlign: 'center', color: '#64748b' };
const trackStyle = { width: '100%', height: '8px', marginTop: '8px', borderRadius: '999px', overflow: 'hidden', background: 'rgba(255,255,255,.08)' };
const fillStyle = { height: '100%', borderRadius: '999px', transition: 'width .2s ease' };
