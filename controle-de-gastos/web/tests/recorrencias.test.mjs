import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

test('confirmação SQL: datas, duplicação, pausa, isolamento e rollback', async () => {
  const db = new PGlite()
  try {
    await db.exec(`create schema auth;
      create role anon; create role authenticated;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql as $$select nullif(current_setting('app.uid', true), '')::uuid$$;
      insert into auth.users values ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002');
      set app.uid = '00000000-0000-0000-0000-000000000001';`)
    await db.exec(await readFile(new URL('../../sql/schema_supabase.sql', import.meta.url), 'utf8'))
    await db.exec(await readFile(new URL('../../sql/corrigir_recorrencias.sql', import.meta.url), 'utf8'))
    await db.exec(`insert into public.recorrencias(user_id, descricao, valor, categoria, pagamento, data_inicio, data_fim, frequencia)
      values(auth.uid(), 'Teste', 10, 'Casa', 'Pix', '31/01/2026', '31/03/2026', 'mensal');`)
    const confirmar = data => db.query('select public.confirmar_recorrencia(1, $1) as ok', [data])
    assert.equal((await confirmar('31/01/2026')).rows[0].ok, true)
    assert.equal((await db.query('select data_inicio from recorrencias')).rows[0].data_inicio, '28/02/2026')
    assert.equal((await confirmar('31/01/2026')).rows[0].ok, false)
    await confirmar('28/02/2026')
    assert.equal((await db.query('select data_inicio from recorrencias')).rows[0].data_inicio, '31/03/2026')
    await db.exec("update recorrencias set status='pausada'")
    await assert.rejects(confirmar('31/03/2026'), /ativa/)
    await db.exec("update recorrencias set status='ativa'; set app.uid = '00000000-0000-0000-0000-000000000002'")
    await assert.rejects(confirmar('31/03/2026'), /encontrada/)
    await db.exec("set app.uid = '00000000-0000-0000-0000-000000000001'")
    // Force failure in the second operation: inserted expense must roll back.
    await db.exec("alter table recorrencias add constraint impedir_avanco check (data_inicio <> '30/04/2026')")
    await assert.rejects(confirmar('31/03/2026'))
    assert.equal((await db.query('select count(*)::int as n from gastos')).rows[0].n, 2)
    await db.exec('alter table recorrencias drop constraint impedir_avanco')
    await confirmar('31/03/2026')
    assert.equal((await db.query('select status from recorrencias')).rows[0].status, 'encerrada')
  } finally { await db.close() }
})
