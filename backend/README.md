# API Python

Backend FastAPI do Controle de Gastos. Esta pasta será hospedada separadamente
do React, que continua no GitHub Pages.

## Executar localmente

Na raiz do projeto:

```powershell
py -m pip install -r backend/requirements.txt
py -m uvicorn backend.main:app --reload --port 8000
```

Teste em <http://localhost:8000/health>. A resposta esperada é:

```json
{"status":"ok"}
```

As chaves do Supabase devem ser configuradas no ambiente do backend. Nunca
coloque a `SUPABASE_SERVICE_ROLE_KEY` no front-end ou no GitHub Pages.

## Publicar no Render

1. Crie uma conta em [render.com](https://render.com) e conecte o GitHub.
2. Escolha **New → Blueprint** e selecione este repositório.
3. O Render encontrará o arquivo `render.yaml` na raiz.
4. Confirme a criação do serviço gratuito.
5. Em **Environment**, preencha `SUPABASE_URL` e
   `SUPABASE_SERVICE_ROLE_KEY`.
6. Aguarde o deploy e teste a URL gerada acrescentando `/health`.

O serviço gratuito pode pausar depois de um período sem acessos. O banco
continua no Supabase e não depende do armazenamento local do Render.
