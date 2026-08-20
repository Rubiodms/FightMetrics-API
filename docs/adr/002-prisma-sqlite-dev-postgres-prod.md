# 002 — Prisma + SQLite en dev, Postgres en prod

## Contexto

Se necesita un ORM y una base de datos que permitan iterar rápido durante las 15
horas de desarrollo, sin depender de infraestructura externa para probar localmente.

## Decisión

Usamos Prisma como ORM. En desarrollo, la base de datos es SQLite (archivo local,
cero setup). El `docker-compose.yml` deja un servicio Postgres opcional comentado
para pruebas prod-like antes del deploy final.

## Consecuencias

- (+) SQLite arranca sin instalar ni configurar nada: ideal para el tiempo disponible.
- (+) Prisma abstrae el dialecto SQL; cambiar el `provider` del datasource a `postgresql`
  en prod es el cambio principal necesario.
- (-) SQLite no replica exactamente el comportamiento de Postgres (tipos, concurrencia,
  límites de conexión); hay riesgo de sorpresas menores al migrar.
- (-) Las migraciones deben regenerarse/validarse contra Postgres antes de producción.
- Aceptable: se prioriza velocidad de desarrollo sobre paridad total dev/prod.
