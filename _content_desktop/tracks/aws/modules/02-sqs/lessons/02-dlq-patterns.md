# Dead Letter Queues y patrones de retry

En este módulo vas a aprender cómo manejar mensajes que fallan repetidamente usando Dead Letter Queues, y cómo diseñar políticas de retry en sistemas de pagos.

## El problema de los mensajes "poison pill"

En Nave, imaginá que llega una transacción con un formato inválido. El servicio de fraude intenta procesarla, falla, y el mensaje vuelve a la cola. Sin DLQ, esto se repetiría indefinidamente, bloqueando recursos y generando alertas.

Una **Dead Letter Queue (DLQ)** es una cola de destino para los mensajes que fallaron demasiadas veces.

## Configurar DLQ con Redrive Policy

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

# 1. Crear la DLQ primero
aws sqs create-queue \
  --queue-name nave-transactions-dlq \
  --endpoint-url http://localhost:4566

# 2. Obtener el ARN de la DLQ
aws sqs get-queue-attributes \
  --queue-url http://localhost:4566/000000000000/nave-transactions-dlq \
  --attribute-names QueueArn \
  --endpoint-url http://localhost:4566

# 3. Crear la cola principal con redrive policy
aws sqs create-queue \
  --queue-name nave-transactions \
  --attributes '{
    "RedrivePolicy": "{\"deadLetterTargetArn\":\"arn:aws:sqs:us-east-1:000000000000:nave-transactions-dlq\",\"maxReceiveCount\":\"3\"}"
  }' \
  --endpoint-url http://localhost:4566
```

**`maxReceiveCount`**: cuántas veces puede recibirse un mensaje antes de ir a la DLQ. Con `3`, si el mensaje falla 3 veces consecutivas, se manda a la DLQ.

## Flujo típico en un sistema de pagos

```
Transacción → nave-transactions → Servicio de fraude
                                         ↓ (falla 3 veces)
                              nave-transactions-dlq → Alerta + revisión manual
```

## Inspeccionar la DLQ

```bash
# Ver cuántos mensajes hay en la DLQ
aws sqs get-queue-attributes \
  --queue-url http://localhost:4566/000000000000/nave-transactions-dlq \
  --attribute-names ApproximateNumberOfMessages \
  --endpoint-url http://localhost:4566

# Recibir y revisar mensajes fallidos
aws sqs receive-message \
  --queue-url http://localhost:4566/000000000000/nave-transactions-dlq \
  --attribute-names All \
  --endpoint-url http://localhost:4566
```

## Patrones de retry

**Exponential backoff**: en vez de reintentar inmediatamente, aumentar el intervalo entre intentos (1s, 2s, 4s, 8s...). Evita saturar un servicio ya sobrecargado.

**Jitter**: agregar aleatoriedad al backoff para evitar que todos los consumidores reintenten al mismo tiempo (thundering herd).

En Lambda, el servicio gestiona esto automáticamente cuando procesa colas SQS. Lo verás en el módulo 06.

## Monitoreo de DLQs

Una DLQ con mensajes es una alarma: hay algo roto en el flujo. En producción, configuramos una CloudWatch Alarm sobre `ApproximateNumberOfMessagesVisible` de la DLQ para alertar al equipo de operaciones.

En el siguiente paso vas a poner en práctica la creación de colas y DLQs con los desafíos.
