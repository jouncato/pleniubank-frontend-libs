import { describe, expect, it } from 'vitest';
import { PartyRoleType, PartyType } from './party-role-type';

describe('PartyRoleType', () => {
  it('should have 5 members', () => {
    expect(Object.values(PartyRoleType)).toHaveLength(5);
  });

  it('should match backend string values exactly', () => {
    expect(PartyRoleType.Borrower).toBe('BORROWER');
    expect(PartyRoleType.Coborrower).toBe('COBORROWER');
    expect(PartyRoleType.Guarantor).toBe('GUARANTOR');
    expect(PartyRoleType.Employer).toBe('EMPLOYER');
    expect(PartyRoleType.Payer).toBe('PAYER');
  });
});

describe('PartyType', () => {
  it('should have 2 members', () => {
    expect(Object.values(PartyType)).toHaveLength(2);
  });

  it('should match backend string values exactly', () => {
    expect(PartyType.NaturalPerson).toBe('NATURAL_PERSON');
    expect(PartyType.LegalEntity).toBe('LEGAL_ENTITY');
  });
});
