// Funções compartilhadas pelos componentes.

/** Valida uma data real no formato dd/mm/aaaa (rejeita 31/02, 29/02 em ano comum etc.). */
export function dataValida(texto) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((texto || '').trim());
  if (!m) return false;
  const dia = Number(m[1]);
  const mes = Number(m[2]);
  const ano = Number(m[3]);
  const d = new Date(ano, mes - 1, dia);
  return d.getFullYear() === ano && d.getMonth() === mes - 1 && d.getDate() === dia;
}

export const MSG_DATA_INVALIDA = 'Data inválida. Escolha uma data no calendário (ex.: 15/10/2026).';

// ── Datas: a interface usa dd/mm/aaaa; o calendário usa aaaa-mm-dd ──

/** '15/10/2026' -> '2026-10-15' ('' se o texto não for uma data no formato esperado). */
export function brParaISO(dataBR) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((dataBR || '').trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}

/** '2026-10-15' -> '15/10/2026' ('' se vazio ou fora do formato). */
export function isoParaBR(dataISO) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((dataISO || '').trim());
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

/** Data de hoje como dd/mm/aaaa. */
export function hojeBR() {
  const h = new Date();
  return `${String(h.getDate()).padStart(2, '0')}/${String(h.getMonth() + 1).padStart(2, '0')}/${h.getFullYear()}`;
}

/** Mês atual no formato aaaa-mm. */
export function mesAtualChave() {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Mês que o site abre por padrão: o mês atual, se houver dados nele; senão o mais
 * recente que não seja futuro; se só houver meses futuros, o mais antigo deles.
 * `lista` vem ordenada do mais recente para o mais antigo.
 */
export function escolherMesPadrao(lista) {
  if (!lista || lista.length === 0) return mesAtualChave();
  const atual = mesAtualChave();
  if (lista.includes(atual)) return atual;
  const passado = lista.find((m) => m < atual);
  return passado || lista[lista.length - 1];
}

// ── Ordenação das tabelas ──

/** '15/10/2026' -> 20261015 (para comparar datas). */
export function dataParaNumero(dataBR) {
  const [d, m, a] = String(dataBR || '').split('/');
  return (Number(a) || 0) * 10000 + (Number(m) || 0) * 100 + (Number(d) || 0);
}

/** Ordena uma cópia da lista. `campo`: 'data' | 'valor' | outro campo de texto. */
export function ordenarLista(lista, campo, direcao) {
  const sinal = direcao === 'asc' ? 1 : -1;
  return [...lista].sort((a, b) => {
    let r;
    if (campo === 'data') r = dataParaNumero(a.data) - dataParaNumero(b.data);
    else if (campo === 'valor') r = (a.valor || 0) - (b.valor || 0);
    else r = String(a[campo] ?? '').localeCompare(String(b[campo] ?? ''), 'pt-BR', { sensitivity: 'base' });
    if (r === 0) r = (a.id || 0) - (b.id || 0); // desempate estável: ordem de cadastro
    return r * sinal;
  });
}
