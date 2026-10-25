import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Calendar, Briefcase } from 'lucide-react';
import ThOrdenavel from './ThOrdenavel';
import { ordenarLista } from '../utils';

export default function ReceitasTable({ receitas, config, onNovaReceita, onEditarReceita, onExcluirReceita, mesSelecionado }) {
  const [busca, setBusca] = useState('');
  const [fonteFiltro, setFonteFiltro] = useState('Todas');
  const [mesFiltro, setMesFiltro] = useState(mesSelecionado || 'Todos');
  const [ordem, setOrdem] = useState({ campo: 'data', direcao: 'desc' });

  // Acompanha o mês escolhido na barra de navegação
  useEffect(() => {
    setMesFiltro(mesSelecionado || 'Todos');
  }, [mesSelecionado]);

  const formatarMoeda = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const mesesDisponiveis = useMemo(() => {
    const setMeses = new Set();
    receitas.forEach((r) => {
      if (r.data && r.data.length === 10) {
        const [, m, a] = r.data.split('/');
        setMeses.add(`${a}-${m}`);
      }
    });
    return Array.from(setMeses).sort().reverse();
  }, [receitas]);

  const receitasFiltradas = useMemo(() => {
    return receitas.filter((r) => {
      if (busca && !r.descricao.toLowerCase().includes(busca.toLowerCase())) {
        return false;
      }
      if (fonteFiltro !== 'Todas' && r.fonte !== fonteFiltro) {
        return false;
      }
      if (mesFiltro !== 'Todos') {
        const [, m, a] = r.data.split('/');
        const chave = `${a}-${m}`;
        if (chave !== mesFiltro) {
          return false;
        }
      }
      return true;
    });
  }, [receitas, busca, fonteFiltro, mesFiltro]);

  const receitasOrdenadas = useMemo(
    () => ordenarLista(receitasFiltradas, ordem.campo, ordem.direcao),
    [receitasFiltradas, ordem]
  );

  const totalFiltrado = useMemo(() => {
    return receitasFiltradas.reduce((acc, r) => acc + (r.valor || 0), 0);
  }, [receitasFiltradas]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in">
      {/* Header and Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc' }}>
            Receitas e Entradas
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>
            Total de {receitasFiltradas.length} receitas • Total: <strong style={{ color: '#10b981' }}>{formatarMoeda(totalFiltrado)}</strong>
          </p>
        </div>

        <button
          onClick={onNovaReceita}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            background: '#10b981',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
          }}
        >
          <Plus size={16} /> Nova Receita
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar por descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: '#0f172a',
              color: '#f8fafc',
              fontSize: '13px',
            }}
          />
        </div>

        {/* Fonte Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Briefcase size={15} color="#94a3b8" />
          <select
            value={fonteFiltro}
            onChange={(e) => setFonteFiltro(e.target.value)}
            style={selectFilterStyle}
          >
            <option value="Todas">Todas as fontes</option>
            {config.fontes_receita.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* Mes Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={15} color="#94a3b8" />
          <select
            value={mesFiltro}
            onChange={(e) => setMesFiltro(e.target.value)}
            style={selectFilterStyle}
          >
            <option value="Todos">Todos os meses</option>
            {mesesDisponiveis.map((m) => {
              const [ano, mes] = m.split('-');
              return (
                <option key={m} value={m}>{`${mes}/${ano}`}</option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div className="table-scroll" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.02)', color: '#94a3b8' }}>
                <ThOrdenavel campo="data" ordem={ordem} setOrdem={setOrdem}>Data</ThOrdenavel>
                <ThOrdenavel campo="descricao" ordem={ordem} setOrdem={setOrdem}>Descrição</ThOrdenavel>
                <ThOrdenavel campo="fonte" ordem={ordem} setOrdem={setOrdem}>Fonte</ThOrdenavel>
                <ThOrdenavel campo="valor" ordem={ordem} setOrdem={setOrdem} align="right">Valor</ThOrdenavel>
                <th style={{ padding: '14px 20px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {receitasOrdenadas.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    Nenhuma receita encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                receitasOrdenadas.map((r) => (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.2s'
                    }}
                  >
                    <td style={{ padding: '14px 20px', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>
                      {r.data}
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 500, color: '#f8fafc' }}>
                      {r.descricao}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                      }}>
                        {r.fonte}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 600, color: '#10b981', fontFamily: 'JetBrains Mono, monospace' }}>
                      {formatarMoeda(r.valor)}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button
                          onClick={() => onEditarReceita(r)}
                          title="Editar receita"
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            padding: '6px',
                            color: '#94a3b8',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => onExcluirReceita(r.id)}
                          title="Excluir receita"
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '8px',
                            padding: '6px',
                            color: '#ef4444',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {receitasOrdenadas.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.02)' }}>
                  <td colSpan={3} style={{ padding: '14px 20px', color: '#94a3b8', fontWeight: 600 }}>
                    Total ({receitasOrdenadas.length} {receitasOrdenadas.length === 1 ? 'receita' : 'receitas'})
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right', color: '#10b981', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                    {formatarMoeda(totalFiltrado)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

const selectFilterStyle = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: '#0f172a',
  color: '#f8fafc',
  fontSize: '13px',
  cursor: 'pointer'
};
