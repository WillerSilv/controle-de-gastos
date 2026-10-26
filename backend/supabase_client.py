"""Cliente administrativo do Supabase usado pela API Python."""

import os
from functools import lru_cache

from supabase import Client, create_client


@lru_cache
def cliente_supabase() -> Client:
    url = os.getenv("SUPABASE_URL")
    chave = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not chave:
        raise RuntimeError("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.")
    return create_client(url, chave)
