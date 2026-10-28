import React, { useState, useRef, useEffect } from 'react';

const MARGEM = { esq: 58, dir: 14, topo: 18, base: 30 };

function passoRedondo(valor) {
  const alvo = Math.max(valor, 1) / 4;
  const potencia = Math.pow(10, Math.floor(Math.log10(alvo)));
  const fator = alvo / potencia;
  return (fator <= 1 ? 1 : fator <= 2 ? 2 : fator <= 5 ? 5 : 10) * potencia;
}

function criarEscala(valores) {
  const minimo = Math.min(0, ...valores);
  const maximo = Math.max(0, ...valores, 100);
  const passo = passoRedondo(maximo - minimo);
  const min = Math.floor(minimo / passo) * passo;
  const max = Math.ceil(maximo / passo) * passo || passo;
  const marcas = [];
  for (let valor = min; valor <= max + passo / 2; valor += passo) marcas.push(valor);
  return { min, max, marcas };
}

const fmtEixo = (valor) => valor.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
const fmtMes = (chave) => {
  const [ano, mes] = String(chave || '').split('-');
  return mes && ano ? `${mes}/${ano}` : String(chave || '');
};
const formatarMoeda = (valor) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

export default function MonthlyBarChart({ dados, orcamento }) {
  const [selecionado, setSelecionado] = useState(null);
  const caixaRef = useRef(null);
  const [largura, setLargura] = useState(0);

  useEffect(() => {
    const elemento = caixaRef.current;
    if (!elemento) return undefined;
    const medir = () => setLargura(Math.floor(elemento.getBoundingClientRect().width));
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  const meses = dados || [];
  const temDados = meses.some((item) => item.receitas || item.gastos || item.saldo);
  const W = Math.max(largura, 280);
  const H = W < 480 ? 240 : 290;
  const areaW = W - MARGEM.esq - MARGEM.dir;
  const areaH = H - MARGEM.topo - MARGEM.base;
  const valores = meses.flatMap((item) => [item.receitas || 0, item.gastos || 0, item.saldo || 0]);
  if (orcamento) valores.push(orcamento);
  const escala = criarEscala(valores);
  const yDe = (valor) => MARGEM.topo + (escala.max - valor) / (escala.max - escala.min) * areaH;
  const yZero = yDe(0);
  const larguraGrupo = meses.length ? areaW / meses.length : areaW;
  const larguraBarra = Math.max(5, Math.min(24, larguraGrupo * 0.27));
  const espaco = 3;
  const pontosSaldo = meses.map((item, indice) => ({
    x: MARGEM.esq + indice * larguraGrupo + larguraGrupo / 2,
    y: yDe(item.saldo || 0),
    item,
  }));
  const itemAtivo = meses.find((item) => item.mes === selecionado) || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '8px 16px', fontSize: '12px' }}>
        {[
          ['var(--success)', 'Receitas'],
          ['var(--danger)', 'Gastos'],
          ['#28648c', 'Saldo'],
        ].map(([cor, rotulo]) => (
          <div key={rotulo} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={rotulo === 'Saldo'
              ? { width: '16px', borderTop: `2px solid ${cor}` }
              : { width: '12px', height: '12px', borderRadius: '3px', background: cor }} />
            <span style={{ color: 'var(--text-muted)' }}>{rotulo}</span>
          </div>
        ))}
        {orcamento ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '16px', borderTop: '2px dashed var(--warning)' }} />
            <span style={{ color: 'var(--warning)' }}>Orçamento ({formatarMoeda(orcamento)})</span>
          </div>
        ) : null}
      </div>

      <div ref={caixaRef} style={{ width: '100%' }}>
        {largura > 0 && (
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', maxWidth: '100%' }} role="img"
               aria-label="Evolução mensal de receitas, gastos e saldo">
            {escala.marcas.map((valor) => (
              <g key={valor}>
                <line x1={MARGEM.esq} y1={yDe(valor)} x2={W - MARGEM.dir} y2={yDe(valor)}
                      stroke={valor === 0 ? 'var(--border-color)' : 'var(--border-color)'}
                      strokeDasharray={valor === 0 ? undefined : '4 4'} />
                <text x={MARGEM.esq - 8} y={yDe(valor) + 4} textAnchor="end" fill="var(--text-dim)" fontSize="11"
                      fontFamily="var(--font-family)">{fmtEixo(valor)}</text>
              </g>
            ))}

            {orcamento ? (
              <line x1={MARGEM.esq} y1={yDe(orcamento)} x2={W - MARGEM.dir} y2={yDe(orcamento)}
                    stroke="var(--warning)" strokeWidth="2" strokeDasharray="6 4" />
            ) : null}

            {meses.map((item, indice) => {
              const centro = MARGEM.esq + indice * larguraGrupo + larguraGrupo / 2;
              const yReceita = yDe(item.receitas || 0);
              const yGasto = yDe(item.gastos || 0);
              const ativo = selecionado === item.mes;
              const apagado = selecionado && !ativo ? 0.4 : 1;
              const [ano, mes] = String(item.mes).split('-');
              return (
                <g key={item.mes} style={{ cursor: 'pointer' }}
                   onMouseEnter={() => setSelecionado(item.mes)} onMouseLeave={() => setSelecionado(null)}
                   onClick={() => setSelecionado(ativo ? null : item.mes)}>
                  <rect x={centro - larguraGrupo / 2} y={MARGEM.topo} width={larguraGrupo}
                        height={areaH + MARGEM.base} fill="transparent" />
                  <rect x={centro - larguraBarra - espaco / 2} y={Math.min(yReceita, yZero)}
                        width={larguraBarra} height={Math.max(Math.abs(yZero - yReceita), item.receitas ? 2 : 0)}
                        rx="3" fill="var(--success)" opacity={apagado} />
                  <rect x={centro + espaco / 2} y={Math.min(yGasto, yZero)}
                        width={larguraBarra} height={Math.max(Math.abs(yZero - yGasto), item.gastos ? 2 : 0)}
                        rx="3" fill="var(--danger)" opacity={apagado} />
                  <text x={centro} y={H - 8} textAnchor="middle" fontSize={W < 480 ? 10 : 11}
                        fill={ativo ? 'var(--text-main)' : 'var(--text-muted)'} fontWeight={ativo ? 700 : 500}>
                    {W < 480 && indice % 2 === 1 ? '' : (mes && ano ? `${mes}/${ano.slice(2)}` : item.mes)}
                  </text>
                </g>
              );
            })}

            <polyline points={pontosSaldo.map((ponto) => `${ponto.x},${ponto.y}`).join(' ')}
                      fill="none" stroke="#28648c" strokeWidth="2.5" pointerEvents="none" />
            {pontosSaldo.map(({ x, y, item }) => (
              <circle key={item.mes} cx={x} cy={y} r={selecionado === item.mes ? 5 : 3.5}
                      fill="#28648c" stroke="var(--bg-primary)" strokeWidth="2" pointerEvents="none" />
            ))}
          </svg>
        )}
      </div>

      <div style={{ minHeight: '44px', padding: '10px 16px', background: 'var(--bg-secondary)', borderRadius: '10px',
                    border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', flexWrap: 'wrap', gap: '6px 16px', fontSize: '13px' }}>
        {itemAtivo ? (
          <>
            <div>
              <strong style={{ color: 'var(--text-main)' }}>{fmtMes(itemAtivo.mes)}:</strong>{' '}
              <span style={{ color: 'var(--success)' }}>Receitas {formatarMoeda(itemAtivo.receitas)}</span>{' | '}
              <span style={{ color: 'var(--danger)' }}>Gastos {formatarMoeda(itemAtivo.gastos)}</span>
            </div>
            <strong style={{ color: itemAtivo.saldo >= 0 ? '#28648c' : 'var(--danger)', fontFamily: 'var(--font-family)' }}>
              Saldo {formatarMoeda(itemAtivo.saldo)}
            </strong>
          </>
        ) : (
          <span style={{ color: 'var(--text-dim)' }}>
            {temDados ? 'Passe o mouse ou toque em um mês para ver os valores.' : 'Nenhuma movimentação nos últimos 12 meses.'}
          </span>
        )}
      </div>
    </div>
  );
}
