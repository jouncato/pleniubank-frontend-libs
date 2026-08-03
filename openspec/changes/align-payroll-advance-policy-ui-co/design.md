## Context

Core es la única autoridad de política. Las librerías compartidas tipan su respuesta y los dos portales deben consumirla sin reconstruir topes ni usar términos de contrato como fallback.

## Goals / Non-Goals

**Goals:** eliminar el techo fijo, representar dos activos y diferenciar cupo provisional/final.

**Non-Goals:** calcular riesgo, exposición o salario en el navegador.

## Decisions

- `effective_max_amount` es salida calculada; nunca configuración.
- `provisional=true/is_final=false` identifica consultas sin monto.
- Los formularios empresariales aceptan 5%-40% y 1-2 activos; 40% es el default global y nunca se permiten excepciones por encima de 40%.
- Los portales bloquean según la decisión/motivos de Core, no por conteos locales aislados.

## Risks / Trade-offs

- [Consumidor desactualizado] → contrato compartido y builds de ambos portales.
- [Cupo provisional interpretado como aprobación] → etiqueta explícita y reevaluación con monto antes de registrar.
