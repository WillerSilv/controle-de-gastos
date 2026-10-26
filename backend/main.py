"""API Python do Controle de Gastos.

Esta primeira versão expõe apenas uma rota de saúde. Os endpoints de dados
serão adicionados depois que a conexão com o Supabase for validada.
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


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
