# Migration Guide: Libranza / PayrollAdvance / ClientContract → LendingArrangement

> **Estado operativo 2026-08-16:** Libranza está deshabilitada temporalmente. No se deben crear nuevas plantillas, contratos o `LendingArrangement` de tipo `LIBRANZA`/`PAYROLL_DEDUCTION`, y los portales filtran esos registros. Esta guía se conserva como referencia de migración; `PAYROLL_ADVANCE` continúa usando su flujo dedicado.

> **Versión:** v0.5.0 — **Sunset:** 2026-12-31
>
> Guía de migración frontend desde las APIs pre-BIAN (`/api/v1/loans`, `/api/v1/client-contracts`)
> hacia el dominio BIAN unificado `/api/v1/lending-arrangements` via `@pleniu/loan-data-access`.
>
> **Living document** — se actualiza conforme a LB-ST-024..031 (migración de portales).
> ¿Encontraste un gotcha adicional? Abre un PR actualizando la sección 5.

---

## 1. Cambios de paquete

| Antes | Ahora |
| --- | --- |
| `@pleniu/loan-origination-data-access` (no publicado) | `@pleniu/loan-data-access` + `@pleniu/loan-domain` |
| `@pleniu/core-data-access` — `CoreLoansApiService` | `@pleniu/loan-data-access` — `LendingArrangementService` |
| Tipos específicos por producto (`LoanDto`, etc.) | Tipos BIAN unificados (`LendingArrangementResponse`, etc.) |

**Ejemplos de instalación:**

```bash
# En el portal (ya instalado en monorepo):
# libs/loan-data-access   → @pleniu/loan-data-access
# libs/loan-domain        → @pleniu/loan-domain
# libs/loan-ui-kit        → @pleniu/loan-ui-kit
```

---

## 2. Mapeo de conceptos

### 2.1. Entidades

| Legacy | BIAN | Notas |
| --- | --- | --- |
| `LibranzaContract` | `LendingArrangement` + `extensionData` (`PAYROLL_DEDUCTION`) | Campos específicos de libranza en `extensionData` |
| `PayrollAdvance` | `LendingArrangement` + `extensionData` (`PAYROLL_ADVANCE`) | `version` es append-only |
| `ClientContract` | Fuera del MVP de Lending | Mantener en bounded context comercial; **no** migrar a `ArrangementExtension(GENERIC)` sin ADR nuevo |

### 2.2. Campos

| Legacy | BIAN | Conversión requerida |
| --- | --- | --- |
| `libranza.id` | `arrangement.arrangementId` | — |
| `libranza.monto_desembolso` | `arrangement.principal.amount` | String decimal (no parseFloat) |
| `libranza.tasa_mensual` | `arrangement.nominalRate` | **Multiplicar × 12** para anualizar |
| `libranza.plazo_meses` | `arrangement.termMonths` | — |
| `libranza.estado` | `arrangement.status` | Ver sección 2.3 |
| `payrollAdvance.advance_id` | `arrangement.arrangementId` | — |
| `payrollAdvance.version` | `arrangement.version` | — |
| `payrollAdvance.amount` | `arrangement.principal.amount` | String decimal |
| `payrollAdvance.employer_id` | `arrangement.extensionData.employer_id` | Ahora en `extensionData` |
| `clientContract.terms` | `arrangement.extensionData.original_terms` | Preserva estructura v1 |

### 2.3. Mapeo de status

| Legacy (string) | BIAN (`LendingStatus`) | Notas |
| --- | --- | --- |
| `'PENDING_DISBURSEMENT'` | `LendingStatus.Draft` | — |
| `'ACTIVE'` / `'DISBURSED'` | `LendingStatus.Active` | — |
| `'PAID_OFF'` / `'SETTLED'` | `LendingStatus.Closed` | Sin `statusReason` |
| `'CANCELLED'` | `LendingStatus.Closed` | Con `statusReason: 'CANCELLED'` |
| `'TERMINATED'` | `LendingStatus.Closed` | Con `statusReason: 'TERMINATED'` |
| `'DEFAULTED'` | `LendingStatus.Defaulted` | — |
| `'SUSPENDED'` | `LendingStatus.Suspended` | — |
| `'WRITTEN_OFF'` | `LendingStatus.WrittenOff` | — |

---

## 3. Ejemplos antes/después

### 3.1. Listar contratos de un cliente

Ver ejemplo completo: [`examples/01-list-contracts.ts`](./examples/01-list-contracts.ts)

**Antes (legacy):**

```typescript
import { CoreLoansApiService } from '@pleniu/core-data-access';

@Component({ ... })
export class ContractsComponent {
  private svc = inject(CoreLoansApiService);
  contracts$ = this.svc.list({ customer_id: this.customerId, status: 'ACTIVE' });
  // template: {{ contract.status }} — {{ contract.amount }} {{ contract.denomination }}
}
```

**Después (BIAN):**

```typescript
import { LendingArrangementService } from '@pleniu/loan-data-access';
import { LendingStatus } from '@pleniu/loan-domain';
import { LendingStatusBadgeComponent, MoneyDisplayComponent } from '@pleniu/loan-ui-kit';

@Component({
  standalone: true,
  imports: [LendingStatusBadgeComponent, MoneyDisplayComponent, AsyncPipe],
  ...
})
export class ContractsComponent {
  private svc = inject(LendingArrangementService);
  contracts = toSignal(
    this.svc.getAll({ customerId: this.customerId, status: LendingStatus.Active })
      .pipe(map(r => r.items)),
    { initialValue: [] }
  );
  // template:
  // @for (a of contracts()) {
  //   <pleniu-lending-status-badge [status]="a.status" />
  //   <pleniu-money-display [amount]="a.principal.amount" currency="COP" />
  // }
}
```

### 3.2. Crear contrato (wizard)

Ver ejemplo completo: [`examples/02-create-contract.ts`](./examples/02-create-contract.ts)

**Antes (legacy):**

```typescript
this.loansApi.create({
  customer_id: customerId,
  employer_id: employerId,
  amount: '5000000',
  denomination: 'COP',
  product_id: 'PAYROLL_ADVANCE_V1',
  account_id: accountId,
  instance_parameters: { plazo: 12, tasa_mensual: 1.5 }
});
```

**Después (BIAN):**

```typescript
import { LendingArrangementService } from '@pleniu/loan-data-access';
import { ProductType, RepaymentFrequency, money } from '@pleniu/loan-domain';

this.lendingService.create({
  customerId,
  productType: ProductType.PayrollAdvance,
  principal: money('5000000', 'COP'),
  nominalRate: 0.18,          // 1.5% mensual × 12 = 18% anual
  repaymentFrequency: RepaymentFrequency.Monthly,
  termMonths: 12,
  currency: 'COP',
  extensionData: { employer_id: employerId }
});
```

### 3.3. Display de status

Ver ejemplo completo: [`examples/03-status-display.ts`](./examples/03-status-display.ts)

**Antes:**

```typescript
const label = contract.estado === 'PAID_OFF' ? 'Pagado' :
              contract.estado === 'ACTIVE'   ? 'Activo' : contract.estado;
```

**Después:**

```typescript
// Opción A: componente (recomendado)
// <pleniu-lending-status-badge [status]="arrangement.status" />

// Opción B: helper de dominio
import { LENDING_STATUS_LABELS } from '@pleniu/loan-domain';
const label = LENDING_STATUS_LABELS[arrangement.status]; // 'Activo', 'Cerrado', etc.
```

### 3.4. Tabla de cuotas (amortización)

Ver ejemplo completo: [`examples/04-amortization-schedule.ts`](./examples/04-amortization-schedule.ts)

**Antes:**

```typescript
// Llamaba endpoint custom o no existía en frontend
fetch(`/api/v1/libranza-contracts/${id}/schedule`)
```

**Después:**

```typescript
import { AmortizationScheduleService } from '@pleniu/loan-data-access';
import { AmortizationScheduleTableComponent, toAmortizationRow } from '@pleniu/loan-ui-kit';

@Component({
  standalone: true,
  imports: [AmortizationScheduleTableComponent],
  template: `
    <pleniu-amortization-schedule-table
      [rows]="rows()"
      currency="COP"
      [pageable]="true"
    />
  `
})
export class ScheduleComponent {
  private svc = inject(AmortizationScheduleService);
  rows = toSignal(
    this.svc.get(this.arrangementId).pipe(map(r => r.map(toAmortizationRow))),
    { initialValue: [] }
  );
}
```

---

## 4. Checklist de migración por feature

- [ ] Reemplazar imports de paquetes legacy (`@pleniu/core-data-access` → `@pleniu/loan-data-access`).
- [ ] Actualizar tipos según tabla 2.2 (renombrar campos).
- [ ] Aplicar mapeo de status según tabla 2.3.
- [ ] Reemplazar servicios HTTP legacy con `LendingArrangementService`.
- [ ] Convertir `tasa_mensual` → `nominalRate` anualizada (× 12).
- [ ] Cambiar `amount: number` → `amount: string` (usar `money()` helper).
- [ ] Sustituir componentes propios de estado/monto/cuotas por `@pleniu/loan-ui-kit`.
- [ ] Eliminar referencias a `payrollProviderGuard` / `PAYROLL_PROVIDER_CONTEXT`.
- [ ] Verificar que tests unitarios y E2E pasan.
- [ ] Eliminar imports deprecados restantes.

---

## 5. Gotchas comunes

**Tasa mensual vs. anual**
`libranza.tasa_mensual = 1.5` (%) → `arrangement.nominalRate = 0.18` (18% anual decimal).
La UI debe convertir explícitamente — no es el backend quien lo hace.

```typescript
// ❌ Incorrecto
const nominalRate = tasa_mensual;

// ✅ Correcto
const nominalRate = (tasa_mensual / 100) * 12;
```

**Amount como string**
`principal.amount` es `string` para evitar precision loss en decimales grandes.
No usar `parseFloat()` directamente.

```typescript
// ❌
const total = parseFloat(arrangement.principal.amount) + fee;

// ✅ Usar el helper de dominio
import { money, formatMoney } from '@pleniu/loan-domain';
const display = formatMoney({ amount: arrangement.principal.amount, currency: 'COP' });
```

**`LendingStatus.Closed` con `statusReason`**
`CANCELLED` y `TERMINATED` mapean a `LendingStatus.Closed` pero son semánticamente distintos.
Si `statusReason` está presente, mostrarlo en UI.

```typescript
// En template
@if (arrangement.statusReason) {
  <span class="status-reason">{{ arrangement.statusReason }}</span>
}
```

**Versiones append-only**
El nuevo modelo guarda cada cambio como versión nueva (no mutación).
Para mostrar "historial de cambios", usar `ArrangementVersionTimelineComponent` de `@pleniu/loan-ui-kit`.

```typescript
import { ArrangementVersionTimelineComponent } from '@pleniu/loan-ui-kit';
// <pleniu-arrangement-version-timeline [versions]="arrangement.versions" />
```

**`employer_id` ya no va en el body raíz**
En el nuevo modelo, el empleador es un `PartyRole` con `role: PartyRoleType.Employer`.
Para filtrar por empleador, usar la lista de parties del arrangement.

---

## Servicio → Servicio (resumen rápido)

| Antes | Ahora |
| --- | --- |
| `CoreLoansApiService` | `LendingArrangementService` |
| `CoreClientContractsApiService.listSubEnterpriseContracts()` | `LendingArrangementService.getAll()` + filtro por `PartyRoleType.Employer` |
| `CoreClientContractsApiService.listSubEnterpriseTemplates()` | `LendingArrangementService.getAll()` |
| `CoreLoansApiService.getAmortization()` | `AmortizationScheduleService.get()` |
| `CoreLoansApiService.simulate()` | `LoanServicingService.disburse()` (post-aprobación) |
| `payrollProviderGuard` | `lendingPartyRoleGuard` (disponible en LB-ST-030) |

---

## Librerías afectadas (deprecated)

| Librería | Deprecated desde | Sunset |
| --- | --- | --- |
| `CoreLoansApiService` en `@pleniu/core-data-access` | v0.5.0 | 2026-12-31 |
| `LoanDto`, `CreateLoanRequest`, `UpdateLoanRequest`, `PaymentLineDto` en `@pleniu/core-data-access` | v0.5.0 | 2026-12-31 |
| `CoreClientContractsApiService.listSubEnterpriseTemplates/Contracts` en `@pleniu/core-data-access` | v0.5.0 | 2026-12-31 |
| `payrollProviderGuard`, `PAYROLL_PROVIDER_CONTEXT`, `PayrollProviderContext` en `@pleniu/shared-auth` | v0.5.0 | 2026-12-31 |

---

## Próximos pasos

- `LB-ST-024..031` — Migrar customer-portal y backoffice-portal a nuevos servicios.
- `LB-ST-030` — Implementar `lendingPartyRoleGuard` que reemplaza `payrollProviderGuard`.
- `LB-ST-042` — Inventario completo pre-sunset 2026-12-31.
- `LB-ST-043` — Eliminación física de artefactos deprecated.

