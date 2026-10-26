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
