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
- [x] 4.4 Actualizar pruebas de componentes compartidos y verificar que no cambien sus contratos funcionales ni de accesibilidad. Desbloqueada: `customer-picker.component.spec.ts` ya fue corregido en la limpieza de tests del apply de `b2c-persona-ui-closure` (tarea 8.4, sesión previa); `ng test ui` ahora compila y pasa 12/12 archivos, 50/50 tests, incluidos `pb-icon.component.spec.ts` y `financial-icon.registry.spec.ts`.

## 5. Migración coordinada del Customer Portal

- [x] 5.1 Migrar navegación móvil B2C y acciones rápidas del dashboard desde emojis/caracteres Unicode a nombres tipados del catálogo: `b2c-bottom-nav` (🏠→`home`, 📋→`statement`, ↗→`transfer`, 💰→`payroll`, ☰→`more`), campana en `b2c-top-app-bar` y `portal-header` (🔔→`bell`), acciones rápidas del dashboard personal (mismos 4 mapeos).
- [x] 5.2 Migrar dashboard personal, movimientos, extractos, transferencias, notificaciones, perfil y seguridad a `PbIconComponent`: dashboard personal migrado (banner provisional `warning` + quick actions); verificado por inventario propio (grep de emojis Unicode y `<svg` inline) que movimientos, transferencias, perfil y seguridad ya no tenían iconos emoji/SVG inline que migrar.
- [x] 5.3 Sustituir todos los SVG inline de iconos de UI en las vistas B2C, dejando solo las excepciones aprobadas: el único SVG inline de icono de UI en el scope personal era el banner provisional del dashboard (migrado a `warning`); `enterprise-dashboard.component.html` y `units-list.page.html` quedan fuera de este apply por ser vistas B2B/enterprise, no B2C (consistente con el alcance explícito de la tarea 5.x).
- [x] 5.4 Pruebas de accesibilidad añadidas para los iconos decorativos migrados: `b2c-bottom-nav.spec.ts` y `b2c-top-app-bar.spec.ts` verifican `aria-hidden="true"` en cada `pb-icon` y que el nombre accesible de los controles críticos (campana, items de navegación) proviene del texto visible/aria-label del contenedor, no del icono. Los controles de transferencias (confirmación), saldo (toggle mostrar/ocultar) y seguridad (`ConfirmDialog`) ya tenían texto visible/aria-label propio antes de este cambio (no se tocó su markup, solo iconos decorativos de navegación/dashboard) — verificado por lectura de código, no se detectó ningún control crítico dependiendo solo del icono para su nombre accesible.
- [x] 5.5 Build de producción (`ng build --configuration=production`) y suite completa (`ng test`, 357/357) ejecutados y en verde tras la migración. Navegación por teclado: no se introdujeron widgets nuevos (los iconos migrados están dentro de `<a routerLink>`/botones ya existentes, nativamente accesibles por teclado). Auditoría visual manual de breakpoints: **no realizada** — requiere abrir el portal en navegador, que no está disponible en este entorno; queda pendiente de una revisión visual humana antes de dar por cerrado el rediseño.

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
