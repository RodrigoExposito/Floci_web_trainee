# Tipos de Memoria en Agentes IA

La memoria es lo que distingue a un agente que aprende de uno que olvida. Existen cuatro tipos, cada uno con un propósito distinto.

## 1. Memoria Sensorial

Es la memoria inmediata: el input que el agente acaba de recibir (texto, imagen, audio). No persiste entre turnos. Es equivalente a lo que percibís en este momento antes de procesarlo.

En la práctica, es el contenido del mensaje más reciente en el contexto del LLM.

## 2. Memoria de Corto Plazo (Contexto)

Es el historial de la conversación actual: todos los mensajes desde que empezó la sesión. El LLM la recibe completa en cada llamada.

**Limitación crítica**: los LLMs tienen una ventana de contexto finita (8K, 32K, 128K tokens). Cuando la conversación es muy larga, hay que truncar, resumir o comprimir el historial.

```python
historial = [
    {"rol": "sistema", "contenido": "Sos un asistente experto en AWS"},
    {"rol": "usuario", "contenido": "¿Cómo funciona S3?"},
    {"rol": "asistente", "contenido": "S3 es un servicio de almacenamiento..."},
    {"rol": "usuario", "contenido": "¿Y SQS?"},
]
```

## 3. Memoria de Largo Plazo (Vectorial)

Persiste entre sesiones. Almacena información como vectores numéricos (embeddings) en una base de datos especializada (Chroma, Pinecone, pgvector).

Para recuperar, se hace una **búsqueda por similitud semántica**: se convierte la query a un vector y se buscan los vectores más cercanos.

Esto permite al agente recordar preferencias del usuario, contexto de proyectos pasados y conocimiento específico del dominio.

## 4. Memoria Episódica

Registro de acciones pasadas: qué hizo el agente, qué resultados obtuvo, qué errores cometió. Permite aprender de la experiencia y evitar repetir errores.

En producción se implementa como logs estructurados que el agente puede consultar.

## Cuándo usar cada tipo

| Necesidad | Tipo de memoria |
|-----------|----------------|
| Contexto de la sesión actual | Corto plazo (historial) |
| Preferencias del usuario | Largo plazo (vectorial) |
| Documentos de referencia | Largo plazo (RAG) |
| Historial de acciones | Episódica |
| Input actual | Sensorial |

## Gestión del contexto

El error más común es acumular todo en el historial hasta que el LLM pierde coherencia o se corta el contexto. Las estrategias de manejo son:

- **Summarization**: resumir mensajes viejos en un párrafo.
- **Sliding window**: conservar solo los últimos N mensajes.
- **Retrieval-based**: almacenar en vectores y recuperar solo lo relevante.

En producción se combinan: historial reciente + recuperación de contexto relevante de largo plazo.
