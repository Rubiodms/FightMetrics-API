# 001 — Express sobre NestJS

## Contexto

El proyecto tiene un presupuesto total de 15 horas para construir una API RESTful
que calcula un índice de fatiga a partir de datos de entrenamiento y recuperación.
Se evaluaron Express y NestJS como framework HTTP.

## Decisión

Usamos Express con una estructura de módulos organizada a mano (controller/service/
routes/schema por dominio), en vez de NestJS.

## Consecuencias

- (+) Cero curva de aprendizaje de decoradores/DI; se escribe y se entiende más rápido.
- (+) Menos boilerplate para un proyecto de este tamaño y duración.
- (-) Sin inyección de dependencias ni módulos nativos: la disciplina de capas depende
  de la convención del equipo, no del framework.
- (-) Si el proyecto crece mucho, migrar a una arquitectura más rígida costará más.
- Aceptable dado el alcance y el tiempo disponible.
