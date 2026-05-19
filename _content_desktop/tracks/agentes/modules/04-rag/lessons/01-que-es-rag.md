# RAG: Retrieval-Augmented Generation

Los LLMs tienen un conocimiento congelado en el tiempo de su entrenamiento. No saben nada de lo que ocurrió después, ni de documentos internos de tu empresa, ni de datos en tiempo real. RAG resuelve esto.

## La idea central

**RAG** (Retrieval-Augmented Generation) combina dos capacidades:

1. **Recuperación** (Retrieval): buscar los fragmentos de información más relevantes para la pregunta.
2. **Generación** (Generation): pasarle esos fragmentos al LLM como contexto adicional para que genere una respuesta informada.

En vez de esperar que el LLM "sepa" la respuesta de memoria, le damos la información exacta que necesita justo antes de responder.

## El problema que RAG resuelve

Sin RAG:
```
Usuario: "¿Cuál fue la política de vacaciones de 2024?"
LLM: "No tengo acceso a los documentos internos de tu empresa."
```

Con RAG:
```
Usuario: "¿Cuál fue la política de vacaciones de 2024?"
  ↓
[Sistema RAG recupera el doc HR-2024-vacaciones.pdf]
  ↓
LLM recibe: "Contexto: [fragmento relevante del PDF]"
LLM responde: "Según la política de 2024, los empleados tienen..."
```

## El pipeline RAG

### Fase 1: Indexación (se hace una vez)

```
Documentos → Chunking → Embeddings → Base de datos vectorial
```

1. Dividir documentos en fragmentos (chunks) de 200-500 tokens.
2. Convertir cada chunk a un embedding (vector numérico).
3. Almacenar chunks + vectores en la BD vectorial.

### Fase 2: Consulta (en tiempo real)

```
Pregunta → Embedding → Búsqueda vectorial → Top-K chunks → LLM → Respuesta
```

1. Convertir la pregunta del usuario a un embedding.
2. Buscar los K chunks más similares.
3. Inyectar esos chunks en el prompt del LLM.
4. El LLM genera la respuesta basándose en esa información.

## RAG vs Fine-tuning

| Criterio | RAG | Fine-tuning |
|----------|-----|-------------|
| Actualización del conocimiento | Simple (re-indexar docs) | Requiere re-entrenar |
| Costo | Bajo | Alto |
| Atribución de fuentes | Sí (se sabe qué chunk se usó) | No |
| Alucinaciones | Menos (hay contexto real) | Puede aumentar |
| Conocimiento de dominio muy específico | Menos efectivo | Más efectivo |

Para la mayoría de los casos empresariales, RAG es la opción correcta.

## Limitaciones de RAG

- **Garbage in, garbage out**: si los documentos están mal organizados o son contradictorios, el LLM va a producir respuestas confusas.
- **Ventana de contexto**: no podés meter todos los chunks relevantes si el documento es muy largo.
- **Preguntas que requieren razonamiento multi-documento**: RAG simple no puede combinar información de 5 documentos distintos fácilmente.

Para casos complejos, se usa **Agentic RAG**: un agente que hace múltiples búsquedas y combina los resultados.
