import React, { useState } from 'react';

export default function DonutChart({ dados, centroSubtitulo }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!dados || dados.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', fontSize: '14px' }}>
        Nenhum dado para exibir neste gráfico.
      </div>
    );
  }

  const total = dados.reduce((acc, d) => acc + (d.value || 0), 0);
  if (total <= 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', fontSize: '14px' }}>
        Total zerado no período selecionado.
      </div>
    );
  }

  const formatarMoeda = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const radius = 65;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius; // ~408.4

  let acumulado = 0;
  const fatias = dados.map((item, i) => {
    const percent = item.value / total;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -acumulado * circumference;
    acumulado += percent;

    return {
      ...item,
      percentual: (percent * 100).toFixed(1),
      strokeDasharray,
      strokeDashoffset,
      index: i
    };
  });

  const itemAtivo = hoverIndex !== null ? fatias[hoverIndex] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <svg width="200" height="200" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
          {/* Fundo do círculo */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={strokeWidth}
          />
          {/* Fatias do Donut */}
          {fatias.map((fatia) => {
            const isHover = hoverIndex === fatia.index;
            return (
              <circle
                key={fatia.label}
                cx="90"
                cy="90"
                r={radius}
                fill="transparent"
                stroke={fatia.color}
                strokeWidth={isHover ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={fatia.strokeDasharray}
                strokeDashoffset={fatia.strokeDashoffset}
                strokeLinecap="butt"
                onMouseEnter={() => setHoverIndex(fatia.index)}
                onMouseLeave={() => setHoverIndex(null)}
                style={{
                  cursor: 'pointer',
                  transition: 'stroke-width 0.2s, opacity 0.2s',
                  opacity: hoverIndex === null || isHover ? 1 : 0.45
                }}
              />
            );
          })}
        </svg>

        {/* Informação no Centro do Donut */}
        <div style={{
          position: 'absolute',
          textAlign: 'center',
          pointerEvents: 'none',
          maxWidth: '120px'
        }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', fontWeight: 500 }}>
            {itemAtivo ? itemAtivo.label : (centroSubtitulo || 'Total')}
          </span>
          <span style={{
            fontSize: '15px',
            fontWeight: 700,
            color: itemAtivo ? itemAtivo.color : '#f8fafc',
            fontFamily: 'JetBrains Mono, monospace',
            display: 'block'
          }}>
            {itemAtivo ? formatarMoeda(itemAtivo.value) : formatarMoeda(total)}
          </span>
          {itemAtivo && (
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
              {itemAtivo.percentual}%
            </span>
          )}
        </div>
      </div>

      {/* Legenda com cores e valores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginTop: '8px' }}>
        {fatias.map((item) => {
          const isHover = hoverIndex === item.index;
          return (
            <div
              key={item.label}
              onMouseEnter={() => setHoverIndex(item.index)}
              onMouseLeave={() => setHoverIndex(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                borderRadius: '8px',
                background: isHover ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: item.color, flexShrink: 0 }} />
              <div style={{ overflow: 'hidden', width: '100%' }}>
                <div style={{ fontSize: '12px', color: '#f8fafc', fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
                  {formatarMoeda(item.value)} ({item.percentual}%)
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
