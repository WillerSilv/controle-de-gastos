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
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        background: '#1e293b',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#f8fafc' }}>
            {itemParaEditar ? 'Editar Receita' : 'Nova Receita'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
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
              color: '#fca5a5',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '13px'
            }}>
              {erro}
            </div>
          )}

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '6px' }}>
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
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '6px' }}>
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
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '6px' }}>
              <Briefcase size={14} /> Fonte da Receita
            </label>
            <select
              value={fonte}
              onChange={(e) => setFonte(e.target.value)}
              style={selectStyle}
            >
              {config.fontes_receita.map((f) => (
                <option key={f} value={f} style={{ background: '#1e293b' }}>{f}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '6px' }}>
              <DollarSign size={14} /> Valor (R$)
            </label>
            <input
              type="text"
              placeholder="ex: 3500.00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace', fontSize: '16px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
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
                background: '#10b981',
                border: 'none',
                color: '#fff',
                padding: '10px 22px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
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
  background: '#0f172a',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '10px',
  color: '#f8fafc',
  fontSize: '14px',
  boxSizing: 'border-box'
};

const selectStyle = {
  width: '100%',
  padding: '10px 14px',
  background: '#0f172a',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '10px',
  color: '#f8fafc',
  fontSize: '14px',
  boxSizing: 'border-box',
  cursor: 'pointer'
};
