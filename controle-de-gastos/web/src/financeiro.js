import { dataValida } from './utils'

export const centavos = (valor) => Math.round(Number(valor) * 100)
export const mesRegistro = (data) => /^\d{2}\/\d{2}\/\d{4}$/.test(data || '') ? `${data.slice(6)}-${data.slice(3, 5)}` : String(data || '').slice(0, 7)
export function compararMes(gastos, receitas, mes) {
  const [ano, numero] = mes.split('-').map(Number)
  const anterior = new Date(ano, numero - 2, 1)
  const chave = `${anterior.getFullYear()}-${String(anterior.getMonth() + 1).padStart(2, '0')}`
  const soma = (itens, m) => itens.filter(i => mesRegistro(i.data) === m).reduce((s, i) => s + centavos(i.valor), 0)
  const g = soma(gastos, mes), ga = soma(gastos, chave)
  const r = soma(receitas, mes), ra = soma(receitas, chave)
  const comparar = (atual, antes) => ({ diferenca: (atual - antes) / 100, percentual: antes === 0 ? null : (atual - antes) / Math.abs(antes) * 100 })
  return { total_gastos: comparar(g, ga), total_receitas: comparar(r, ra), saldo: comparar(r - g, ra - ga) }
}

export function limitesCategoria(limites, gastos, mes) {
  const itens = limites.map(item => {
    const gasto = gastos.filter(g => mesRegistro(g.data) === mes && g.categoria === item.categoria).reduce((s, g) => s + centavos(g.valor), 0) / 100
    const percentual_uso = gasto / Number(item.valor)
    return { ...item, gasto, saldo: (centavos(item.valor) - centavos(gasto)) / 100, percentual_uso, status: percentual_uso >= 1 ? 'excedido' : percentual_uso >= Number(item.alerta) ? 'alerta' : 'normal' }
  })
  const limite_total = itens.reduce((s, i) => s + centavos(i.valor), 0) / 100
  const gasto_total = itens.reduce((s, i) => s + centavos(i.gasto), 0) / 100
  return { mes, itens, limite_total, gasto_total, saldo_total: (centavos(limite_total) - centavos(gasto_total)) / 100 }
}

export function recorrenciaDisponivel(item) {
  if (item.status !== 'ativa' || !dataValida(item.data_inicio)) return false
  const numero = s => s.split('/').reverse().join('')
  return !item.data_fim || (dataValida(item.data_fim) && numero(item.data_inicio) <= numero(item.data_fim))
}

export async function listarTodos(query) {
  const itens = []
  for (let inicio = 0; ; inicio += 500) {
    const { data, error } = await query().range(inicio, inicio + 499)
    if (error) throw error
    itens.push(...(data || []))
    if (!data || data.length < 500) return itens
  }
}
