"""API Python do Controle de Gastos.

Esta primeira versão expõe apenas uma rota de saúde. Os endpoints de dados
serão adicionados depois que a conexão com o Supabase for validada.
"""

import os
from datetime import datetime
from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

from .supabase_client import cliente_supabase


app = FastAPI(title="Controle de Gastos API", version="1.0.0")

origens_permitidas = [
    origem.strip()
    for origem in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,https://willersilv.github.io",
    ).split(",")
    if origem.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origens_permitidas,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/health")
def health() -> dict[str, str]:
    """Confirma que a API está no ar."""

    return {"status": "ok"}


class GastoEntrada(BaseModel):
    model_config = ConfigDict(extra="ignore")

    data: str = Field(min_length=10, max_length=10)
    descricao: str = Field(min_length=1, max_length=255)
    categoria: str = Field(min_length=1, max_length=100)
    pagamento: str = Field(min_length=1, max_length=100)
    valor: float = Field(gt=0)


def usuario_id(authorization: Annotated[str | None, Header()] = None) -> str:
    """Valida o JWT enviado pelo front-end e retorna o usuário autenticado."""

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não autenticado.")
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido.")
    try:
        resposta = cliente_supabase().auth.get_user(token)
        usuario = getattr(resposta, "user", None)
    except Exception as erro:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido.") from erro
    if not usuario or not getattr(usuario, "id", None):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não autenticado.")
    return usuario.id


def validar_data(valor: str) -> str:
    try:
        datetime.strptime(valor, "%d/%m/%Y")
    except ValueError as erro:
        raise HTTPException(status_code=400, detail="Data inválida. Use o formato dd/mm/aaaa.") from erro
    return valor


@app.get("/api/gastos")
def listar_gastos(user_id: Annotated[str, Depends(usuario_id)]) -> list[dict]:
    resposta = (
        cliente_supabase()
        .table("gastos")
        .select("id,data,descricao,categoria,pagamento,valor,criado_em")
        .eq("user_id", user_id)
        .order("id", desc=True)
        .execute()
    )
    return resposta.data or []


@app.post("/api/gastos", status_code=status.HTTP_201_CREATED)
def criar_gasto(
    entrada: GastoEntrada,
    user_id: Annotated[str, Depends(usuario_id)],
) -> dict:
    validar_data(entrada.data)
    resposta = (
        cliente_supabase()
        .table("gastos")
        .insert({**entrada.model_dump(), "user_id": user_id})
        .execute()
    )
    return resposta.data[0] if resposta.data else {"sucesso": True}


@app.put("/api/gastos/{gasto_id}")
def atualizar_gasto(
    gasto_id: int,
    entrada: GastoEntrada,
    user_id: Annotated[str, Depends(usuario_id)],
) -> dict:
    validar_data(entrada.data)
    resposta = (
        cliente_supabase()
        .table("gastos")
        .update(entrada.model_dump())
        .eq("id", gasto_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not resposta.data:
        raise HTTPException(status_code=404, detail="Gasto não encontrado.")
    return resposta.data[0]


@app.delete("/api/gastos/{gasto_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_gasto(
    gasto_id: int,
    user_id: Annotated[str, Depends(usuario_id)],
) -> None:
    resposta = (
        cliente_supabase()
        .table("gastos")
        .delete()
        .eq("id", gasto_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not resposta.data:
        raise HTTPException(status_code=404, detail="Gasto não encontrado.")
