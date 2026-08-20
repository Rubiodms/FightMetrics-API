# Fase 3 — Algoritmo de Fatiga (sRPE / ACWR): diseño

- **Fecha:** 2026-08-20
- **Estado:** Aprobado
- **Alcance de este documento:** el módulo de cálculo (`fatigue.calculations.ts`) y el
  contrato del endpoint `GET /api/v1/fatigue/today`. No cubre la implementación de
  `fatigue.service.ts`/`fatigue.controller.ts`/`fatigue.routes.ts`, que se aborda en un
  turno posterior sobre esta misma base.

## Contexto

Fases 1 y 2 ya dejaron `TrainingLog.sessionLoad` (sRPE = duración × RPE, calculado en
servidor) y `DailyCheckIn` (sueño, dolor muscular, energía, estrés) disponibles vía CRUD
autenticado. Fase 3 convierte esos datos crudos en una señal de fatiga accionable:
`GET /api/v1/fatigue/today`.

## 1. Ventanas de carga

- **Carga aguda** = promedio diario de `sessionLoad` en los últimos 7 días (incluye hoy).
- **Carga crónica** = promedio diario de `sessionLoad` en los últimos 28 días.
- Días sin `TrainingLog` cuentan como carga `0` ese día (no se ignoran).
- `ACWR = cargaAguda / cargaCrónica`.

## 2. Monotonía y Strain (método Foster)

- `monotony = media(cargas diarias, últimos 7 días) / desviación_estándar(cargas diarias, últimos 7 días)`.
- `strain = carga_total_semanal × monotony`.
- Si la desviación estándar es `0`, `monotony` y `strain` son `null` (evita `Infinity`/`NaN`).

## 3. Zonas por ACWR

| ACWR | Zona |
|---|---|
| < 0.8 | YELLOW |
| 0.8 – 1.3 | GREEN |
| 1.3 – 1.5 | YELLOW |
| > 1.5 | RED |

`acwr = null` (carga crónica = 0) ⇒ zona por ACWR = `null`.

## 4. recoveryIndex

`recoveryIndex = promedio(sleepQuality, energyLevel, 10-muscleSoreness, 10-stressLevel) × 10`
(escala 0–100).

- Fuente: el check-in de **hoy** si existe; si no, el **más reciente dentro de los
  últimos 3 días**; si no hay ninguno, `recoveryIndex = null`.
- Zona por recuperación: `≥70` GREEN · `40–69` YELLOW · `<40` RED. `null` ⇒ zona `null`.

## 5. Zona final y `score`

- **Zona final** = la más severa entre zona-ACWR y zona-recovery (RED > YELLOW > GREEN).
  Si una de las dos es `null`, se usa solo la que exista; si ninguna existe, zona final = `null`.
- **acwrSubScore** (banda discreta por zona-ACWR): GREEN → 100, YELLOW → 60, RED → 20, `null` → `null`.
- **score = min(acwrSubScore, recoveryIndex)** cuando ambos existen; si falta uno, se usa
  el que exista; si ninguno existe, `score = null`.
- `recommendation`: texto fijo en español según la zona final (incluye un mensaje propio
  para el caso sin datos).

## 6. Casos límite

- **Cero `TrainingLog` en 28 días:** `chronicLoad = 0` (no `acwr = 0/0`) ⇒ `acwr = null`.
  La zona final depende solo de `recoveryIndex` si existe.
- **Ni entrenamientos ni check-ins:** el endpoint responde `200` con todos los campos
  calculados en `null`, `zone: null` y `recommendation: "Sin datos suficientes todavía..."`.
  Nunca un error 4xx/5xx por falta de datos históricos.
- **Menos de 28 días de historial:** se calcula igual con los días disponibles.
  `confidence: "low"` si el historial de entrenamientos abarca menos de 28 días desde el
  primer `TrainingLog` hasta hoy; `"full"` en caso contrario.

## 7. Contrato del endpoint (para el turno de implementación del service/controller)

`GET /api/v1/fatigue/today`, protegido con `authMiddleware`:

- Calcula todo lo anterior para el usuario autenticado, con `referenceDate = hoy`.
- Hace **upsert** en `FatigueScore` por `(userId, date=hoy)` y devuelve el registro guardado.
- Requiere volver nullable en `schema.prisma` los campos que ahora pueden faltar:
  `acwr`, `monotony`, `strain`, `recoveryIndex`, `score` (→ `Float?`) y `zone`
  (→ `FatigueZone?`). `acuteLoad`, `chronicLoad` y `recommendation` se quedan
  no-nulos (siempre son calculables, incluso como `0` o el mensaje "sin datos").

## 8. Separación de responsabilidades y testing

- `fatigue.calculations.ts`: solo funciones puras (sin Prisma, sin `Date.now()` implícito —
  la fecha de referencia siempre se recibe como parámetro). Se testea 100% con Vitest sin
  tocar la base de datos.
- `fatigue.service.ts` (turno posterior): lee `TrainingLog`/`DailyCheckIn` de Prisma, arma
  los inputs de las funciones puras, y hace el upsert en `FatigueScore`.
- **Limitación conocida y aceptada:** los "días" se calculan en UTC (no en el `timezone`
  del `User`). Correcto para desarrollo/portafolio; ajustar a zona horaria por usuario
  quedaría como mejora futura si el proyecto crece más allá de las 15 horas planeadas.

## 9. Testing

- **Unitarios puros** sobre cada función de `fatigue.calculations.ts`: ventanas de carga,
  ACWR, monotony/strain, recoveryIndex, selección de check-in, mapeo a zonas, combinación
  de zonas, score, `confidence`, y los dos casos límite de gracia (stddev=0, sin datos).
- **Integración** (turno posterior, cuando exista el service/controller): `GET
  /api/v1/fatigue/today` con datos sembrados vía los endpoints ya existentes de Fase 2,
  verificando la persistencia en `FatigueScore`.
