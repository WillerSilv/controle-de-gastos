# Controle de Gastos Pessoais

Este é um projeto de controle financeiro pessoal feito para facilitar o acompanhamento de receitas, gastos e metas.

A aplicação permite registrar o dinheiro que entra e sai, acompanhar o orçamento do mês, criar limites por categoria, cadastrar despesas recorrentes e visualizar a evolução financeira ao longo do tempo.

O projeto começou como uma aplicação local em Python e SQLite. Durante o desenvolvimento, a parte principal foi modernizada para uma aplicação web com React, Vite e Supabase. A versão atual usa autenticação, banco de dados na nuvem e separação dos dados por usuário.

## Tecnologias usadas

- React e Vite para a interface;
- Supabase para autenticação e banco de dados PostgreSQL;
- JavaScript e CSS para as funcionalidades e o visual;

## O que já dá para fazer

- criar uma conta e entrar com e-mail e senha;
- cadastrar, editar, excluir e filtrar gastos;
- cadastrar, editar, excluir e filtrar receitas;
- definir um orçamento mensal;
- criar limites de gastos por categoria;
- acompanhar despesas recorrentes;
- criar metas financeiras e registrar aportes ou retiradas;
- importar e exportar dados em CSV;
- acompanhar gráficos de gastos, receitas e saldo;
- criar categorias personalizadas além das categorias padrão.

## Como executar no computador

Você precisa ter o Node.js instalado.

Abra o terminal na pasta `controle-de-gastos/web` e execute:

```powershell
npm install
npm.cmd run dev
```

Depois, abra no navegador:

```text
http://localhost:5173
```

Para gerar e visualizar a versão de produção:

```powershell
npm.cmd run build
npm.cmd run preview
```

## Configuração do Supabase

1. Crie um projeto no Supabase.
2. Abra o **SQL Editor** do projeto.
3. Execute o conteúdo de `controle-de-gastos/sql/schema_supabase.sql`.
4. Crie o arquivo `controle-de-gastos/web/.env` a partir de `controle-de-gastos/web/.env.example`.
5. Preencha as variáveis com os dados do seu projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica
```

O arquivo `.env` é local e não deve ser publicado. Ele já está protegido pelo `.gitignore`.

## Organização das pastas

```text
controle-de-gastos/
├── web/                    # aplicação React atual
├── sql/
│   ├── schema_supabase.sql # banco usado pela aplicação atual
│   └── archive/            # scripts antigos do MySQL e SQLite
├── backup/
│   ├── legacy-python/      # backend e testes da versão antiga
│   ├── local-data/         # banco SQLite local
│   └── reports/            # relatórios antigos
├── dist/                   # build local, ignorado
└── README.md
```

Os arquivos antigos foram mantidos como referência e backup. Eles não foram apagados e estão fora da publicação.

## Sobre o projeto

Este projeto foi desenvolvido como parte do aprendizado em Sistemas de Informação. A ideia é continuar evoluindo a aplicação, melhorando a experiência de uso, a segurança e a organização do código conforme novas funcionalidades forem sendo estudadas.
