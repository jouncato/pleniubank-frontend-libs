import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { PartyRole } from '@pleniu/loan-domain';
import { PartyRoleType } from '@pleniu/loan-domain';

const ROLE_LABELS: Record<PartyRoleType, string> = {
  [PartyRoleType.Borrower]: 'Deudor',
  [PartyRoleType.Coborrower]: 'Codeudor',
  [PartyRoleType.Guarantor]: 'Garante',
  [PartyRoleType.Employer]: 'Empleador',
  [PartyRoleType.Payer]: 'Pagador',
};

const ROLE_VARIANT: Record<PartyRoleType, string> = {
  [PartyRoleType.Borrower]: 'primary',
  [PartyRoleType.Coborrower]: 'secondary',
  [PartyRoleType.Guarantor]: 'warning',
  [PartyRoleType.Employer]: 'neutral',
  [PartyRoleType.Payer]: 'info',
};

@Component({
  selector: 'pleniu-party-role-chips',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="chips" role="list" aria-label="Roles de las partes">
      @for (role of activeRoles(); track role.id) {
        <li
          class="chip"
          [class]="'chip chip--' + roleVariant(role.role)"
          [attr.title]="role.partyId"
        >
          {{ roleLabel(role.role) }}
          @if (role.rolePercentage != null) {
            <span class="chip__pct">({{ role.rolePercentage }}%)</span>
          }
        </li>
      }
    </ul>
  `,
  styles: `
    .chips { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 0.35rem; }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;
      border-radius: 999px;
      padding: 0.15rem 0.6rem;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .chip--primary   { background: var(--pleniu-color-primary-100, #dbeafe); color: var(--pleniu-color-primary-800, #1e40af); }
    .chip--secondary { background: var(--pleniu-color-surface-200, #e5e7eb); color: var(--pleniu-color-text, #374151); }
    .chip--warning   { background: var(--pleniu-color-warning-100, #fef9c3); color: var(--pleniu-color-warning-800, #92400e); }
    .chip--neutral   { background: var(--pleniu-color-surface-100, #f3f4f6); color: var(--pleniu-color-text-subtle, #6b7280); }
    .chip--info      { background: var(--pleniu-color-info-100, #e0f2fe); color: var(--pleniu-color-info-800, #075985); }
    .chip__pct { font-weight: 400; opacity: 0.8; }
  `,
})
export class PartyRoleChipsComponent {
  readonly roles = input.required<PartyRole[]>();

  readonly activeRoles = computed(() =>
    this.roles().filter((r) => r.roleEndedAt == null),
  );

  roleLabel(role: string): string {
    return ROLE_LABELS[role as PartyRoleType] ?? role;
  }

  roleVariant(role: string): string {
    return ROLE_VARIANT[role as PartyRoleType] ?? 'neutral';
  }
}
