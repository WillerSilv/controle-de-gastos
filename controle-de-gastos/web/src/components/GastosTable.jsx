import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Calendar, Tag, CreditCard } from 'lucide-react';
import ThOrdenavel from './ThOrdenavel';
import { ordenarLista } from '../utils';

export default function GastosTable({ gastos, config, onNovoGasto, onEditarGasto, onExcluirGasto, mesSelecionado }) {
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [mesFiltro, setMesFiltro] = useState(mesSelecionado || 'Todos');
  const [ordem, setOrdem] = useState({ campo: 'data', direcao: 'desc' });

  // Acompanha o mês escolhido na barra de navegação
  useEffect(() => {
    setMesFiltro(mesSelecionado || 'Todos');
  }, [mesSelecionado]);

  const formatarMoeda = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  // Extrai lista única de meses dos gastos
  const mesesDisponiveis = useMemo(() => {
    const setMeses = new Set();
    gastos.forEach((g) => {
      if (g.data && g.data.length === 10) {
        const [, m, a] = g.data.split('/');
        setMeses.add(`${a}-${m}`);
      }
    });
    return Array.from(setMeses).sort().reverse();
  }, [gastos]);

  const gastosFiltrados = useMemo(() => {
    return gastos.filter((g) => {
      // Filtro de texto na descrição
      if (busca && !g.descricao.toLowerCase().includes(busca.toLowerCase())) {
        return false;
      }
      // Filtro de categoria
      if (categoriaFiltro !== 'Todas' && g.categoria !== categoriaFiltro) {
        return false;
      }
      // Filtro de mês
      if (mesFiltro !== 'Todos') {
        const [, m, a] = g.data.split('/');
        const chave = `${a}-${m}`;
        if (chave !== mesFiltro) {
          return false;
        }
      }
      return true;
    });
  }, [gastos, busca, categoriaFiltro, mesFiltro]);

  const gastosOrdenados = useMemo(
    () => ordenarLista(gastosFiltrados, ordem.campo, ordem.direcao),
    [gastosFiltrados, ordem]
  );

  const totalFiltrado = useMemo(() => {
    return gastosFiltrados.reduce((acc, g) => acc + (g.valor || 0), 0);
  }, [gastosFiltrados]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in">
      {/* Header and Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc' }}>
            Despesas e Gastos
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>
            Total de {gastosFiltrados.length} gastos encontrados • Total: <strong style={{ color: '#ef4444' }}>{formatarMoeda(totalFiltrado)}</strong>
          </p>
        </div>

        <button
          onClick={onNovoGasto}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            background: '#6366f1',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
          }}
        >
          <Plus size={16} /> Novo Gasto
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        {/* Search */}
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

        {/* Categoria Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Tag size={15} color="#94a3b8" />
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            style={selectFilterStyle}
          >
            <option value="Todas">Todas as categorias</option>
            {config.categorias.map((c) => (
              <option key={c} value={c}>{c}</option>
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
                <ThOrdenavel campo="categoria" ordem={ordem} setOrdem={setOrdem}>Categoria</ThOrdenavel>
                <ThOrdenavel campo="pagamento" ordem={ordem} setOrdem={setOrdem}>Pagamento</ThOrdenavel>
                <ThOrdenavel campo="valor" ordem={ordem} setOrdem={setOrdem} align="right">Valor</ThOrdenavel>
                <th style={{ padding: '14px 20px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {gastosOrdenados.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    Nenhum gasto encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                gastosOrdenados.map((g) => (
                  <tr
                    key={g.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.2s'
                    }}
                  >
                    <td style={{ padding: '14px 20px', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>
                      {g.data}
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 500, color: '#f8fafc' }}>
                      {g.descricao}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#818cf8',
                        border: '1px solid rgba(99, 102, 241, 0.2)'
                      }}>
                        {g.categoria}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '13px' }}>
                        <CreditCard size={13} /> {g.pagamento}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 600, color: '#ef4444', fontFamily: 'JetBrains Mono, monospace' }}>
                      {formatarMoeda(g.valor)}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button
                          onClick={() => onEditarGasto(g)}
                          title="Editar gasto"
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
                          onClick={() => onExcluirGasto(g.id)}
                          title="Excluir gasto"
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
            {gastosOrdenados.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.02)' }}>
                  <td colSpan={4} style={{ padding: '14px 20px', color: '#94a3b8', fontWeight: 600 }}>
                    Total ({gastosOrdenados.length} {gastosOrdenados.length === 1 ? 'gasto' : 'gastos'})
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right', color: '#ef4444', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
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
