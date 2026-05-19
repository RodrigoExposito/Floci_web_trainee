# GSI, LSI y consultas eficientes

En este módulo vas a aprender cómo usar índices secundarios para consultar DynamoDB de múltiples formas sin hacer Scan, y cuándo usar cada tipo de índice.

## El problema con Scan

Un Scan recorre toda la tabla. Con millones de transacciones, un Scan es lento y costoso. Si necesitás buscar todas las transacciones con `status=flagged`, necesitás un índice en el campo `status`.

## Global Secondary Index (GSI)

Un GSI te permite consultar por un atributo diferente a la clave primaria. Tiene su propia PK y SK opcional, y los datos se sincronizan automáticamente.

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

# Crear tabla con GSI en "status"
aws dynamodb create-table \
  --table-name nave-transactions \
  --attribute-definitions \
    AttributeName=transaction_id,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
    AttributeName=status,AttributeType=S \
  --key-schema \
    AttributeName=transaction_id,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --global-secondary-indexes '[{
    "IndexName": "status-index",
    "KeySchema": [
      {"AttributeName": "status", "KeyType": "HASH"},
      {"AttributeName": "timestamp", "KeyType": "RANGE"}
    ],
    "Projection": {"ProjectionType": "ALL"},
    "BillingMode": "PAY_PER_REQUEST"
  }]' \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:4566

# Query usando el GSI
aws dynamodb query \
  --table-name nave-transactions \
  --index-name status-index \
  --key-condition-expression "#s = :status" \
  --expression-attribute-names '{"#s": "status"}' \
  --expression-attribute-values '{":status": {"S": "flagged"}}' \
  --endpoint-url http://localhost:4566
```

## Local Secondary Index (LSI)

Un LSI comparte la Partition Key con la tabla principal pero permite una Sort Key diferente. **Debe crearse al crear la tabla** (no se puede agregar después).

Útil cuando siempre consultás por el mismo PK pero querés ordenar/filtrar por un atributo diferente.

## Query vs Scan

| Operación | Lee | Cuándo usar |
|-----------|-----|-------------|
| `GetItem` | 1 ítem exacto | Tenés la clave completa |
| `Query` | Ítems con mismo PK | Tenés el PK, filtrás por SK |
| `Scan` | Toda la tabla | Evitar en producción |

## FilterExpression y ProjectionExpression

```bash
# Query con filtro adicional (filtra DESPUÉS de leer, no reduce RCUs)
aws dynamodb query \
  --table-name nave-transactions \
  --index-name status-index \
  --key-condition-expression "#s = :status" \
  --filter-expression "amount > :min" \
  --projection-expression "transaction_id, amount, #s" \
  --expression-attribute-names '{"#s": "status"}' \
  --expression-attribute-values '{":status":{"S":"pending"},":min":{"N":"1000"}}' \
  --endpoint-url http://localhost:4566
```

**`ProjectionExpression`** reduce los datos transferidos y el costo. Solo pedís los atributos que necesitás.

## Cuándo usar GSI vs rediseñar la tabla

Si necesitás muchos patrones de acceso distintos, considerá el **single-table design**: poner múltiples entidades en una sola tabla con PK/SK que encoden el tipo de entidad y las relaciones. Es una técnica avanzada que verás en módulos posteriores.

En el siguiente paso vas a poner en práctica la creación de tablas con GSI en los desafíos del módulo.
