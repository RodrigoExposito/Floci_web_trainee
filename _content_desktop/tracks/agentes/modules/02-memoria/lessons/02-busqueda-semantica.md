# Búsqueda Semántica y Embeddings

La búsqueda semántica permite encontrar documentos por **significado**, no por palabras exactas. Es el corazón de la memoria de largo plazo y de los sistemas RAG.

## ¿Qué es un embedding?

Un embedding es una representación numérica de texto en un espacio vectorial de alta dimensión (512, 1536, 3072 dimensiones según el modelo). Textos con significado similar tienen vectores cercanos en ese espacio.

```
"perro"    → [0.12, -0.45, 0.78, ...]
"cachorro" → [0.14, -0.43, 0.75, ...]   # ← cercano
"avión"    → [0.89,  0.21, -0.34, ...]  # ← lejano
```

## Similitud coseno

La métrica más usada para comparar embeddings es la **similitud coseno**: mide el ángulo entre dos vectores. Valor 1 = idénticos, 0 = perpendiculares (sin relación).

```python
import math

def similitud_coseno(v1, v2):
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a**2 for a in v1))
    norm2 = math.sqrt(sum(b**2 for b in v2))
    return dot / (norm1 * norm2)
```

## El flujo de búsqueda semántica

1. **Indexación**: los documentos se convierten a embeddings y se guardan en la BD vectorial.
2. **Query**: la pregunta del usuario se convierte al mismo espacio vectorial.
3. **Búsqueda**: se calculan las similitudes entre la query y todos los documentos.
4. **Recuperación**: se retornan los K documentos más similares (Top-K).

## Implementación sin BD vectorial

Para casos pequeños (< 10.000 documentos), podés hacer búsqueda exhaustiva en Python con `numpy`:

```python
import numpy as np

def buscar_top_k(query_emb, doc_embs, k=3):
    similitudes = np.dot(doc_embs, query_emb)  # producto punto normalizado
    indices = np.argsort(similitudes)[::-1][:k]
    return indices
```

## Bases de datos vectoriales

Para escala de producción:

| BD | Punto fuerte |
|----|-------------|
| Chroma | Simple, local, ideal para prototipos |
| Pinecone | Cloud-managed, serverless |
| pgvector | Extensión PostgreSQL, ideal si ya usás Postgres |
| Weaviate | Multi-modal, con esquema de datos |

## Chunk size: el parámetro crítico

Al indexar documentos largos, se dividen en fragmentos (chunks). El tamaño del chunk afecta la calidad de la recuperación:

- **Chunks pequeños** (100-200 tokens): mayor precisión, menor contexto.
- **Chunks grandes** (500-1000 tokens): más contexto, menor precisión.
- **Overlap** (solapamiento entre chunks): evita cortar información en el límite.

El tamaño óptimo depende del tipo de documento y de cómo los usuarios hacen sus preguntas.
