import React from 'react';
import { 
  TrendingDown, TrendingUp, Wallet, CheckCircle, 
  XCircle, AlertTriangle, PieChart, CreditCard, BarChart2 
} from 'lucide-react';
import DonutChart from './DonutChart';
import MonthlyBarChart from './MonthlyBarChart';

const formatarMoeda = (valor) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

const formatarMes = (chave) => {
  const [ano, mes] = String(chave || '').split('-');
  return ano && mes ? `${mes}/${ano}` : '';
};

function Comparacao({ dados, melhorQuandoSobe = true }) {
  if (!dados) return null;
  const diferenca = dados.diferenca || 0;
  const melhorou = diferenca === 0 ? null : (melhorQuandoSobe ? diferenca > 0 : diferenca < 0);
  const cor = melhorou === null ? '#64748b' : (melhorou ? '#10b981' : '#ef4444');
  const direcao = diferenca > 0 ? 'a mais' : diferenca < 0 ? 'a menos' : 'sem alteração';
  const percentual = dados.percentual === null
    ? 'sem base percentual'
    : `${Math.abs(dados.percentual).toFixed(1)}%`;

  return (
    <span style={{ fontSize: '12px', color: cor, marginTop: '4px', display: 'block' }}>
      {diferenca === 0 ? formatarMoeda(0) : `${formatarMoeda(Math.abs(diferenca))} ${direcao}`}
      {' · '}{percentual} vs. mês anterior
    </span>
  );
}

export default function Overview({ resumo, erro, onNovoGasto, onNovaReceita }) {
  if (erro) {
    return (
      <div className="glass-panel" role="alert" style={{ padding: '28px', color: '#fca5a5', textAlign: 'center' }}>
        <AlertTriangle size={24} style={{ marginBottom: '8px' }} />
        <p>{erro}</p>
      </div>
    );
  }

  if (!resumo) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
        <p>Carregando dados financeiros...</p>
      </div>
    );
  }

  const { relatorio, comparacao, orcamento_status, formas_pagamento, historico_saldos } = resumo;

  const totalGastos = relatorio?.total_gastos || 0;
  const totalReceitas = relatorio?.total_receitas || 0;
  const saldo = relatorio?.saldo || 0;
  const periodoVazio = (relatorio?.gastos?.length || 0) === 0 && (relatorio?.receitas?.length || 0) === 0;

  // Paleta de cores para categorias
  const paletaCores = [
    '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'
  ];

  // Dados formatados para o Donut de Categorias
  const dadosCategorias = Object.entries(relatorio?.por_categoria || {})
    .sort((a, b) => b[1] - a[1])
    .map(([cat, val], idx) => ({
      label: cat,
      value: val,
      color: paletaCores[idx % paletaCores.length]
    }));

  // Paleta de cores para formas de pagamento
  const coresPagamentos = {
    'Pix': '#10b981',
    'Crédito': '#8b5cf6',
    'Débito': '#3b82f6',
    'Dinheiro': '#f59e0b',
    'Outro': '#64748b'
  };

  // Dados formatados para o Donut de Pagamentos
  const dadosPagamentos = Object.entries(formas_pagamento || {})
    .sort((a, b) => b[1] - a[1])
    .map(([forma, val]) => ({
      label: forma,
      value: val,
      color: coresPagamentos[forma] || '#6366f1'
    }));

  const statusOrc = orcamento_status?.status;
  let corBadgeOrc = '#10b981';
  let IconeOrc = CheckCircle;
  let bgBadgeOrc = 'rgba(16, 185, 129, 0.15)';

  if (statusOrc === 'estourado') {
    corBadgeOrc = '#ef4444';
    IconeOrc = XCircle;
    bgBadgeOrc = 'rgba(239, 68, 68, 0.15)';
  } else if (statusOrc === 'alerta') {
    corBadgeOrc = '#f59e0b';
    IconeOrc = AlertTriangle;
    bgBadgeOrc = 'rgba(245, 158, 11, 0.15)';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
      {/* Barra Superior de Ações */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc' }}>
            Visão Geral e Indicadores
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>
            Período selecionado: <strong style={{ color: '#cbd5e1' }}>{formatarMes(resumo.mes)}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onNovaReceita}
            className="dashboard-action dashboard-action-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: '#10b981',
              color: '#fff',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            <TrendingUp size={16} /> Nova Receita
          </button>
          <button
            onClick={onNovoGasto}
            className="dashboard-action dashboard-action-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: '#6366f1',
              color: '#fff',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
          >
            <TrendingDown size={16} /> Novo Gasto
          </button>
        </div>
      </div>

      {periodoVazio && (
        <div className="glass-panel empty-state" role="status">
          <Wallet size={26} color="#64748b" style={{ marginBottom: '8px' }} />
          <h3 style={{ color: '#f8fafc', fontSize: '16px', marginBottom: '4px' }}>Nenhuma movimentação neste período</h3>
          <p style={{ fontSize: '13px' }}>Cadastre uma receita ou um gasto para começar a acompanhar este mês.</p>
          <div className="empty-actions">
            <button type="button" className="empty-action empty-action-secondary" onClick={onNovaReceita}>Adicionar receita</button>
            <button type="button" className="empty-action empty-action-primary" onClick={onNovoGasto}>Adicionar gasto</button>
          </div>
        </div>
      )}

      {/* 4 Cards de Resumo (KPIs) */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>Total de Receitas</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981', fontFamily: 'JetBrains Mono, monospace' }}>
            {formatarMoeda(totalReceitas)}
          </div>
          <span style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', display: 'block' }}>
            {relatorio?.receitas?.length || 0} entradas registradas
          </span>
          <Comparacao dados={comparacao?.total_receitas} />
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>Total de Gastos</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={18} color="#ef4444" />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444', fontFamily: 'JetBrains Mono, monospace' }}>
            {formatarMoeda(totalGastos)}
          </div>
          <span style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', display: 'block' }}>
            {relatorio?.gastos?.length || 0} despesas registradas
          </span>
          <Comparacao dados={comparacao?.total_gastos} melhorQuandoSobe={false} />
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>Saldo do Mês</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: saldo >= 0 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={18} color={saldo >= 0 ? '#38bdf8' : '#ef4444'} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: saldo >= 0 ? '#38bdf8' : '#ef4444', fontFamily: 'JetBrains Mono, monospace' }}>
            {formatarMoeda(saldo)}
          </div>
          <span style={{ fontSize: '12px', color: saldo >= 0 ? '#10b981' : '#ef4444', marginTop: '6px', display: 'block' }}>
            {saldo >= 0 ? 'Superávit no período' : 'Déficit no período'}
          </span>
          <Comparacao dados={comparacao?.saldo} />
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>Orçamento Mensal</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: bgBadgeOrc, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconeOrc size={18} color={corBadgeOrc} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace' }}>
            {orcamento_status?.orcamento !== null ? formatarMoeda(orcamento_status.orcamento) : 'Não definido'}
          </div>
          <span style={{ fontSize: '12px', color: corBadgeOrc, marginTop: '6px', display: 'block' }}>
            {orcamento_status?.orcamento !== null ? `${(orcamento_status.percentual * 100).toFixed(0)}% utilizado` : 'Sem teto fixado'}
          </span>
        </div>
      </div>

      {/* Barra de Alerta do Orçamento */}
      {orcamento_status?.orcamento !== null && (
        <div className="glass-panel" style={{ padding: '20px', borderLeft: `4px solid ${corBadgeOrc}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconeOrc size={18} color={corBadgeOrc} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                {orcamento_status.mensagem}
              </span>
            </div>
            <span style={{ fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8' }}>
              {formatarMoeda(totalGastos)} de {formatarMoeda(orcamento_status.orcamento)}
            </span>
          </div>

          <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(orcamento_status.percentual * 100, 100)}%`,
              height: '100%',
              background: corBadgeOrc,
              borderRadius: '999px',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
      )}

      {/* 📊 SEÇÃO DE GRÁFICOS VISUAIS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '20px' }}>
        {/* Gráfico 1: Rosca de Gastos por Categoria */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <PieChart size={20} color="#818cf8" />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f8fafc' }}>
                Gráfico: Gastos por Categoria
              </h3>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Proporção e distribuição no mês</span>
            </div>
          </div>
          <DonutChart dados={dadosCategorias} centroSubtitulo="Total Gastos" />
        </div>

        {/* Gráfico 2: Rosca de Formas de Pagamento */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <CreditCard size={20} color="#38bdf8" />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f8fafc' }}>
                Gráfico: Formas de Pagamento
              </h3>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Distribuição de métodos de pagamento</span>
            </div>
          </div>
          <DonutChart dados={dadosPagamentos} centroSubtitulo="Total Pago" />
        </div>
      </div>

      {/* Gráfico 3: Barras Comparativas de Evolução Mensal vs Orçamento */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <BarChart2 size={20} color="#10b981" />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f8fafc' }}>
                Evolução Mensal de Receitas, Gastos e Saldo
            </h3>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Últimos 12 meses, incluindo períodos sem movimentação</span>
          </div>
        </div>
        <MonthlyBarChart
          dados={historico_saldos}
          orcamento={orcamento_status?.orcamento}
        />
      </div>
    </div>
  );
}
