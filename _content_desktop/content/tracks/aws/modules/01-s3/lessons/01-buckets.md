# Buckets: el contenedor fundamental de S3

En este módulo vas a aprender qué es Amazon S3, cómo funcionan los buckets y cómo crearlos y configurarlos con AWS CLI contra Floci.

## ¿Qué es S3?

Amazon S3 (Simple Storage Service) es el servicio de almacenamiento de objetos de AWS. A diferencia de un sistema de archivos tradicional, S3 no tiene carpetas reales ni jerarquía: todo son objetos dentro de buckets, organizados por "keys" (rutas).

En Nave, usamos S3 para guardar archivos de transacciones, reportes de fraude, logs de auditoría y artefactos de Lambda. Es el punto de entrada de muchos pipelines de datos.

## ¿Qué es un bucket?

Un bucket es el contenedor de nivel raíz en S3. Pensalo como el equivalente a un disco o volumen: no almacena datos directamente, sino que contiene objetos.

**Reglas de naming:**
- Entre 3 y 63 caracteres
- Solo minúsculas, números y guiones (`-`)
- No puede empezar ni terminar con guión
- No puede tener puntos consecutivos ni parecerse a una IP (`1.2.3.4`)
- **Globalmente único** dentro de toda AWS (o en Floci, dentro de la instancia local)

## Regiones

Cada bucket vive en una región específica. Esto afecta la latencia, el costo y la soberanía de datos. En producción elegís la región más cercana a tu carga de trabajo.

Con Floci siempre usamos `us-east-1` (configurado en el `docker-compose.yml`).

## Crear un bucket con AWS CLI

```bash
# Variables de entorno para Floci
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

# Crear bucket
aws s3api create-bucket \
  --bucket nave-transactions \
  --endpoint-url http://localhost:4566

# Listar buckets
aws s3api list-buckets \
  --endpoint-url http://localhost:4566

# Verificar que existe
aws s3api head-bucket \
  --bucket nave-transactions \
  --endpoint-url http://localhost:4566
```

## Clases de storage

S3 tiene múltiples clases de almacenamiento según la frecuencia de acceso:

| Clase | Uso ideal |
|-------|-----------|
| `STANDARD` | Datos accedidos frecuentemente |
| `STANDARD_IA` | Acceso infrecuente, recuperación rápida |
| `GLACIER` | Archivado a largo plazo (horas para recuperar) |
| `INTELLIGENT_TIERING` | Acceso impredecible, S3 mueve automáticamente |

Para el módulo de fraude de Nave, los archivos activos van en `STANDARD` y los reportes históricos en `STANDARD_IA`.

## Block Public Access

Por defecto, todos los buckets nuevos bloquean el acceso público. Esto es una best practice: nunca exponer un bucket públicamente a menos que sea absolutamente necesario (y en ese caso, usar CloudFront como frontal).

En el siguiente paso vas a aprender cómo trabajar con objetos dentro de un bucket.
