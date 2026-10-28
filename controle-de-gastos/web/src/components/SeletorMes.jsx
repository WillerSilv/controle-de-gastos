import React, { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function SeletorMes({ value, onChange }) {
  const hoje = new Date();
  const [aberto, setAberto] = useState(false);
  const [ano, setAno] = useState(hoje.getFullYear());
  const raiz = useRef(null);
  const gatilho = useRef(null);
  const [anoSelecionado, mesSelecionado] = (value || '').split('-').map(Number);

  useEffect(() => {
    if (!aberto) return;
    const fechar = (e) => { if (!raiz.current?.contains(e.target)) setAberto(false); };
    document.addEventListener('pointerdown', fechar);
    return () => document.removeEventListener('pointerdown', fechar);
  }, [aberto]);

  const escolher = (a, m) => {
    onChange(`${a}-${String(m).padStart(2, '0')}`);
    setAberto(false);
    gatilho.current?.focus();
  };

  return <div className="month-picker" ref={raiz}
    onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setAberto(false); }}
    onKeyDown={(e) => { if (e.key === 'Escape') { setAberto(false); gatilho.current?.focus(); } }}>
    <button ref={gatilho} type="button" className="month-trigger" aria-expanded={aberto}
      aria-label={`Selecionar mês: ${meses[mesSelecionado - 1] || 'nenhum'}, ${anoSelecionado || ''}`}
      onClick={() => { setAno(anoSelecionado || hoje.getFullYear()); setAberto(!aberto); }}>
      <Calendar size={16} aria-hidden="true" />
      <span>{mesSelecionado ? `${meses[mesSelecionado - 1]} de ${anoSelecionado}` : 'Selecionar mês'}</span>
      <ChevronDown size={14} aria-hidden="true" />
    </button>
    {aberto && <div className="month-panel" role="group" aria-label="Escolher mês">
      <div className="month-year">
        <button type="button" aria-label="Ano anterior" disabled={ano <= 2000} onClick={() => setAno(ano - 1)}><ChevronLeft size={18} /></button>
        <strong aria-live="polite">{ano}</strong>
        <button type="button" aria-label="Próximo ano" disabled={ano >= 2100} onClick={() => setAno(ano + 1)}><ChevronRight size={18} /></button>
      </div>
      <div className="month-grid">{meses.map((mes, i) => <button type="button" key={mes}
        aria-pressed={ano === anoSelecionado && i + 1 === mesSelecionado}
        onClick={() => escolher(ano, i + 1)}>{mes}</button>)}</div>
      <button type="button" className="month-today" onClick={() => escolher(hoje.getFullYear(), hoje.getMonth() + 1)}>Ir para o mês atual</button>
    </div>}
  </div>;
}
