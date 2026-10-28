import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

/** Cabeçalho de tabela clicável para ordenar por uma coluna. */
export default function ThOrdenavel({ campo, ordem, setOrdem, align = 'left', children }) {
  const ativo = ordem.campo === campo;
  const Icone = ativo ? (ordem.direcao === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

  const alternar = () => {
    if (ativo) {
      setOrdem({ campo, direcao: ordem.direcao === 'asc' ? 'desc' : 'asc' });
    } else {
      // datas e valores começam do maior/mais recente; textos em ordem alfabética
      setOrdem({ campo, direcao: campo === 'data' || campo === 'valor' ? 'desc' : 'asc' });
    }
  };

  return (
    <th
      aria-sort={ativo ? (ordem.direcao === 'asc' ? 'ascending' : 'descending') : 'none'}
      style={{ padding: '14px 20px', textAlign: align }}
    >
      <button
        type="button"
        className="th-sort"
        onClick={alternar}
        title={`Ordenar por ${String(children).toLowerCase()}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          padding: 0,
          font: 'inherit',
          fontWeight: ativo ? 700 : 'inherit',
          color: ativo ? 'var(--text-main)' : 'inherit',
          cursor: 'pointer',
        }}
      >
        {children}
        <Icone size={13} color={ativo ? 'var(--primary)' : 'var(--text-dim)'} aria-hidden="true" />
      </button>
    </th>
  );
}
