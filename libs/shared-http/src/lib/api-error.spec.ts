import { HttpErrorResponse } from '@angular/common/http';

import { getHttpErrorCategory, mapHttpError } from './api-error';

describe('getHttpErrorCategory', () => {
  it('0 es network', () => {
    expect(getHttpErrorCategory(0)).toBe('network');
  });
  it('401/403 son auth', () => {
    expect(getHttpErrorCategory(401)).toBe('auth');
    expect(getHttpErrorCategory(403)).toBe('auth');
  });
  it('5xx es server excepto 501', () => {
    expect(getHttpErrorCategory(503)).toBe('server');
    expect(getHttpErrorCategory(501)).toBe('client');
  });
  it('4xx típico es client', () => {
    expect(getHttpErrorCategory(404)).toBe('client');
  });
});

describe('mapHttpError', () => {
  it('501 sin envelope usa NOT_IMPLEMENTED', () => {
    const err = new HttpErrorResponse({
      status: 501,
      statusText: 'Not Implemented',
      url: '/x',
      error: {},
    });
    const m = mapHttpError(err);
    expect(m.status).toBe(501);
    expect(m.errors[0]?.code).toBe('NOT_IMPLEMENTED');
  });

  it('extrae correlation_id de meta en error', () => {
    const err = new HttpErrorResponse({
      status: 400,
      error: {
        errors: [{ code: 'BAD_REQUEST', message: 'x' }],
        meta: { correlation_id: 'cid-1' },
      },
    });
    expect(mapHttpError(err).correlationId).toBe('cid-1');
  });

  it('status 0 sin envelope no expone mensaje técnico de Angular', () => {
    const err = new HttpErrorResponse({
      status: 0,
      statusText: 'Unknown Error',
      url: 'http://localhost:8000/api/v1/x',
      error: null,
    });
    const m = mapHttpError(err);
    expect(m.status).toBe(0);
    expect(m.message).not.toMatch(/Http failure response/i);
    expect(m.message).not.toMatch(/localhost:8000/);
    expect(m.message.length).toBeGreaterThan(10);
  });

  it('400 sin envelope usa mensaje amable, no error.message cruda', () => {
    const err = new HttpErrorResponse({
      status: 400,
      statusText: 'Bad Request',
      url: '/api/x',
      error: { not: 'an envelope' },
    });
    const m = mapHttpError(err);
    expect(m.message).not.toMatch(/Http failure response/i);
  });
});
