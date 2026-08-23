# Pleniubank — Notas técnicas para agentes

## ⚠️ Regla obligatoria — Manual de Usuario (no omitir jamás)

Este proyecto usa el skill **`manual-usuario-experto`** (`.devin/skills/manual-usuario-experto/SKILL.md`).

**Cada vez que se crea o ajusta** una pantalla, función, flujo, endpoint
expuesto o comportamiento visible para el cliente final (colaborador, empresa,
operador de negocio), el skill se invoca **de inmediato, en la misma tarea**,
para documentarlo con la estructura obligatoria:

1. Introducción
2. Características principales
3. Guía paso a paso
4. Solución de problemas (FAQ, mínimo 3 preguntas)
5. Mantenimiento / Buenas prácticas

Reglas:

- El manual del cliente final del producto de Anticipo de Nómina vive en
  `docs-proyecto-plenibank/manuales/manual-cliente/` (fuente central del
  ecosistema) y está enlazado desde el Dashboard del Backoffice.
- Si este repositorio tiene su propia carpeta de manuales de usuario, se
  documenta ahí; si no, se actualiza el manual central citado arriba.
- No se inventan datos de negocio (montos, porcentajes, nombres de pantallas,
  pasos): se verifican contra el código real de este repo antes de
  escribirse. Donde no exista un flujo exacto verificable, se usa el
  marcador `[Completar con flujo real]` en vez de inventar contenido.
- Esta regla no se pospone ni se omite por ningún motivo — es parte
  obligatoria de todos los proyectos del ecosistema Pleniu.
