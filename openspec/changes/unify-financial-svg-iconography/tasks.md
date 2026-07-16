## 1. Gobierno y tokens de iconografía

- [x] 1.1 Definir en `design-tokens` los tokens CSS y TypeScript de tamaños `xs` a `2xl`, grosor de trazo y aliases semánticos para iconos financieros.
- [x] 1.2 Añadir pruebas de consistencia entre los nuevos tokens TypeScript y CSS, manteniendo `tokens.css` como fuente de verdad.
- [x] 1.3 Documentar la retícula 24 × 24, stroke 1.8, `currentColor`, nodos permitidos, convenciones de nombres y política de ownership para paths propios.
- [x] 1.4 Definir una lista explícita de excepciones permitidas para logo, ilustración y gráfico de datos, diferenciándolas de iconos de UI.

## 2. Catálogo SVG financiero propio

- [x] 2.1 Crear el registro tipado de nodos SVG declarativos y exportar `PbIconName`, tamaños y metadatos de uso desde `@pleniu/ui`.
- [x] 2.2 Implementar los iconos clave: `transfer`, `credit-card`, `loan`, `investment-chart`, `security-lock`, `balance` y `premium-profile` conforme al contrato visual.
- [x] 2.3 Implementar los iconos bancarios adicionales: cuentas, extractos, tasa de interés, ATM, biometría, beneficiario, depósito, retiro, pago, nómina, billetera, comprobante y conciliación.
- [x] 2.4 Implementar los iconos de seguridad, riesgo y operación: fraude, escudo verificado, alerta, bloqueo, auditoría, llave, aprobación, refrescar y notificación.
- [x] 2.5 Implementar los iconos de interfaz: búsqueda, filtro, cerrar, más, check, información, warning, error, chevrons y navegación.
- [x] 2.6 Añadir pruebas de integridad del catálogo que rechacen metadatos, XML inseguro, colores hardcoded, viewBox no estándar y geometría fuera de los atributos permitidos.

## 3. Componente Angular y accesibilidad

- [x] 3.1 Crear `PbIconComponent` standalone en `@pleniu/ui` con entradas tipadas para nombre, tamaño, modo decorativo y etiqueta accesible.
- [x] 3.2 Renderizar únicamente nodos del registro local sin `innerHTML`, URLs externas ni entradas SVG arbitrarias.
- [x] 3.3 Implementar el contrato ARIA: `aria-hidden`/`focusable=false` para decoración y `role=img` con nombre accesible para iconos informativos.
- [x] 3.4 Exportar el componente y sus tipos desde la API pública de `@pleniu/ui`.
- [x] 3.5 Añadir tests unitarios de renderizado, tamaño, `currentColor`, accesibilidad y rechazo de nombres no válidos.

## 4. Migración de componentes compartidos

- [x] 4.1 Migrar `pb-empty-state` al catálogo tipado y retirar sus SVG inline de estado.
- [x] 4.2 Migrar `pleniu-transaction-timeline` y `rules-trace-tree` desde caracteres Unicode a `PbIconComponent`.
- [x] 4.3 Migrar los demás componentes de `@pleniu/ui` que rendericen SVG inline, emojis o iconos por string.
- [ ] 4.4 Actualizar pruebas de componentes compartidos y verificar que no cambien sus contratos funcionales ni de accesibilidad. Bloqueada: `ng test ui` no compila por APIs obsoletas en `customer-picker.component.spec.ts`, fuera de este cambio.

## 5. Migración coordinada del Customer Portal

- [ ] 5.1 Migrar navegación móvil B2C y acciones rápidas del dashboard desde emojis/caracteres Unicode a nombres tipados del catálogo.
- [ ] 5.2 Migrar dashboard personal, movimientos, extractos, transferencias, notificaciones, perfil y seguridad a `PbIconComponent`.
- [ ] 5.3 Sustituir todos los SVG inline de iconos de UI en las vistas B2C, dejando solo las excepciones aprobadas.
- [ ] 5.4 Añadir pruebas de accesibilidad para iconos decorativos y controles de transferencias, saldo, seguridad y confirmaciones críticas.
- [ ] 5.5 Ejecutar build, tests, navegación por teclado y auditoría visual de los breakpoints B2C.

## 6. Migración coordinada del Backoffice Portal

- [ ] 6.1 Reemplazar `ICON_PATHS` y los strings no tipados del catálogo administrativo por `PbIconName` y `PbIconComponent`.
- [ ] 6.2 Migrar tesorería, transaction hub, operaciones, pagos, fraude, auditoría, estados vacíos, carga y errores.
- [ ] 6.3 Sustituir SVG inline de iconos de UI y estilos de stroke repetidos, conservando únicamente las excepciones aprobadas.
- [ ] 6.4 Añadir pruebas de accesibilidad para acciones administrativas, alertas de fraude, conciliación y controles de actualización.
- [ ] 6.5 Ejecutar build, tests y revisión visual de desktop/tablet con los tokens de iconografía.

## 7. Prevención de regresiones y adopción

- [ ] 7.1 Crear una verificación automatizada que falle ante nuevas ocurrencias no autorizadas de emojis decorativos, icon fonts, SVG inline de iconos de UI o registros locales de paths.
- [ ] 7.2 Configurar una allowlist mínima y documentada para logos, ilustraciones y gráficos de datos aprobados.
- [ ] 7.3 Medir bundle antes/después y verificar que la solución no introduce una dependencia genérica ni solicitudes HTTP de iconos en runtime.
- [ ] 7.4 Ejecutar auditoría axe/manual de lectores de pantalla sobre transferencias, pago, préstamo, saldo, fraude y cierre de sesión.
- [ ] 7.5 Publicar la versión de `@pleniu/ui` y `@pleniu/design-tokens`, actualizar consumidores vinculados y retirar los contratos de iconografía deprecados.
