## Why

Los portales de cliente y backoffice representan la operación financiera mediante una mezcla no gobernada de SVG inline, rutas SVG locales, emojis y caracteres Unicode. Esta dispersión rompe la consistencia visual, dificulta auditar accesibilidad y no comunica de forma uniforme la seguridad, precisión y confianza esperadas de una plataforma bancaria.

Se necesita un sistema único, propio y reusable de iconografía SVG financiera para sustituir estas variantes sin introducir otra librería genérica ni depender de assets de terceros.

## What Changes

- Crear un catálogo exclusivo de iconos SVG financieros y corporativos, con metáforas bancarias claras y nomenclatura semántica.
- Crear un componente Angular standalone compartido que renderice el catálogo por nombre, tamaño, variante decorativa o accesible, y color mediante `currentColor`.
- Definir reglas obligatorias de geometría SVG: `viewBox="0 0 24 24"`, trazo uniforme, uniones y extremos redondeados, XML limpio y sin metadatos de herramientas de diseño.
- Incorporar tokens de iconografía para tamaños, grosor de trazo y superficies semánticas, compatibles con modo oscuro y marcas corporativas.
- Sustituir en entregas progresivas los emojis, caracteres Unicode, rutas SVG locales e SVG inline de los portales customer y backoffice por el componente compartido.
- **BREAKING** Retirar los contratos internos que usan nombres de iconos sin tipado, emojis o rutas SVG locales cuando sus consumidores hayan migrado al catálogo tipado.
- Añadir pruebas de integridad del catálogo, renderizado, accesibilidad y una auditoría que prohíba nuevos emojis decorativos, icon fonts y SVG inline fuera de los componentes autorizados.

## Capabilities

### New Capabilities
- `financial-svg-iconography`: Sistema de iconografía SVG propio para productos bancarios, con catálogo financiero, componente Angular reusable, contratos de accesibilidad y reglas de migración para los portales.

### Modified Capabilities

- Ninguna.

## Impact

- `@pleniu/ui`: nueva API pública de iconografía y migración de `pb-empty-state`, timelines y componentes visuales compartidos.
- `@pleniu/design-tokens`: tokens de tamaño, grosor y color semántico de iconos.
- Customer Portal: migración de dashboard B2C, navegación inferior, movimientos, transferencias, perfil, seguridad y estados vacíos.
- Backoffice Portal: migración del catálogo administrativo, tesorería, transaction hub, navegación, estados y acciones operativas.
- No se añadirá ninguna dependencia de iconografía genérica; los tres proyectos Angular ya comparten bibliotecas locales mediante enlaces `@pleniu/*`.
