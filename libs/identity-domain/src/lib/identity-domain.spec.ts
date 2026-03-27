import { ForgotPasswordRequest, RegisterRequest, ResetPasswordRequest } from './identity-domain';

describe('identity-domain types', () => {
  it('accepts RegisterRequest shape', () => {
    const dto: RegisterRequest = {
      email: 'a@b.com',
      phone: '3001234567',
      password: 'Password123!Aa',
      full_name: 'Jane Doe',
      document_type: 'CC',
      document_number: '123456789',
      consent: true,
    };
    expect(dto.email).toContain('@');
  });

  it('accepts ForgotPasswordRequest shape', () => {
    const dto: ForgotPasswordRequest = {
      email: 'a@b.com',
      method: 'otp',
    };
    expect(dto.method).toBe('otp');
  });

  it('accepts ResetPasswordRequest shape', () => {
    const dto: ResetPasswordRequest = {
      email: 'a@b.com',
      new_password: 'StrongPass!123',
      code: '123456',
    };
    expect(dto.new_password.length).toBeGreaterThan(7);
  });
});
