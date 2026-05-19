# Lambda: funciones serverless event-driven

En este módulo vas a aprender qué es AWS Lambda, cómo funciona el modelo event-driven, y cuándo usarlo en lugar de un servidor tradicional.

## ¿Qué es Lambda?

Lambda es el servicio de computación serverless de AWS. Subís código, definís qué lo dispara (un evento) y AWS se encarga de ejecutarlo, escalarlo y cobrarte solo por el tiempo de ejecución.

En Nave, usamos Lambda para:
- Procesar transacciones de SQS en tiempo real
- Responder a eventos de S3 (nuevo archivo → análisis de fraude)
- Webhooks de MercadoPago (HTTP → procesamiento)

## Handlers: el punto de entrada

Un handler es la función que Lambda invoca. En Python:

```python
# handler.py
import json

def lambda_handler(event, context):
    """
    event: dict con los datos del evento que disparó la función
    context: objeto con info de runtime (requestId, memoria, timeout restante)
    """
    transaction_id = event.get("transaction_id", "unknown")
    
    return {
        "statusCode": 200,
        "body": json.dumps({
            "processed": True,
            "transaction_id": transaction_id
        })
    }
```

## Crear y invocar una función con CLI

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

# Crear archivo zip con el código
zip function.zip handler.py

# Crear la función Lambda
aws lambda create-function \
  --function-name nave-fraud-detector \
  --runtime python3.12 \
  --role arn:aws:iam::000000000000:role/lambda-role \
  --handler handler.lambda_handler \
  --zip-file fileb://function.zip \
  --endpoint-url http://localhost:4566

# Invocar la función
aws lambda invoke \
  --function-name nave-fraud-detector \
  --payload '{"transaction_id":"txn-001","amount":5000}' \
  --endpoint-url http://localhost:4566 \
  response.json

cat response.json
```

## Runtimes disponibles

Lambda soporta Python (3.12, 3.11), Node.js (20, 18), Java (21, 17), Go, .NET y custom runtimes. En Nave usamos Python para procesamiento de datos y Node.js para APIs.

## Cold Start

El primer invocación de una función (o después de inactividad) tiene latencia adicional: Lambda necesita provisionar el contenedor. Esto puede ser 100ms–2s. Para funciones críticas en el camino de autorización, se usa **Provisioned Concurrency** para mantener instancias "calientes".

## Límites clave

| Parámetro | Límite |
|-----------|--------|
| Timeout máximo | 15 minutos |
| Memoria | 128 MB – 10 GB |
| Payload síncrono | 6 MB |
| Payload asíncrono | 256 KB |
| Concurrencia | 1000 por región (ajustable) |

## Lambda vs Containers

Lambda es ideal para: eventos cortos, escala automática a 0, sin gestión de infraestructura. Los containers (ECS, EKS) son mejores para: workloads largos, estado compartido, dependencias complejas, o cuando el cold start es inaceptable.

En el siguiente paso vas a aprender variables de entorno, layers y versionado.
