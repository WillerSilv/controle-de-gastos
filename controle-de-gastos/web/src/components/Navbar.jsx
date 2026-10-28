import React, { useEffect, useState } from 'react';
import { LayoutDashboard, TrendingDown, TrendingUp, SlidersHorizontal, Repeat, Target, FileUp, LogOut, MoreHorizontal } from 'lucide-react';
import { sair, usuarioAtual } from '../lib/auth';
import SeletorMes from './SeletorMes';

export default function Navbar({ user, abaAtiva, setAbaAtiva, mesSelecionado, setMesSelecionado }) {
  const [usuario, setUsuario] = useState(user || null);
  const [maisAberto, setMaisAberto] = useState(false);

  useEffect(() => {
    if (user) return;
    usuarioAtual().then(setUsuario);
  }, [user]);

  const conta = user || usuario;
  return (
    <header className="app-header" style={{
      borderBottom: '1px solid var(--border-color)',
      background: 'var(--bg-secondary)',
      backdropFilter: 'none',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div className="nav-container" style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 24px',
        minHeight: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              Controle de Gastos
            </h1>
            <span className="nav-subtitle" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Seu dinheiro, mês a mês
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs" style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'dashboard', label: 'Resumo', icon: LayoutDashboard },
            { id: 'gastos', label: 'Gastos', icon: TrendingDown },
            { id: 'receitas', label: 'Receitas', icon: TrendingUp },
            { id: 'orcamento', label: 'Orçamento', icon: SlidersHorizontal },
            { id: 'recorrencias', label: 'Recorrentes', icon: Repeat },
            { id: 'metas', label: 'Metas', icon: Target },
            { id: 'importar', label: 'Arquivos', icon: FileUp },
          ].map((item) => {
            const Icon = item.icon;
            const ativo = abaAtiva === item.id;
            return (
              <button
                key={item.id}
                className={`nav-btn ${['recorrencias', 'metas', 'importar'].includes(item.id) ? 'nav-secondary-item' : ''}`}
                aria-current={ativo ? 'page' : undefined}
                onClick={() => setAbaAtiva(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexShrink: 0,
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: ativo ? 600 : 500,
                  color: ativo ? 'var(--text-main)' : 'var(--text-muted)',
                  background: ativo ? 'var(--primary-light)' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={16} color={ativo ? 'var(--primary)' : 'var(--text-dim)'} />
                {item.label}
              </button>
            );
          })}
          <div className="nav-more">
            <button
              type="button"
              className="nav-btn nav-more-toggle"
              aria-expanded={maisAberto}
              onClick={() => setMaisAberto((aberto) => !aberto)}
            >
              <MoreHorizontal size={16} aria-hidden="true" />
              Mais
            </button>
            {maisAberto && (
              <div className="nav-more-menu">
                {[
                  ['recorrencias', 'Recorrentes', Repeat],
                  ['metas', 'Metas', Target],
                  ['importar', 'Arquivos', FileUp],
                ].map(([id, label, Icon]) => (
                  <button key={id} type="button" onClick={() => { setAbaAtiva(id); setMaisAberto(false); }}>
                    <Icon size={15} aria-hidden="true" /> {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Month and account controls */}
        <div className="nav-tools">
          <SeletorMes value={mesSelecionado} onChange={setMesSelecionado} />
          <div className="nav-account">
            <span className="nav-account-email" title={conta?.email || 'Conta conectada'}>
              {conta?.email || 'Conta conectada'}
            </span>
            <button className="nav-logout" type="button" onClick={() => sair()} title="Sair da conta" aria-label="Sair da conta">
              <LogOut size={16} aria-hidden="true" />
              <span className="nav-account-label">Sair</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}



