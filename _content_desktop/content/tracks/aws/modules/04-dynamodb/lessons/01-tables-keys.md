# DynamoDB: tablas NoSQL y modelo de claves

En este módulo vas a aprender cómo funciona DynamoDB, el modelo de datos basado en clave-valor y documentos, y cómo diseñar tablas para acceso eficiente.

## ¿Por qué NoSQL en un sistema fintech?

Si venís de SQL, el salto a DynamoDB requiere un cambio de mentalidad. En una base relacional normalizás los datos y consultás con JOINs. En DynamoDB **modelás los accesos primero**: diseñás la tabla pensando en cómo la vas a consultar.

En Nave, DynamoDB guarda el estado de transacciones en tiempo real. Necesitamos sub-10ms de latencia para decisiones de fraude. DynamoDB garantiza latencia de milisegundos de un solo dígito a cualquier escala.

## Partition Key y Sort Key

Cada ítem en DynamoDB se identifica por su clave primaria:

- **Partition Key (PK)**: determina la partición física donde se guarda el ítem. Debe ser única si es la única clave, o única en combinación con SK.
- **Sort Key (SK)**: opcional. Permite múltiples ítems con el mismo PK, ordenados por SK.

```
PK: transaction_id   SK: timestamp
"txn-001"           "2024-01-15T10:30:00Z"
"txn-001"           "2024-01-15T10:30:05Z"  ← revisión posterior
"txn-002"           "2024-01-15T10:31:00Z"
```

## Crear tabla y operar con CLI

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

# Crear tabla con PK y SK
aws dynamodb create-table \
  --table-name nave-transactions \
  --attribute-definitions \
    AttributeName=transaction_id,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
  --key-schema \
    AttributeName=transaction_id,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:4566

# Insertar un ítem
aws dynamodb put-item \
  --table-name nave-transactions \
  --item '{
    "transaction_id": {"S": "txn-001"},
    "timestamp": {"S": "2024-01-15T10:30:00Z"},
    "amount": {"N": "5000"},
    "status": {"S": "pending"},
    "user_id": {"S": "usr-42"}
  }' \
  --endpoint-url http://localhost:4566

# Obtener un ítem por clave primaria
aws dynamodb get-item \
  --table-name nave-transactions \
  --key '{
    "transaction_id": {"S": "txn-001"},
    "timestamp": {"S": "2024-01-15T10:30:00Z"}
  }' \
  --endpoint-url http://localhost:4566

# Scan completo (evitar en producción con tablas grandes)
aws dynamodb scan \
  --table-name nave-transactions \
  --endpoint-url http://localhost:4566
```

## Capacity Modes

| Modo | Cuándo usar |
|------|-------------|
| **On-Demand** | Tráfico impredecible, desarrollo, picos esporádicos |
| **Provisioned** | Tráfico predecible, menor costo a escala |

Para Nave en staging usamos On-Demand. En producción, con tráfico predecible de transacciones, usamos Provisioned con Auto Scaling.

## Consistency Models

- **Eventually consistent reads** (default): más rápido, más barato, puede devolver datos desactualizados por milisegundos
- **Strongly consistent reads**: siempre devuelve el dato más reciente, el doble de costo

Para el dashboard de fraude usamos strongly consistent. Para analytics usamos eventually consistent.

En el siguiente paso vas a aprender Global Secondary Indexes para consultas más flexibles.
