# ADR-007: Estrategia i18n del Customer Portal

## Estado

Aceptado.

## Contexto

El portal debe soportar paises hispanohablantes con textos, formatos y validaciones distintas. Angular 21 ya ofrece localizacion por build, lo que evita cargar diccionarios runtime para el primer alcance y permite publicar rutas por locale.

## Decision

Usar `@angular/localize` con builds por locale:

- Locale fuente: `es-CO`.
- Segundo locale inicial: `es-MX`.
- Salida multi-build mediante `ng build --configuration production-i18n`.
- Base href por locale bajo `/customer/v0.1.0/<locale>/`.

Los validadores de documentos son funciones puras en `identity-domain`; no devuelven copy UI, solo codigos estructurados. Las capas de presentacion traducen esos codigos.

## Consecuencias

- El bundle puede publicarse por pais sin cambiar rutas internas.
- Los formularios B2C/B2B comparten reglas iniciales para documentos.
- Nuevos paises requieren agregar locale, vectores de validacion y traducciones antes de activar UI.
