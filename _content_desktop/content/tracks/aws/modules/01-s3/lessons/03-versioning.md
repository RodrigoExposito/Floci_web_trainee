# Versionado, MFA Delete y Lifecycle

En este módulo vas a aprender cómo S3 Versioning protege tus datos de borrados accidentales, cómo configurar MFA Delete y cómo automatizar el ciclo de vida de los objetos.

## ¿Por qué versionar?

Sin versionado, sobrescribir o borrar un objeto es permanente. Con versionado habilitado, S3 conserva cada versión del objeto. Esto es crítico en Nave para:
- Recuperar versiones anteriores de archivos de configuración antifraude
- Cumplir con requisitos de auditoría (compliance)
- Protegerse de borrados accidentales o ransomware

## Habilitar versioning

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

# Habilitar versioning en el bucket
aws s3api put-bucket-versioning \
  --bucket nave-transactions \
  --versioning-configuration Status=Enabled \
  --endpoint-url http://localhost:4566

# Verificar estado
aws s3api get-bucket-versioning \
  --bucket nave-transactions \
  --endpoint-url http://localhost:4566
# Output esperado: { "Status": "Enabled" }
```

## Trabajar con versiones

```bash
# Subir el mismo objeto dos veces — crea dos versiones
aws s3api put-object \
  --bucket nave-transactions \
  --key config/rules.json \
  --body rules-v1.json \
  --endpoint-url http://localhost:4566

aws s3api put-object \
  --bucket nave-transactions \
  --key config/rules.json \
  --body rules-v2.json \
  --endpoint-url http://localhost:4566

# Listar todas las versiones
aws s3api list-object-versions \
  --bucket nave-transactions \
  --prefix config/rules.json \
  --endpoint-url http://localhost:4566

# Recuperar una versión específica (usar VersionId del output anterior)
aws s3api get-object \
  --bucket nave-transactions \
  --key config/rules.json \
  --version-id <VERSION_ID> \
  recovered-rules.json \
  --endpoint-url http://localhost:4566

# Borrar una versión específica
aws s3api delete-object \
  --bucket nave-transactions \
  --key config/rules.json \
  --version-id <VERSION_ID> \
  --endpoint-url http://localhost:4566
```

## MFA Delete

MFA Delete agrega un segundo factor para borrar versiones o deshabilitar el versionado. Solo el root account puede habilitarlo. Floci no lo soporta (es una feature de AWS real), pero es importante conocerlo para compliance.

## Lifecycle Policies

Las políticas de ciclo de vida automatizan transiciones entre storage classes y la expiración de objetos:

```bash
# Crear política de lifecycle
aws s3api put-bucket-lifecycle-configuration \
  --bucket nave-transactions \
  --lifecycle-configuration '{
    "Rules": [{
      "ID": "archive-old-transactions",
      "Status": "Enabled",
      "Filter": { "Prefix": "transactions/" },
      "Transitions": [{
        "Days": 90,
        "StorageClass": "STANDARD_IA"
      }],
      "Expiration": { "Days": 365 }
    }]
  }' \
  --endpoint-url http://localhost:4566
```

Esta política mueve transacciones a `STANDARD_IA` después de 90 días y las elimina al año.

En el siguiente paso vas a poner en práctica todo esto con los desafíos del módulo.
