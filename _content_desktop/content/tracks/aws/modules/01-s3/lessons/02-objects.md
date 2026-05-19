# Objetos: datos, metadata y storage classes

En este módulo vas a aprender cómo funcionan los objetos en S3, cómo subirlos y descargarlos, y qué metadatos podés asociarles.

## ¿Qué es un objeto?

Un objeto en S3 tiene tres partes:
- **Key**: la "ruta" del objeto, por ejemplo `transactions/2024/01/txn-001.json`
- **Value**: el contenido en bytes (hasta 5 TB por objeto)
- **Metadata**: pares clave-valor que describén el objeto

La key NO es una carpeta real. S3 simula jerarquía de directorios mostrando el `/` como separador en las consolas, pero internamente todo es flat.

## Operaciones básicas con CLI

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

# Subir un archivo
aws s3api put-object \
  --bucket nave-transactions \
  --key transactions/2024/01/txn-001.json \
  --body txn-001.json \
  --endpoint-url http://localhost:4566

# Alternativa con s3 cp (más simple)
aws s3 cp txn-001.json \
  s3://nave-transactions/transactions/2024/01/txn-001.json \
  --endpoint-url http://localhost:4566

# Listar objetos
aws s3api list-objects-v2 \
  --bucket nave-transactions \
  --prefix transactions/2024/ \
  --endpoint-url http://localhost:4566

# Descargar
aws s3api get-object \
  --bucket nave-transactions \
  --key transactions/2024/01/txn-001.json \
  output.json \
  --endpoint-url http://localhost:4566

# Eliminar
aws s3api delete-object \
  --bucket nave-transactions \
  --key transactions/2024/01/txn-001.json \
  --endpoint-url http://localhost:4566
```

## Metadata del sistema y custom metadata

**Metadata del sistema** (automática): `Content-Type`, `Content-Length`, `ETag`, `Last-Modified`.

**Custom metadata** (prefijo `x-amz-meta-`):
```bash
aws s3api put-object \
  --bucket nave-transactions \
  --key reportes/fraude-2024-01.pdf \
  --body fraude-2024-01.pdf \
  --metadata "source=risk-engine,env=prod,reviewed=false" \
  --endpoint-url http://localhost:4566
```

## Tamaño máximo y multipart upload

- Objeto simple (PUT): hasta **5 GB**
- Con Multipart Upload: hasta **5 TB**

Multipart Upload divide el archivo en partes (mínimo 5 MB cada una), las sube en paralelo y las ensambla. Es obligatorio para archivos > 5 GB.

```bash
# Iniciar upload multipart
aws s3api create-multipart-upload \
  --bucket nave-transactions \
  --key big-report.csv \
  --endpoint-url http://localhost:4566

# Para archivos pequeños, aws s3 cp lo hace automáticamente:
aws s3 cp large-file.csv \
  s3://nave-transactions/large-file.csv \
  --endpoint-url http://localhost:4566
```

## Storage classes por objeto

Podés asignar una storage class al subir:
```bash
aws s3api put-object \
  --bucket nave-transactions \
  --key archive/2022/transactions.csv \
  --body transactions.csv \
  --storage-class STANDARD_IA \
  --endpoint-url http://localhost:4566
```

En el siguiente paso vas a aprender cómo proteger los datos con versionado y ciclo de vida.
