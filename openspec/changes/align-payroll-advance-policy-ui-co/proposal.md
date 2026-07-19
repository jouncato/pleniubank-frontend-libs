## Why

Los contratos compartidos y las pantallas aún podían comunicar un techo fijo de 2.000.000 COP o bloquear con un solo anticipo activo, contradiciendo la política agregada vigente. La UI debe distinguir cupo provisional de aprobación final y reflejar exactamente la decisión canónica de Core.

## What Changes

- Retirar `max_amount` de los tipos y formularios específicos de `PAYROLL_ADVANCE`.
- Representar hasta dos anticipos activos y mostrar el cupo restante agregado.
- Incorporar `provisional` e `is_final` y los motivos de Scoring/saldo no disponible.
- Limitar Backoffice a porcentajes entre 5% y 30%, sin excepción superior.
- Alinear Customer Portal y Backoffice consumidores mediante las librerías compartidas.

## Capabilities

### New Capabilities

- `payroll-advance-aggregate-cap-ui`: Contrato y experiencia de usuario para cupo agregado provisional/final de Anticipo de nómina.

### Modified Capabilities


## Impact

`core-domain`, `core-data-access`, Customer Portal y Backoffice; contrato HTTP de elegibilidad/simulación de Core.
