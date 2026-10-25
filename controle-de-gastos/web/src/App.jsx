import React, { useState, useEffect, useCallback, useRef } from 'react';
import AuthGate from './components/AuthGate'
import { escolherMesPadrao, mesAtualChave } from './utils';
import Navbar from './components/Navbar';
import Overview from './components/Overview';
import GastosTable from './components/GastosTable';
import ReceitasTable from './components/ReceitasTable';
import OrcamentoView from './components/OrcamentoView';
import RecorrenciasView from './components/RecorrenciasView';
import MetasView from './components/MetasView';
import ImportExportView from './components/ImportExportView';
import ModalGasto from './components/ModalGasto';
import ModalReceita from './components/ModalReceita';
import Toast from './components/Toast';
import { supabase } from './lib/supabase';


async function usuarioSupabase() {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Usuário não autenticado.');
  return data.user;
}

function mapearRegistroSupabase(item) {
  return { ...item, id: Number(item.id) };
}

function mesDoRegistro(data) {
  if (!data) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
    const [, mes, ano] = data.split('/');
    return `${ano}-${mes}`;
  }
  return String(data).slice(0, 7);
}

function montarHistorico(gastos, receitas, mesFinal) {
  const final = /^\d{4}-(0[1-9]|1[0-2])$/.test(mesFinal || '') ? mesFinal : mesAtualChave();
  const [anoFinal, mesFinalNumero] = final.split('-').map(Number);
  const meses = Array.from({ length: 12 }, (_, indice) => {
    const data = new Date(anoFinal, mesFinalNumero - 1 - (11 - indice), 1);
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
  });
  return meses.map((chave) => ({
    mes: chave,
    receitas: receitas
      .filter((item) => mesDoRegistro(item.data) === chave)
      .reduce((total, item) => total + Number(item.valor || 0), 0),
    gastos: gastos
      .filter((item) => mesDoRegistro(item.data) === chave)
      .reduce((total, item) => total + Number(item.valor || 0), 0),
  })).map((item) => ({ ...item, saldo: item.receitas - item.gastos }));
}

function calcularResumo(gastos, receitas, mes) {
  const gastosMes = gastos.filter((item) => !mes || mesDoRegistro(item.data) === mes);
  const receitasMes = receitas.filter((item) => !mes || mesDoRegistro(item.data) === mes);
  const totalGastos = gastosMes.reduce((total, item) => total + Number(item.valor || 0), 0);
  const totalReceitas = receitasMes.reduce((total, item) => total + Number(item.valor || 0), 0);
  const porCategoria = gastosMes.reduce((acc, item) => {
    const categoria = item.categoria || 'Outros';
    acc[categoria] = (acc[categoria] || 0) + Number(item.valor || 0);
    return acc;
  }, {});
  const formasPagamento = gastosMes.reduce((acc, item) => {
    const forma = item.pagamento || 'Outro';
    acc[forma] = (acc[forma] || 0) + Number(item.valor || 0);
    return acc;
  }, {});
  const comparacaoVazia = { diferenca: 0, percentual: null };
  return {
    mes,
    relatorio: {
      total_gastos: totalGastos,
      total_receitas: totalReceitas,
      saldo: totalReceitas - totalGastos,
      gastos: gastosMes,
      receitas: receitasMes,
      por_categoria: porCategoria,
    },
    comparacao: {
      total_gastos: comparacaoVazia,
      total_receitas: comparacaoVazia,
      saldo: comparacaoVazia,
    },
    orcamento_status: {
      status: 'sem_orcamento',
      orcamento: null,
      percentual: 0,
      mensagem: 'Nenhum orçamento global definido',
    },
    formas_pagamento: formasPagamento,
    historico_saldos: montarHistorico(gastos, receitas, mes),
  };
}

function montarMetas(metas, movimentos) {
  return (metas || []).map((meta) => {
    const itens = (movimentos || []).filter((movimento) => movimento.meta_id === meta.id);
    const saldo = Number(meta.valor_inicial || 0) + itens.reduce((total, movimento) => (
      total + (movimento.tipo === 'retirada' ? -Number(movimento.valor || 0) : Number(movimento.valor || 0))
    ), 0);
    const desejado = Number(meta.valor_desejado || 0);
    return {
      ...meta,
      id: Number(meta.id),
      saldo,
      restante: Math.max(desejado - saldo, 0),
      percentual: desejado ? Math.min((saldo / desejado) * 100, 100) : 0,
      aporte_mensal: 0,
    };
  });
}

function proximaDataRecorrencia(data, frequencia) {
  const partes = String(data || '').split('/').map(Number);
  if (partes.length !== 3 || partes.some(Number.isNaN)) return data;
  const atual = new Date(partes[2], partes[1] - 1, partes[0]);
  if (frequencia === 'semanal') atual.setDate(atual.getDate() + 7);
  else if (frequencia === 'anual') atual.setFullYear(atual.getFullYear() + 1);
  else atual.setMonth(atual.getMonth() + 1);
  return `${String(atual.getDate()).padStart(2, '0')}/${String(atual.getMonth() + 1).padStart(2, '0')}/${atual.getFullYear()}`;
}

export default function App({ user }) {
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [gastos, setGastos] = useState([]);
  const [receitas, setReceitas] = useState([]);
  const [orcamentoInfo, setOrcamentoInfo] = useState({ orcamento: null, alerta: 0.8 });
  const [orcamentosCategoria, setOrcamentosCategoria] = useState({
    mes: '', itens: [], limite_total: 0, gasto_total: 0, saldo_total: 0,
  });
  const [recorrencias, setRecorrencias] = useState([]);
  const [metas, setMetas] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [mesSelecionado, setMesSelecionado] = useState('');
  const [erroResumo, setErroResumo] = useState('');
  const [config, setConfig] = useState({
    categorias: ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Educação', 'Outros'],
    formas_pagamento: ['Dinheiro', 'Pix', 'Débito', 'Crédito'],
    fontes_receita: ['Salário', 'Freelance', 'Presente', 'Investimentos', 'Outros']
  });

  const [modalGastoAberto, setModalGastoAberto] = useState(false);
  const [gastoEmEdicao, setGastoEmEdicao] = useState(null);

  const [modalReceitaAberto, setModalReceitaAberto] = useState(false);
  const [receitaEmEdicao, setReceitaEmEdicao] = useState(null);

  const [toast, setToast] = useState(null);

  const toastTimer = useRef(null);
  const mostrarToast = useCallback((message, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const mensagemDeErro = (err, padrao) =>
    err instanceof TypeError ? 'Falha ao conectar.' : (err.message || padrao);

  // Carrega dados principais
  const carregarDados = useCallback(async () => {
    try {
      const usuario = await usuarioSupabase();
      let [{ data: gastosData, error: gastosError }, { data: receitasData, error: receitasError }, { data: orcamentoData, error: orcamentoError }] = await Promise.all([
        supabase.from('gastos').select('*').eq('user_id', usuario.id).order('id', { ascending: false }),
        supabase.from('receitas').select('*').eq('user_id', usuario.id).order('id', { ascending: false }),
        supabase.from('orcamento_global').select('*').eq('user_id', usuario.id).maybeSingle(),
      ]);

      if (gastosError) throw gastosError;
      if (receitasError) throw receitasError;
      if (orcamentoError) throw orcamentoError;
      const resGastos = (gastosData || []).map(mapearRegistroSupabase);
      const resReceitas = (receitasData || []).map(mapearRegistroSupabase);

      if (!Array.isArray(resGastos) || !Array.isArray(resReceitas)) {
        throw new Error('Os dados retornados pelo Supabase estão em formato inesperado.');
      }

      setGastos(resGastos || []);
      setReceitas(resReceitas || []);
      setOrcamentoInfo(orcamentoData ? { orcamento: Number(orcamentoData.valor), alerta: Number(orcamentoData.alerta) } : { orcamento: null, alerta: 0.8 });
      const [{ data: recorrenciasData, error: recorrenciasError }, { data: metasData, error: metasError }, { data: movimentosData, error: movimentosError }] = await Promise.all([
        supabase.from('recorrencias').select('*').eq('user_id', usuario.id).order('id', { ascending: false }),
        supabase.from('metas').select('*').eq('user_id', usuario.id).order('id', { ascending: false }),
        supabase.from('meta_movimentos').select('*').eq('user_id', usuario.id),
      ]);
      if (recorrenciasError) throw recorrenciasError;
      if (metasError) throw metasError;
      if (movimentosError) throw movimentosError;
      const resRecorrencias = (recorrenciasData || []).map((item) => ({ ...item, id: Number(item.id), proxima_data: item.data_inicio }));
      setRecorrencias(resRecorrencias);
      setMetas(montarMetas(metasData, movimentosData));

      // Extrai lista única de meses ordenados decrescente
      const setMeses = new Set();
      (resGastos || []).forEach((g) => {
        if (g.data && g.data.length === 10) {
          const [, m, a] = g.data.split('/');
          setMeses.add(`${a}-${m}`);
        }
      });
      (resReceitas || []).forEach((r) => {
        if (r.data && r.data.length === 10) {
          const [, m, a] = r.data.split('/');
          setMeses.add(`${a}-${m}`);
        }
      });

      const listaMeses = Array.from(setMeses).sort().reverse();
      // Define mês padrão se ainda não tiver
      setMesSelecionado((atual) => {
        if (/^\d{4}-(0[1-9]|1[0-2])$/.test(atual)) return atual;
        return escolherMesPadrao(listaMeses);
      });
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      mostrarToast('Falha ao carregar os dados da sua conta.', 'error');
    }
  }, [mostrarToast]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Carrega resumo do mês selecionado
  const pedidoResumo = useRef(0);
  const carregarResumo = useCallback(async (mes) => {
    const meuPedido = ++pedidoResumo.current;
    setErroResumo('');
    setResumo(null);
    try {
      const usuario = await usuarioSupabase();
      const [{ data: gastosData, error: gastosError }, { data: receitasData, error: receitasError }] = await Promise.all([
        supabase.from('gastos').select('*').eq('user_id', usuario.id),
        supabase.from('receitas').select('*').eq('user_id', usuario.id),
      ]);
      if (gastosError) throw gastosError;
      if (receitasError) throw receitasError;
      const data = calcularResumo(gastosData || [], receitasData || [], mes);
      const { data: budgetData, error: budgetError } = await supabase
        .from('orcamento_global')
        .select('valor, alerta')
        .eq('user_id', usuario.id)
        .maybeSingle();
      if (budgetError) throw budgetError;
      const orcamento = budgetData ? Number(budgetData.valor) : null;
      const percentual = orcamento ? data.relatorio.total_gastos / orcamento : 0;
      const alerta = Number(budgetData?.alerta || 0.8);
      const status = orcamento === null ? 'sem_orcamento' : percentual >= 1 ? 'estourado' : percentual >= alerta ? 'alerta' : 'dentro';
      data.orcamento_status = {
        status,
        orcamento,
        percentual,
        mensagem: orcamento === null ? 'Nenhum orçamento global definido' : status === 'estourado' ? 'Orçamento ultrapassado' : status === 'alerta' ? 'Atenção: limite de orçamento próximo' : 'Orçamento dentro do limite',
      };
      if (meuPedido === pedidoResumo.current) setResumo(data);
    } catch (err) {
      if (meuPedido === pedidoResumo.current) setErroResumo(err.message);
    }
  }, []);

  const carregarOrcamentosCategoria = useCallback(async (mes) => {
    if (!mes) return;
    try {
      const usuario = await usuarioSupabase();
      const { data, error } = await supabase.from('orcamento_categoria')
        .select('*').eq('user_id', usuario.id).eq('mes', mes).order('categoria');
      if (error) throw error;
      const itens = data || [];
      const gastoTotal = gastos.filter((item) => mesDoRegistro(item.data) === mes)
        .reduce((total, item) => total + Number(item.valor || 0), 0);
      const limiteTotal = itens.reduce((total, item) => total + Number(item.valor || 0), 0);
      setOrcamentosCategoria({
        mes,
        itens,
        limite_total: limiteTotal,
        gasto_total: gastoTotal,
        saldo_total: limiteTotal - gastoTotal,
      });
    } catch (err) {
      mostrarToast(err.message, 'error');
    }
  }, [gastos, mostrarToast]);

  useEffect(() => {
    carregarResumo(mesSelecionado);
    carregarOrcamentosCategoria(mesSelecionado);
  }, [mesSelecionado, carregarResumo, carregarOrcamentosCategoria]);

  // CRUD Gastos
  const handleSalvarGasto = async (dadosGasto) => {
    try {
      const isEdicao = dadosGasto.id !== undefined;
      const usuario = await usuarioSupabase();
      const payload = { ...dadosGasto, user_id: usuario.id };
      delete payload.id;
      const query = isEdicao
        ? supabase.from('gastos').update(payload).eq('id', dadosGasto.id).eq('user_id', usuario.id)
        : supabase.from('gastos').insert(payload);
      const { error } = await query;
      if (error) throw error;

      mostrarToast(isEdicao ? 'Gasto atualizado com sucesso!' : 'Gasto cadastrado com sucesso!');
      setModalGastoAberto(false);
      setGastoEmEdicao(null);
      await carregarDados();
      if (mesSelecionado) carregarResumo(mesSelecionado);
    } catch (err) {
      console.error(err);
      mostrarToast(mensagemDeErro(err, 'Erro ao processar gasto.'), 'error');
      await carregarDados();
    }
  };

  const handleExcluirGasto = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este gasto?')) return;
    try {
      const usuario = await usuarioSupabase();
      const { error } = await supabase.from('gastos').delete().eq('id', id).eq('user_id', usuario.id);
      if (error) throw error;
      mostrarToast('Gasto excluído com sucesso.');
      await carregarDados();
      if (mesSelecionado) carregarResumo(mesSelecionado);
    } catch (err) {
      mostrarToast(mensagemDeErro(err, 'Erro ao excluir gasto.'), 'error');
      await carregarDados();
    }
  };

  // CRUD Receitas
  const handleSalvarReceita = async (dadosReceita) => {
    try {
      const isEdicao = dadosReceita.id !== undefined;
      const usuario = await usuarioSupabase();
      const payload = { ...dadosReceita, user_id: usuario.id };
      delete payload.id;
      const query = isEdicao
        ? supabase.from('receitas').update(payload).eq('id', dadosReceita.id).eq('user_id', usuario.id)
        : supabase.from('receitas').insert(payload);
      const { error } = await query;
      if (error) throw error;

      mostrarToast(isEdicao ? 'Receita atualizada com sucesso!' : 'Receita cadastrada com sucesso!');
      setModalReceitaAberto(false);
      setReceitaEmEdicao(null);
      await carregarDados();
      if (mesSelecionado) carregarResumo(mesSelecionado);
    } catch (err) {
      console.error(err);
      mostrarToast(mensagemDeErro(err, 'Erro ao processar receita.'), 'error');
      await carregarDados();
    }
  };

  const handleExcluirReceita = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta receita?')) return;
    try {
      const usuario = await usuarioSupabase();
      const { error } = await supabase.from('receitas').delete().eq('id', id).eq('user_id', usuario.id);
      if (error) throw error;
      mostrarToast('Receita excluída com sucesso.');
      await carregarDados();
      if (mesSelecionado) carregarResumo(mesSelecionado);
    } catch (err) {
      mostrarToast(mensagemDeErro(err, 'Erro ao excluir receita.'), 'error');
      await carregarDados();
    }
  };

  // Orçamento
  const handleSalvarOrcamento = async (valor, alerta) => {
    try {
      const usuario = await usuarioSupabase();
      const { error } = await supabase.from('orcamento_global').upsert({
        user_id: usuario.id, valor: Number(valor), alerta: Number(alerta),
      }, { onConflict: 'user_id' });
      if (error) throw error;
      mostrarToast('Configuração de orçamento atualizada com sucesso!');
      await carregarDados();
      if (mesSelecionado) carregarResumo(mesSelecionado);
    } catch (err) {
      mostrarToast(mensagemDeErro(err, 'Erro ao salvar orçamento.'), 'error');
    }
  };

  const handleSalvarOrcamentoCategoria = async (dados) => {
    try {
      const edicao = dados.id !== undefined;
      const usuario = await usuarioSupabase();
      const payload = {
        user_id: usuario.id,
        mes: dados.mes || mesSelecionado,
        categoria: dados.categoria,
        valor: Number(dados.valor),
        alerta: Number(dados.alerta || 0.8),
      };
      const query = edicao
        ? supabase.from('orcamento_categoria').update(payload).eq('id', dados.id).eq('user_id', usuario.id)
        : supabase.from('orcamento_categoria').upsert(payload, { onConflict: 'user_id,mes,categoria' });
      const { error } = await query;
      if (error) throw error;
      mostrarToast(edicao ? 'Limite atualizado com sucesso!' : 'Limite criado com sucesso!');
      await carregarOrcamentosCategoria(dados.mes || mesSelecionado);
    } catch (err) {
      mostrarToast(mensagemDeErro(err, 'Erro ao salvar limite por categoria.'), 'error');
    }
  };

  const handleExcluirOrcamentoCategoria = async (id) => {
    if (!window.confirm('Excluir este limite de categoria?')) return;
    try {
      const usuario = await usuarioSupabase();
      const { error } = await supabase.from('orcamento_categoria').delete()
        .eq('id', id).eq('user_id', usuario.id);
      if (error) throw error;
      mostrarToast('Limite excluído com sucesso.');
      await carregarOrcamentosCategoria(mesSelecionado);
    } catch (err) {
      mostrarToast(mensagemDeErro(err, 'Erro ao excluir limite por categoria.'), 'error');
    }
  };

  const recarregarPlanejamento = async () => {
    const usuario = await usuarioSupabase();
    const [{ data: r, error }, { data: m, error: metasError }, { data: movimentos, error: movimentosError }] = await Promise.all([
      supabase.from('recorrencias').select('*').eq('user_id', usuario.id).order('id', { ascending: false }),
      supabase.from('metas').select('*').eq('user_id', usuario.id).order('id', { ascending: false }),
      supabase.from('meta_movimentos').select('*').eq('user_id', usuario.id),
    ]);
    if (error) throw error;
    if (metasError) throw metasError;
    if (movimentosError) throw movimentosError;
    setRecorrencias((r || []).map((item) => ({ ...item, id: Number(item.id), proxima_data: item.data_inicio })));
    setMetas(montarMetas(m, movimentos));
  };
  const salvarRecorrencia = async (dados) => { const usuario = await usuarioSupabase(); const { error } = await supabase.from('recorrencias').insert({ ...dados, user_id: usuario.id, valor: Number(dados.valor) }); if (error) throw error; await recarregarPlanejamento(); mostrarToast('Recorrência criada.'); };
  const excluirRecorrencia = async (id) => { if (!window.confirm('Excluir esta recorrência?')) return; const usuario = await usuarioSupabase(); const { error } = await supabase.from('recorrencias').delete().eq('id', id).eq('user_id', usuario.id); if (error) throw error; await recarregarPlanejamento(); };
  const confirmarRecorrencia = async (id) => {
    const item = recorrencias.find((recorrencia) => recorrencia.id === id);
    if (!item?.proxima_data) return;
    const usuario = await usuarioSupabase();
    const { error: gastoError } = await supabase.from('gastos').insert({
      user_id: usuario.id, data: item.proxima_data, descricao: item.descricao,
      categoria: item.categoria, pagamento: item.pagamento, valor: Number(item.valor),
    });
    if (gastoError) throw gastoError;
    const novaData = proximaDataRecorrencia(item.proxima_data, item.frequencia);
    const { error: atualizacaoError } = await supabase.from('recorrencias').update({ data_inicio: novaData }).eq('id', id).eq('user_id', usuario.id);
    if (atualizacaoError) throw atualizacaoError;
    await Promise.all([recarregarPlanejamento(), carregarDados(), carregarResumo(mesSelecionado)]);
    mostrarToast('Ocorrência confirmada.');
  };
  const alternarRecorrencia = async (item) => { const usuario = await usuarioSupabase(); const { error } = await supabase.from('recorrencias').update({ status: item.status === 'ativa' ? 'pausada' : 'ativa' }).eq('id', item.id).eq('user_id', usuario.id); if (error) throw error; await recarregarPlanejamento(); };
  const salvarMeta = async (dados) => { const usuario = await usuarioSupabase(); const { error } = await supabase.from('metas').insert({ ...dados, user_id: usuario.id, valor_desejado: Number(dados.valor_desejado), valor_inicial: Number(dados.valor_inicial || 0) }); if (error) throw error; await recarregarPlanejamento(); mostrarToast('Meta criada.'); };
  const excluirMeta = async (id) => { if (!window.confirm('Excluir esta meta e seu histórico?')) return; const usuario = await usuarioSupabase(); const { error } = await supabase.from('metas').delete().eq('id', id).eq('user_id', usuario.id); if (error) throw error; await recarregarPlanejamento(); };
  const movimentoMeta = async (id, dados) => { if (!dados.valor || dados.valor <= 0) return mostrarToast('Informe um valor válido.', 'error'); const usuario = await usuarioSupabase(); const { error } = await supabase.from('meta_movimentos').insert({ ...dados, meta_id: id, user_id: usuario.id, valor: Number(dados.valor) }); if (error) throw error; await recarregarPlanejamento(); };
  const statusMeta = async (meta, status) => { const usuario = await usuarioSupabase(); const { error } = await supabase.from('metas').update({ status }).eq('id', meta.id).eq('user_id', usuario.id); if (error) throw error; await recarregarPlanejamento(); };
  const importar = async (tipo, csv) => {
    const usuario = await usuarioSupabase();
    const linhas = csv.trim().split(/\r?\n/).filter(Boolean);
    if (linhas.length < 2) throw new Error('CSV vazio ou sem cabeçalho.');
    const separador = linhas[0].includes(';') ? ';' : ',';
    const cabecalho = linhas.shift().split(separador).map((item) => item.trim().toLowerCase());
    const registros = linhas.map((linha) => {
      const valores = linha.split(separador).map((item) => item.trim());
      const registro = Object.fromEntries(cabecalho.map((chave, indice) => [chave, valores[indice] || '']));
      return tipo === 'gastos'
        ? { user_id: usuario.id, data: registro.data, descricao: registro.descricao, categoria: registro.categoria || 'Outros', pagamento: registro.pagamento || 'Pix', valor: Number(String(registro.valor).replace(',', '.')) }
        : { user_id: usuario.id, data: registro.data, descricao: registro.descricao, fonte: registro.fonte || 'Outros', valor: Number(String(registro.valor).replace(',', '.')) };
    }).filter((item) => item.data && item.descricao && item.valor > 0);
    const { error } = await supabase.from(tipo).insert(registros);
    if (error) throw error;
    await Promise.all([carregarDados(), carregarResumo(mesSelecionado)]);
    return { importados: registros.length, duplicados: 0, erros: [] };
  };
  const exportar = async (tipo) => {
    const usuario = await usuarioSupabase();
    const tipos = tipo === 'ambos' ? ['gastos', 'receitas'] : [tipo];
    const arquivos = [];
    for (const tabela of tipos) {
      const { data, error } = await supabase.from(tabela).select('*').eq('user_id', usuario.id).order('id');
      if (error) throw error;
      const colunas = tabela === 'gastos' ? ['data', 'descricao', 'categoria', 'pagamento', 'valor'] : ['data', 'descricao', 'fonte', 'valor'];
      const linhas = [colunas.join(';'), ...(data || []).map((item) => colunas.map((coluna) => String(item[coluna] ?? '').replaceAll(';', ',')).join(';'))];
      arquivos.push({ nome: `${tabela}.csv`, conteudo: linhas.join('\n') });
    }
    for (const arquivo of arquivos) {
      const url = URL.createObjectURL(new Blob([arquivo.conteudo], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a'); link.href = url; link.download = arquivo.nome; link.click(); URL.revokeObjectURL(url);
    }
  };

  return (
    <AuthGate>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        user={user}
        abaAtiva={abaAtiva}
        setAbaAtiva={setAbaAtiva}
        mesSelecionado={mesSelecionado}
        setMesSelecionado={setMesSelecionado}
      />

      <main className="app-main" style={{ flex: 1, maxWidth: '1280px', margin: '0 auto', width: '100%', padding: '32px 24px', minWidth: 0 }}>
        {abaAtiva === 'dashboard' && (
          <Overview
            resumo={resumo}
            erro={erroResumo}
            onNovoGasto={() => {
              setGastoEmEdicao(null);
              setModalGastoAberto(true);
            }}
            onNovaReceita={() => {
              setReceitaEmEdicao(null);
              setModalReceitaAberto(true);
            }}
          />
        )}

        {abaAtiva === 'gastos' && (
          <GastosTable
            gastos={gastos}
            config={config}
            mesSelecionado={mesSelecionado}
            onNovoGasto={() => {
              setGastoEmEdicao(null);
              setModalGastoAberto(true);
            }}
            onEditarGasto={(g) => {
              setGastoEmEdicao(g);
              setModalGastoAberto(true);
            }}
            onExcluirGasto={handleExcluirGasto}
          />
        )}

        {abaAtiva === 'receitas' && (
          <ReceitasTable
            receitas={receitas}
            config={config}
            mesSelecionado={mesSelecionado}
            onNovaReceita={() => {
              setReceitaEmEdicao(null);
              setModalReceitaAberto(true);
            }}
            onEditarReceita={(r) => {
              setReceitaEmEdicao(r);
              setModalReceitaAberto(true);
            }}
            onExcluirReceita={handleExcluirReceita}
          />
        )}

        {abaAtiva === 'orcamento' && (
          <OrcamentoView
            orcamentoInfo={orcamentoInfo}
            resumo={resumo}
            mesSelecionado={mesSelecionado}
            orcamentosCategoria={orcamentosCategoria}
            onSalvarOrcamento={handleSalvarOrcamento}
            onSalvarOrcamentoCategoria={handleSalvarOrcamentoCategoria}
            onExcluirOrcamentoCategoria={handleExcluirOrcamentoCategoria}
          />
        )}
        {abaAtiva === 'recorrencias' && <RecorrenciasView itens={recorrencias} config={config} onSalvar={salvarRecorrencia} onExcluir={excluirRecorrencia} onConfirmar={confirmarRecorrencia} onAlternar={alternarRecorrencia} />}
        {abaAtiva === 'metas' && <MetasView metas={metas} onSalvar={salvarMeta} onExcluir={excluirMeta} onMovimento={movimentoMeta} onStatus={statusMeta} />}
        {abaAtiva === 'importar' && <ImportExportView onImportar={importar} onExportar={exportar} />}
      </main>

      {/* Modais */}
      <ModalGasto
        isOpen={modalGastoAberto}
        onClose={() => setModalGastoAberto(false)}
        onSave={handleSalvarGasto}
        itemParaEditar={gastoEmEdicao}
        config={config}
      />

      <ModalReceita
        isOpen={modalReceitaAberto}
        onClose={() => setModalReceitaAberto(false)}
        onSave={handleSalvarReceita}
        itemParaEditar={receitaEmEdicao}
        config={config}
      />

      {/* Toast Notificações */}
      <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    </AuthGate>
  );
}
