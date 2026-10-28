import { dataValida } from './utils'
import { centavos } from './financeiro'

export function lerCsv(texto) {
  texto = texto.replace(/^\uFEFF/, '')
  const primeira = texto.split(/\r?\n/)[0]
  const separador = primeira.includes(';') ? ';' : ','
  const linhas = []; let linha = [], campo = '', aspas = false
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (c === '"') {
      if (aspas && texto[i + 1] === '"') { campo += '"'; i++ }
      else aspas = !aspas
    } else if (!aspas && (c === separador || c === '\n' || c === '\r')) {
      linha.push(campo); campo = ''
      if (c !== separador) {
        if (linha.some(v => v.trim())) linhas.push(linha)
        linha = []
        if (c === '\r' && texto[i + 1] === '\n') i++
      }
    } else campo += c
  }
  if (aspas) throw new Error('CSV com aspas não fechadas.')
  linha.push(campo)
  if (linha.some(v => v.trim())) linhas.push(linha)
  return linhas
}
const colunas = tipo => tipo === 'gastos' ? ['data', 'descricao', 'categoria', 'pagamento', 'valor'] : ['data', 'descricao', 'fonte', 'valor']
export function prepararImportacao(tipo, texto, existentes) {
  const linhas = lerCsv(texto)
  if (linhas.length < 2) throw new Error('CSV vazio ou sem registros.')
  const cabecalho = linhas.shift().map(s => s.trim().toLowerCase())
  const campos = colunas(tipo)
  if (!campos.every(c => cabecalho.includes(c))) throw new Error(`Cabeçalho obrigatório: ${campos.join(', ')}.`)
  const chave = item => JSON.stringify(campos.map(c => c === 'valor' ? centavos(item[c]) : String(item[c] ?? '').trim()))
  const vistos = new Set(existentes.map(chave)), registros = [], erros = []
  let duplicados = 0
  linhas.forEach((linha, indice) => {
    const item = Object.fromEntries(campos.map(c => [c, (linha[cabecalho.indexOf(c)] || '').trim()]))
    item.valor = Number(item.valor.replace(',', '.'))
    if (linha.length !== cabecalho.length || !dataValida(item.data) || !Number.isFinite(item.valor) || item.valor <= 0 || campos.some(c => c !== 'valor' && !item[c])) {
      erros.push(`Registro ${indice + 2}: confira os campos, a data e o valor.`); return
    }
    item.valor = centavos(item.valor) / 100
    const id = chave(item)
    if (vistos.has(id)) { duplicados++; return }
    vistos.add(id); registros.push(item)
  })
  return { registros, duplicados, erros }
}
export function gerarCsv(tipo, registros) {
  const campos = colunas(tipo)
  const escapar = valor => `"${String(valor ?? '').replaceAll('"', '""')}"`
  return '\uFEFF' + [campos.join(';'), ...registros.map(i => campos.map(c => escapar(i[c])).join(';'))].join('\r\n')
}
