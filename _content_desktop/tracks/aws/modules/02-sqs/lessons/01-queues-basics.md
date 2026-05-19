# SQS: colas de mensajes para sistemas resilientes

En este módulo vas a aprender cómo funciona Amazon SQS, la diferencia entre Standard y FIFO, y por qué las colas son fundamentales en sistemas fintech como Nave.

## ¿Por qué colas de mensajes?

En un sistema de pagos, el procesamiento de transacciones no puede ser síncrono. Si el servicio de fraude está lento, no podés bloquear la autorización de la tarjeta. SQS desacopla productores y consumidores: el servicio que detecta la transacción pone un mensaje en la cola, y el servicio de fraude lo procesa cuando puede.

**Beneficios clave:**
- **Resiliencia**: si el consumidor cae, los mensajes esperan en la cola
- **Escalabilidad**: múltiples consumidores pueden procesar en paralelo
- **Desacoplamiento**: productor y consumidor no necesitan conocerse

## Standard Queue vs FIFO Queue

| Característica | Standard | FIFO |
|---------------|----------|------|
| Orden | Best-effort (no garantizado) | Garantizado (FIFO estricto) |
| Throughput | Ilimitado | 300 msg/s (o 3000 con batching) |
| Duplicados | Posible al menos una vez | Exactamente una vez |
| Caso de uso | Notificaciones, logs | Transacciones financieras, workflows |

En Nave usamos FIFO para el pipeline de autorización (el orden importa) y Standard para notificaciones de email.

## Crear y usar colas con CLI

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

# Crear cola Standard
aws sqs create-queue \
  --queue-name nave-notifications \
  --endpoint-url http://localhost:4566

# Obtener URL de la cola
aws sqs get-queue-url \
  --queue-name nave-notifications \
  --endpoint-url http://localhost:4566

# Enviar un mensaje
aws sqs send-message \
  --queue-url http://localhost:4566/000000000000/nave-notifications \
  --message-body '{"type":"fraud_alert","transaction_id":"txn-001","amount":5000}' \
  --endpoint-url http://localhost:4566

# Recibir mensajes (long polling 20s)
aws sqs receive-message \
  --queue-url http://localhost:4566/000000000000/nave-notifications \
  --wait-time-seconds 20 \
  --endpoint-url http://localhost:4566

# Eliminar mensaje después de procesarlo
aws sqs delete-message \
  --queue-url http://localhost:4566/000000000000/nave-notifications \
  --receipt-handle <RECEIPT_HANDLE> \
  --endpoint-url http://localhost:4566
```

## Visibility Timeout

Cuando un consumidor recibe un mensaje, ese mensaje se "oculta" de otros consumidores durante el **visibility timeout** (default: 30 segundos). Si el consumidor no lo elimina en ese tiempo, vuelve a estar disponible.

Esto garantiza al-menos-una-vez pero puede causar duplicados si el procesamiento es más lento que el timeout.

## Long Polling

En vez de hacer polling corto (que devuelve vacío y cobra por request), SQS soporta long polling: la llamada espera hasta 20 segundos para que llegue un mensaje, reduciendo costos y latencia.

En el siguiente paso vas a aprender sobre Dead Letter Queues y patrones de retry.
