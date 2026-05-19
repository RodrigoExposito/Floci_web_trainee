# Anatomía de un Agente IA

Todo agente de producción tiene los mismos componentes internos. Entenderlos te permite diseñarlos mejor y depurarlos cuando fallan.

## Los 5 componentes clave

### 1. LLM (Cerebro)
El modelo de lenguaje es el motor de razonamiento. Recibe el contexto completo (historial, herramientas disponibles, instrucciones del sistema) y decide la próxima acción.

El LLM **no actúa**; solo razona y genera texto estructurado que el agente interpreta como una instrucción.

### 2. Memoria
El agente necesita recordar qué hizo y qué aprendió:

- **Memoria de corto plazo**: el contexto de la conversación actual (lista de mensajes en RAM).
- **Memoria de largo plazo**: vectores en una base de datos (Chroma, Pinecone) que persisten entre sesiones.

Sin memoria, cada turno empieza desde cero.

### 3. Herramientas (Tools)
Las tools son funciones Python que el agente puede llamar. Ejemplos:

```python
def buscar_web(query: str) -> str: ...
def leer_archivo(path: str) -> str: ...
def ejecutar_sql(query: str) -> list: ...
```

Cada tool tiene un nombre, descripción y esquema de parámetros. El LLM elige qué tool usar y con qué argumentos.

### 4. Planner / Executor
El planner interpreta la decisión del LLM ("llamar tool X con args Y") y la ejecuta. Maneja:

- El bucle de razonamiento (mientras no terminado: razona → actúa → observa).
- El límite de iteraciones.
- La serialización de resultados de vuelta al contexto.

### 5. Salida final
Cuando el LLM determina que tiene suficiente información, genera la respuesta final al usuario. En algunos sistemas esto activa un paso de revisión o formato.

## El flujo completo

```
Usuario: "Resumí las ventas del Q3"
    ↓
[LLM] → "Necesito leer el archivo ventas_q3.csv"
    ↓
[Executor] → ejecuta read_file("ventas_q3.csv") → retorna CSV
    ↓
[LLM] → "Ahora calculo los totales"
    ↓
[Executor] → ejecuta calculate_totals(data) → retorna dict
    ↓
[LLM] → "Tengo suficiente, genero el resumen"
    ↓
Usuario: "Las ventas del Q3 fueron $1.2M, +15% vs Q2..."
```

## Estado del agente

En cada iteración, el estado contiene:
- El objetivo original.
- El historial de acciones tomadas.
- Los resultados de cada tool.
- Las observaciones del entorno.

Diseñar un estado claro y tipado es la diferencia entre un agente mantenible y uno caótico.
