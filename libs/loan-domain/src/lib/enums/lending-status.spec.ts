import { describe, expect, it } from 'vitest';
import { canTransition, LendingStatus, LENDING_STATUS_LABELS } from './lending-status';

describe('LendingStatus', () => {
  it('should have 6 members', () => {
    const values = Object.values(LendingStatus);
    expect(values).toHaveLength(6);
  });

  it('should match backend string values exactly', () => {
    expect(LendingStatus.Draft).toBe('DRAFT');
    expect(LendingStatus.Active).toBe('ACTIVE');
    expect(LendingStatus.Suspended).toBe('SUSPENDED');
    expect(LendingStatus.Closed).toBe('CLOSED');
    expect(LendingStatus.Defaulted).toBe('DEFAULTED');
    expect(LendingStatus.WrittenOff).toBe('WRITTEN_OFF');
  });
});

describe('LENDING_STATUS_LABELS', () => {
  it('should have a label for every status', () => {
    for (const status of Object.values(LendingStatus)) {
      expect(LENDING_STATUS_LABELS[status]).toBeTruthy();
    }
  });
});

describe('canTransition', () => {
  const allowed: [LendingStatus, LendingStatus][] = [
    [LendingStatus.Draft, LendingStatus.Active],
    [LendingStatus.Active, LendingStatus.Suspended],
    [LendingStatus.Active, LendingStatus.Closed],
    [LendingStatus.Active, LendingStatus.Defaulted],
    [LendingStatus.Suspended, LendingStatus.Active],
    [LendingStatus.Suspended, LendingStatus.Closed],
    [LendingStatus.Defaulted, LendingStatus.WrittenOff],
    [LendingStatus.Defaulted, LendingStatus.Closed],
  ];

  it.each(allowed)('should allow %s → %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  const denied: [LendingStatus, LendingStatus][] = [
    [LendingStatus.Draft, LendingStatus.Closed],
    [LendingStatus.Draft, LendingStatus.Suspended],
    [LendingStatus.Draft, LendingStatus.Defaulted],
    [LendingStatus.Draft, LendingStatus.WrittenOff],
    [LendingStatus.Active, LendingStatus.Draft],
    [LendingStatus.Active, LendingStatus.WrittenOff],
    [LendingStatus.Suspended, LendingStatus.Defaulted],
    [LendingStatus.Suspended, LendingStatus.WrittenOff],
    [LendingStatus.Suspended, LendingStatus.Draft],
    [LendingStatus.Closed, LendingStatus.Active],
    [LendingStatus.Closed, LendingStatus.Draft],
    [LendingStatus.Closed, LendingStatus.Suspended],
    [LendingStatus.Closed, LendingStatus.Defaulted],
    [LendingStatus.Closed, LendingStatus.WrittenOff],
    [LendingStatus.WrittenOff, LendingStatus.Active],
    [LendingStatus.WrittenOff, LendingStatus.Draft],
    [LendingStatus.WrittenOff, LendingStatus.Closed],
    [LendingStatus.WrittenOff, LendingStatus.Suspended],
    [LendingStatus.WrittenOff, LendingStatus.Defaulted],
    [LendingStatus.Defaulted, LendingStatus.Active],
    [LendingStatus.Defaulted, LendingStatus.Draft],
    [LendingStatus.Defaulted, LendingStatus.Suspended],
  ];

  it.each(denied)('should deny %s → %s', (from, to) => {
    expect(canTransition(from, to)).toBe(false);
  });

  it('should deny self-transition', () => {
    for (const status of Object.values(LendingStatus)) {
      expect(canTransition(status, status)).toBe(false);
    }
  });
});
