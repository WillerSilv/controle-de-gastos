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
  const cor = melhorou === null ? 'var(--text-dim)' : (melhorou ? 'var(--success)' : 'var(--danger)');
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
      <div className="surface-panel" role="alert" style={{ padding: '28px', color: 'var(--danger)', textAlign: 'center' }}>
        <AlertTriangle size={24} style={{ marginBottom: '8px' }} />
        <p>{erro}</p>
      </div>
    );
  }

  if (!resumo) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
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
    'var(--primary-strong)', '#3b82f6', 'var(--success)', 'var(--warning)', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'
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
    'Pix': 'var(--success)',
    'Crédito': '#8b5cf6',
    'Débito': '#3b82f6',
    'Dinheiro': 'var(--warning)',
    'Outro': 'var(--text-dim)'
  };

  // Dados formatados para o Donut de Pagamentos
  const dadosPagamentos = Object.entries(formas_pagamento || {})
    .sort((a, b) => b[1] - a[1])
    .map(([forma, val]) => ({
      label: forma,
      value: val,
      color: coresPagamentos[forma] || 'var(--primary-strong)'
    }));

  const statusOrc = orcamento_status?.status;
  let corBadgeOrc = 'var(--success)';
  let IconeOrc = CheckCircle;
  let bgBadgeOrc = 'rgba(16, 185, 129, 0.15)';

  if (statusOrc === 'estourado') {
    corBadgeOrc = 'var(--danger)';
    IconeOrc = XCircle;
    bgBadgeOrc = 'rgba(239, 68, 68, 0.15)';
  } else if (statusOrc === 'alerta') {
    corBadgeOrc = 'var(--warning)';
    IconeOrc = AlertTriangle;
    bgBadgeOrc = 'rgba(245, 158, 11, 0.15)';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
      {/* Barra Superior de Ações */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>
            Como foi seu mês
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Movimentações de <strong style={{ color: 'var(--text-main)' }}>{formatarMes(resumo.mes)}</strong>
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
              background: 'transparent',
              color: 'var(--text-main)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: 'none'
            }}
          >
            <TrendingUp size={16} /> Adicionar receita
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
              background: 'var(--primary-strong)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: 'none'
            }}
          >
            <TrendingDown size={16} /> Registrar gasto
          </button>
        </div>
      </div>

      {periodoVazio && (
        <div className="surface-panel empty-state" role="status">
          <Wallet size={26} color="var(--text-dim)" style={{ marginBottom: '8px' }} />
          <h3 style={{ color: 'var(--text-main)', fontSize: '16px', marginBottom: '4px' }}>Nenhuma movimentação neste período</h3>
          <p style={{ fontSize: '13px' }}>Cadastre uma receita ou um gasto para começar a acompanhar este mês.</p>
          <div className="empty-actions">
            <button type="button" className="empty-action empty-action-secondary" onClick={onNovaReceita}>Adicionar receita</button>
            <button type="button" className="empty-action empty-action-primary" onClick={onNovoGasto}>Adicionar gasto</button>
          </div>
        </div>
      )}

      {/* 4 Cards de Resumo (KPIs) */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="surface-panel balance-summary" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>Saldo do Mês</span>
            <div style={{ width: '24px', height: '24px', borderRadius: '10px', background: saldo >= 0 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={18} color={saldo >= 0 ? '#28648c' : 'var(--danger)'} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: saldo >= 0 ? '#28648c' : 'var(--danger)', fontFamily: 'var(--font-family)' }}>
            {formatarMoeda(saldo)}
          </div>
          <span style={{ fontSize: '12px', color: saldo >= 0 ? 'var(--success)' : 'var(--danger)', marginTop: '6px', display: 'block' }}>
            {saldo >= 0 ? 'Receitas acima dos gastos' : 'Gastos acima das receitas'}
          </span>
          <Comparacao dados={comparacao?.saldo} />
        </div>

        <div className="surface-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>Entrou</span>
            <div style={{ width: '24px', height: '24px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="var(--success)" />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--success)', fontFamily: 'var(--font-family)' }}>
            {formatarMoeda(totalReceitas)}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px', display: 'block' }}>
            {relatorio?.receitas?.length || 0} entradas registradas
          </span>
          <Comparacao dados={comparacao?.total_receitas} />
        </div>

        <div className="surface-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>Saiu</span>
            <div style={{ width: '24px', height: '24px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={18} color="var(--danger)" />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--danger)', fontFamily: 'var(--font-family)' }}>
            {formatarMoeda(totalGastos)}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px', display: 'block' }}>
            {relatorio?.gastos?.length || 0} despesas registradas
          </span>
          <Comparacao dados={comparacao?.total_gastos} melhorQuandoSobe={false} />
        </div>

        <div className="surface-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>Orçamento Mensal</span>
            <div style={{ width: '24px', height: '24px', borderRadius: '10px', background: bgBadgeOrc, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconeOrc size={18} color={corBadgeOrc} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-family)' }}>
            {orcamento_status?.orcamento !== null ? formatarMoeda(orcamento_status.orcamento) : 'Não definido'}
          </div>
          <span style={{ fontSize: '12px', color: corBadgeOrc, marginTop: '6px', display: 'block' }}>
            {orcamento_status?.orcamento !== null ? `${(orcamento_status.percentual * 100).toFixed(0)}% utilizado` : 'Você ainda não definiu um limite'}
          </span>
        </div>
      </div>

      {/* Barra de Alerta do Orçamento */}
      {orcamento_status?.orcamento !== null && (
        <div className="surface-panel" style={{ padding: '20px', borderLeft: `4px solid ${corBadgeOrc}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconeOrc size={18} color={corBadgeOrc} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                {orcamento_status.mensagem}
              </span>
            </div>
            <span style={{ fontSize: '13px', fontFamily: 'var(--font-family)', color: 'var(--text-muted)' }}>
              {formatarMoeda(totalGastos)} de {formatarMoeda(orcamento_status.orcamento)}
            </span>
          </div>

          <div style={{ width: '100%', height: '10px', background: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
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
        <div className="surface-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <PieChart size={20} color="var(--primary)" />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
                Onde você gastou
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Proporção e distribuição no mês</span>
            </div>
          </div>
          <DonutChart dados={dadosCategorias} centroSubtitulo="Total Gastos" />
        </div>

        {/* Gráfico 2: Rosca de Formas de Pagamento */}
        <div className="surface-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <CreditCard size={20} color="#28648c" />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
                Como você pagou
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Distribuição de métodos de pagamento</span>
            </div>
          </div>
          <DonutChart dados={dadosPagamentos} centroSubtitulo="Total Pago" />
        </div>
      </div>

      {/* Gráfico 3: Barras Comparativas de Evolução Mensal vs Orçamento */}
      <div className="surface-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <BarChart2 size={20} color="var(--success)" />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
                Seu ano em números
            </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Últimos 12 meses, incluindo períodos sem movimentação</span>
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
