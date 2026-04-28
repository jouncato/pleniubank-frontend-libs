export enum LendingStatus {
  Draft = 'DRAFT',
  Active = 'ACTIVE',
  Suspended = 'SUSPENDED',
  Closed = 'CLOSED',
  Defaulted = 'DEFAULTED',
  WrittenOff = 'WRITTEN_OFF',
}

export const LENDING_STATUS_LABELS: Record<LendingStatus, string> = {
  [LendingStatus.Draft]: 'Borrador',
  [LendingStatus.Active]: 'Activo',
  [LendingStatus.Suspended]: 'Suspendido',
  [LendingStatus.Closed]: 'Cerrado',
  [LendingStatus.Defaulted]: 'En mora',
  [LendingStatus.WrittenOff]: 'Castigado',
};

export function canTransition(from: LendingStatus, to: LendingStatus): boolean {
  const transitions: Record<LendingStatus, LendingStatus[]> = {
    [LendingStatus.Draft]: [LendingStatus.Active],
    [LendingStatus.Active]: [LendingStatus.Suspended, LendingStatus.Closed, LendingStatus.Defaulted],
    [LendingStatus.Suspended]: [LendingStatus.Active, LendingStatus.Closed],
    [LendingStatus.Defaulted]: [LendingStatus.WrittenOff, LendingStatus.Closed],
    [LendingStatus.Closed]: [],
    [LendingStatus.WrittenOff]: [],
  };
  return transitions[from]?.includes(to) ?? false;
}
