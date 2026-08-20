import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

// TODO: implementar en el siguiente sprint — registrar schemas y paths reales por módulo.
const registry = new OpenAPIRegistry();

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'FightMetrics API',
      version: '1.0.0',
      description: 'Índice de Fatiga Aguda para atletas de combate.',
    },
  });
}
