# Variables de entorno, Layers y versiones

En este módulo vas a aprender cómo configurar funciones Lambda con variables de entorno, cómo compartir dependencias con Layers, y cómo gestionar versiones y aliases.

## Variables de entorno

Las variables de entorno permiten parametrizar las funciones sin modificar el código. En Nave, usamos env vars para separar configuración de staging y producción:

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

# Crear función con env vars
aws lambda create-function \
  --function-name nave-transaction-processor \
  --runtime python3.12 \
  --role arn:aws:iam::000000000000:role/lambda-role \
  --handler handler.lambda_handler \
  --zip-file fileb://function.zip \
  --environment 'Variables={ENVIRONMENT=staging,TABLE_NAME=nave-transactions,DLQ_URL=http://localhost:4566/000000000000/nave-transactions-dlq}' \
  --endpoint-url http://localhost:4566

# Actualizar env vars sin redesplegar código
aws lambda update-function-configuration \
  --function-name nave-transaction-processor \
  --environment 'Variables={ENVIRONMENT=production,TABLE_NAME=nave-transactions-prod}' \
  --endpoint-url http://localhost:4566
```

En Python, se acceden con `os.environ["TABLE_NAME"]`.

## Layers: dependencias compartidas

Un Layer es un archivo ZIP con librerías o código compartido que múltiples funciones pueden referenciar. Evita duplicar las mismas dependencias en cada función.

```bash
# Preparar layer con dependencias Python
mkdir -p layer/python
pip install boto3 requests -t layer/python/
cd layer && zip -r ../boto-layer.zip . && cd ..

# Publicar el layer
aws lambda publish-layer-version \
  --layer-name nave-common-libs \
  --zip-file fileb://boto-layer.zip \
  --compatible-runtimes python3.12 \
  --endpoint-url http://localhost:4566

# Asociar layer a una función (usar el ARN del output anterior)
aws lambda update-function-configuration \
  --function-name nave-transaction-processor \
  --layers arn:aws:lambda:us-east-1:000000000000:layer:nave-common-libs:1 \
  --endpoint-url http://localhost:4566
```

## Versiones y Aliases

Lambda soporta versionar el código. Cada `PublishVersion` crea una snapshot inmutable del código + configuración:

```bash
# Publicar versión (snapshot del estado actual)
aws lambda publish-version \
  --function-name nave-transaction-processor \
  --endpoint-url http://localhost:4566

# Crear alias "prod" apuntando a la versión 1
aws lambda create-alias \
  --function-name nave-transaction-processor \
  --name prod \
  --function-version 1 \
  --endpoint-url http://localhost:4566

# Canary deploy: 10% del tráfico a versión 2
aws lambda update-alias \
  --function-name nave-transaction-processor \
  --name prod \
  --routing-config '{"AdditionalVersionWeights":{"2":0.1}}' \
  --endpoint-url http://localhost:4566
```

## Concurrencia reservada

Para proteger backends de sobrecarga, podés reservar concurrencia para una función:

```bash
aws lambda put-function-concurrency \
  --function-name nave-fraud-detector \
  --reserved-concurrent-executions 50 \
  --endpoint-url http://localhost:4566
```

Esto garantiza que la función siempre tenga hasta 50 ejecuciones simultáneas disponibles y no consuma más.

En el siguiente paso vas a poner en práctica crear y invocar funciones Lambda con los desafíos del módulo.
