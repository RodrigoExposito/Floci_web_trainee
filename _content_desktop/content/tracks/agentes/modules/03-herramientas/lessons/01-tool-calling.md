# Tool Calling: Agentes que Actúan

Un agente solo es útil si puede **hacer cosas** además de razonar. Las herramientas (tools) son las manos del agente: funciones que puede invocar para interactuar con el mundo real.

## ¿Qué es una tool?

En términos técnicos, una tool es una función Python con:

1. **Nombre**: identificador que el LLM usa para referirse a ella.
2. **Descripción**: texto que explica qué hace (el LLM lo lee para decidir cuándo usarla).
3. **Esquema de parámetros**: qué argumentos acepta y de qué tipo.
4. **Implementación**: el código que se ejecuta.

```python
def buscar_producto(nombre: str, max_precio: float) -> list[dict]:
    """
    Busca productos por nombre con precio máximo.
    Retorna lista de dicts con {id, nombre, precio}.
    """
    # implementación real con DB o API
    ...
```

## Cómo el LLM elige una tool

El LLM recibe la lista de tools disponibles como parte del prompt (o como parámetro especial según la API). Cuando la pregunta del usuario requiere usar una tool, el LLM genera una respuesta estructurada:

```json
{
  "tool": "buscar_producto",
  "args": {
    "nombre": "notebook",
    "max_precio": 800.0
  }
}
```

El **executor** del agente interpreta esta respuesta, llama a la función real con esos argumentos, y devuelve el resultado al LLM como una observación.

## El ciclo completo con tools

```
Usuario: "¿Hay notebooks por menos de $800?"
    ↓
LLM → llama buscar_producto(nombre="notebook", max_precio=800)
    ↓
Executor → ejecuta la función → retorna [{id:1, nombre:"X", precio:650}, ...]
    ↓
LLM → "Encontré 3 notebooks: X ($650), Y ($720), Z ($799)"
    ↓
Usuario recibe la respuesta
```

## Buenas prácticas de diseño de tools

**Una tool, una responsabilidad**: tools pequeñas y específicas son más fáciles de reusar y depurar.

**Errores explícitos**: las tools deben retornar errores claros, no excepciones crudas. El LLM necesita saber qué salió mal para decidir qué hacer.

**Idempotencia cuando sea posible**: si el agente llama a la misma tool dos veces con los mismos args, debería producir el mismo resultado.

**Dry-run mode**: en tools destructivas (borrar archivos, enviar emails), implementá un modo de simulación para testing.

## Tools síncronas vs asíncronas

En sistemas de producción, muchas tools hacen llamadas a APIs o DBs. Es importante declararlas como `async def` y usar `await`:

```python
async def consultar_api(endpoint: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(endpoint)
        return resp.json()
```

Los frameworks modernos (LangGraph, LangChain) manejan el event loop automáticamente.
