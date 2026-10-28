import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'

test('cálculos, categorias e CSV', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { compararMes, limitesCategoria, recorrenciaDisponivel } = await server.ssrLoadModule('/src/financeiro.js')
    const { gerarCsv, prepararImportacao } = await server.ssrLoadModule('/src/csv.js')
    const gastos = [{ data: '01/01/2026', valor: 100, categoria: 'Casa' }, { data: '01/02/2026', valor: 200, categoria: 'Casa' }, { data: '02/02/2026', valor: 50, categoria: 'Outra' }]
    assert.equal(compararMes(gastos, [], '2026-02').total_gastos.diferenca, 150)
    assert.equal(compararMes(gastos, [], '2026-02').total_gastos.percentual, 150)
    const limites = limitesCategoria([{ categoria: 'Casa', valor: 150, alerta: .8 }], gastos, '2026-02')
    assert.equal(limites.itens[0].status, 'excedido')
    assert.equal(limites.itens[0].saldo, -50)
    assert.equal(limites.gasto_total, 200, 'soma apenas categorias com limite')
    assert.equal(recorrenciaDisponivel({ status: 'pausada', data_inicio: '01/02/2026' }), false)
    assert.equal(recorrenciaDisponivel({ status: 'ativa', data_inicio: '01/03/2026', data_fim: '28/02/2026' }), false)
    const item = { data: '01/02/2026', descricao: 'Compra; "especial"\nsegunda linha', categoria: 'Casa', pagamento: 'Pix', valor: 123.45 }
    const csv = gerarCsv('gastos', [item, item])
    const resultado = prepararImportacao('gastos', csv, [])
    assert.deepEqual(resultado.registros, [item])
    assert.equal(resultado.duplicados, 1)
    assert.equal(prepararImportacao('gastos', csv, [item]).duplicados, 2)
    const invalido = gerarCsv('gastos', [{ ...item, data: '31/02/2026' }])
    assert.equal(prepararImportacao('gastos', invalido, []).erros.length, 1)
  } finally { await server.close() }
})
