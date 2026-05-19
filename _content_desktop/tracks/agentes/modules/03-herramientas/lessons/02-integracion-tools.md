# Integración de Tools en un Agente

Diseñar tools individuales es solo el primer paso. El desafío real está en integrarlas correctamente dentro del agente y manejar los casos de error.

## Registro de tools

Un agente mantiene un **registro** (diccionario o lista) de las tools disponibles. Cuando el LLM indica que quiere usar una tool, el executor la busca en el registro y la ejecuta.

```python
class AgenteConTools:
    def __init__(self):
        self.tools = {}

    def registrar_tool(self, nombre, funcion, descripcion):
        self.tools[nombre] = {
            "funcion": funcion,
            "descripcion": descripcion,
        }

    def ejecutar_tool(self, nombre, **kwargs):
        if nombre not in self.tools:
            return f"Error: tool '{nombre}' no encontrada"
        return self.tools[nombre]["funcion"](**kwargs)
```

## Manejo de errores en tools

Las tools pueden fallar. El agente debe manejar estos casos sin romper el flujo:

```python
def ejecutar_tool_segura(self, nombre, **kwargs):
    try:
        resultado = self.tools[nombre]["funcion"](**kwargs)
        return {"ok": True, "resultado": resultado}
    except KeyError:
        return {"ok": False, "error": f"Tool '{nombre}' no encontrada"}
    except Exception as e:
        return {"ok": False, "error": str(e)}
```

Devolver un resultado estructurado (en lugar de lanzar la excepción) permite al LLM decidir qué hacer con el error.

## Tool chaining

Los agentes más poderosos encadenan tools: el resultado de una tool se convierte en el input de la siguiente.

```
buscar_usuario(email) → obtiene user_id
    ↓
obtener_pedidos(user_id) → obtiene lista de pedidos
    ↓
calcular_total(pedidos) → suma el monto
```

Para esto, el agente necesita pasar el contexto entre llamadas. La forma más simple es incluir los resultados intermedios en el historial del LLM.

## Tools con estado vs sin estado

**Sin estado** (puras): producen el mismo output dado el mismo input. Son las más fáciles de testear y predecir.

**Con estado**: modifican algún recurso externo (enviar un email, insertar en BD). Requieren:
- Confirmación antes de ejecutar (human-in-the-loop).
- Registro de la acción para auditoría.
- Rollback si algo sale mal.

En producción, las tools con estado deben loguear cada invocación con timestamp, argumentos y resultado.

## Paralelismo de tools

LangGraph y otros frameworks permiten ejecutar múltiples tools en paralelo cuando no tienen dependencias entre sí. Esto reduce el tiempo total del agente significativamente:

```
# Secuencial: 3 s + 2 s + 4 s = 9 s
buscar_clima() → buscar_noticias() → buscar_precio()

# Paralelo: max(3, 2, 4) = 4 s
buscar_clima() ──┐
buscar_noticias() ─→ [combinar resultados]
buscar_precio() ──┘
```

Identificar qué tools pueden correr en paralelo es una optimización clave en agentes de producción.
