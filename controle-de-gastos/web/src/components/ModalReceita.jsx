import React, { useState, useEffect } from 'react';
import { X, Calendar, FileText, Briefcase, DollarSign } from 'lucide-react';
import { dataValida, MSG_DATA_INVALIDA, brParaISO, isoParaBR, hojeBR } from '../utils';

export default function ModalReceita({ isOpen, onClose, onSave, itemParaEditar, config }) {
  const [data, setData] = useState('');
  const [descricao, setDescricao] = useState('');
  const [fonte, setFonte] = useState('');
  const [valor, setValor] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (itemParaEditar) {
      setData(itemParaEditar.data || '');
      setDescricao(itemParaEditar.descricao || '');
      setFonte(itemParaEditar.fonte || (config.fontes_receita[0] || 'Salário'));
      setValor(String(itemParaEditar.valor || ''));
    } else {
      setData(hojeBR());
      setDescricao('');
      setFonte(config.fontes_receita[0] || 'Salário');
      setValor('');
    }
    setErro('');
  }, [itemParaEditar, isOpen, config]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErro('');

    if (!dataValida(data)) {
      setErro(MSG_DATA_INVALIDA);
      return;
    }

    const valorNum = parseFloat(valor.replace(',', '.'));
    if (isNaN(valorNum) || valorNum <= 0) {
      setErro('O valor deve ser um número positivo.');
      return;
    }

    if (!descricao.trim()) {
      setErro('Informe a descrição da receita.');
      return;
    }

    onSave({
      id: itemParaEditar ? itemParaEditar.id : undefined,
      data: data.trim(),
      descricao: descricao.trim(),
      fonte,
      valor: valorNum,
    });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: 'none',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)' }}>
            {itemParaEditar ? 'Editar Receita' : 'Nova Receita'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form className="modal-form" onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {erro && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--danger)',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '13px'
            }}>
              {erro}
            </div>
          )}

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
              <Calendar size={14} /> Data
            </label>
            <input
              type="date"
              value={brParaISO(data)}
              min="2000-01-01"
              max="2100-12-31"
              onChange={(e) => setData(isoParaBR(e.target.value))}
              style={{ ...inputStyle, colorScheme: 'dark' }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
              <FileText size={14} /> Descrição
            </label>
            <input
              type="text"
              placeholder="ex: Salário mensal"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
              <Briefcase size={14} /> Fonte da Receita
            </label>
            <input list="fontes-receita" aria-label="Fonte da receita" value={fonte} onChange={(e) => setFonte(e.target.value)} required maxLength={100} placeholder="Escolha ou digite uma nova" style={selectStyle} />
              <datalist id="fontes-receita">{config.fontes_receita.map(item => <option key={item} value={item} />)}</datalist>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
              <DollarSign size={14} /> Valor (R$)
            </label>
            <input
              type="text"
              placeholder="ex: 3500.00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              style={{ ...inputStyle, fontFamily: 'var(--font-family)', fontSize: '16px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                padding: '10px 18px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '14px'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                background: 'var(--success)',
                border: 'none',
                color: '#fff',
                padding: '10px 22px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                boxShadow: 'none'
              }}
            >
              {itemParaEditar ? 'Salvar Alterações' : 'Cadastrar Receita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: '10px',
  color: 'var(--text-main)',
  fontSize: '14px',
  boxSizing: 'border-box'
};

const selectStyle = {
  width: '100%',
  padding: '10px 14px',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: '10px',
  color: 'var(--text-main)',
  fontSize: '14px',
  boxSizing: 'border-box',
  cursor: 'pointer'
};
