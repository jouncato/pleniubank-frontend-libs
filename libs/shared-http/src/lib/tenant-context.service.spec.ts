import { TestBed } from '@angular/core/testing';
import { TenantContextService } from './tenant-context.service';
import { DEFAULT_TENANT } from './tenant-country.types';

describe('TenantContextService', () => {
  let service: TenantContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TenantContextService);
  });

  it('inicia con DEFAULT_TENANT (CO)', () => {
    expect(service.selectedCountry()).toBe(DEFAULT_TENANT);
    expect(service.selectedCountry()).toBe('CO');
  });

  it("setCountry('CO') mantiene el valor CO", () => {
    service.setCountry('CO');
    expect(service.selectedCountry()).toBe('CO');
  });

  it("setCountry('MX') es soportado → fija el valor a MX", () => {
    service.setCountry('MX');
    expect(service.selectedCountry()).toBe('MX');
  });

  it('deriva moneda y locale del tenant activo', () => {
    expect(service.selectedCurrency()).toBe('COP');
    expect(service.selectedLocale()).toBe('es-CO');

    service.setCountry('MX');

    expect(service.selectedCurrency()).toBe('MXN');
    expect(service.selectedLocale()).toBe('es-MX');
  });

  it("setCountry('PE') no es soportado → fallback a CO", () => {
    service.setCountry('PE');
    expect(service.selectedCountry()).toBe('CO');
  });

  it('setCountry(null) → fallback a CO', () => {
    service.setCountry(null);
    expect(service.selectedCountry()).toBe('CO');
  });

  it('setCountry con string vacío → fallback a CO', () => {
    service.setCountry('');
    expect(service.selectedCountry()).toBe('CO');
  });

  it('setCountry con código desconocido → fallback a CO', () => {
    service.setCountry('XYZ');
    expect(service.selectedCountry()).toBe('CO');
  });
});
