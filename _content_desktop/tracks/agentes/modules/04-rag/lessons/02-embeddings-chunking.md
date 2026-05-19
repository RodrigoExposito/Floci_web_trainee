# Embeddings y Estrategias de Chunking

La calidad de un sistema RAG depende en gran parte de dos decisiones técnicas: cómo elegís los embeddings y cómo dividís los documentos en chunks.

## Modelos de embeddings

Los embeddings se generan con modelos especializados, distintos a los LLMs de texto:

| Modelo | Dimensiones | Contexto máx. | Uso recomendado |
|--------|-------------|---------------|-----------------|
| text-embedding-3-small | 1536 | 8191 tokens | Producción, bajo costo |
| text-embedding-3-large | 3072 | 8191 tokens | Mayor precisión |
| nomic-embed-text | 768 | 8192 tokens | Open source, local |
| sentence-transformers | 384-768 | 512 tokens | Local, sin API |

Para desarrollo local y este track, usaremos similitud por palabras (TF-IDF simplificado) para evitar dependencias externas.

## Estrategias de chunking

### Fixed-size chunking

El más simple: dividir el texto cada N tokens con un overlap de M tokens.

```python
def chunk_fixed(texto, size=500, overlap=50):
    words = texto.split()
    chunks = []
    for i in range(0, len(words), size - overlap):
        chunk = " ".join(words[i:i + size])
        chunks.append(chunk)
    return chunks
```

**Ventaja**: simple, predecible.  
**Desventaja**: puede cortar oraciones o párrafos en el medio.

### Semantic chunking

Divide el texto respetando límites naturales (párrafos, secciones, oraciones). Más complejo pero produce mejores resultados:

```python
def chunk_by_paragraph(texto):
    return [p.strip() for p in texto.split("\n\n") if p.strip()]
```

### Hierarchical chunking

Crea chunks a múltiples niveles: secciones grandes para contexto, párrafos pequeños para precisión. El sistema recupera primero por sección y luego refina por párrafo.

## El parámetro overlap

El overlap entre chunks asegura que la información cerca de los bordes no se pierda:

```
Chunk 1: [...palabras 1-500...]
Chunk 2: [...palabras 450-950...]   ← overlap de 50 palabras
Chunk 3: [...palabras 900-1400...]
```

Un overlap típico es el 10-20% del tamaño del chunk.

## Metadata en los chunks

Cada chunk debe llevar metadata que permita atribuir las fuentes y hacer búsquedas filtradas:

```python
{
    "texto": "El agente ejecuta la tool buscar_producto...",
    "fuente": "manual-agentes.pdf",
    "pagina": 42,
    "seccion": "Tool Calling",
    "fecha": "2024-11-15",
}
```

## Evaluación de la calidad del chunking

La métrica clave es la **relevancia de recuperación**: dado un set de preguntas de prueba, ¿qué porcentaje de veces el chunk correcto aparece en el Top-3?

Si la recuperación falla, los problemas típicos son:

1. Chunks demasiado pequeños (pierden contexto).
2. Chunks demasiado grandes (incluyen información irrelevante).
3. Overlap insuficiente (cortan conceptos en el límite).
4. Embeddings mal elegidos (no capturan el dominio específico).

La solución es iterar con ejemplos reales de tu caso de uso, no con benchmarks genéricos.
