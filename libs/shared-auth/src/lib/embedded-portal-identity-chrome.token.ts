import { InjectionToken } from '@angular/core';

/**
 * El host (p. ej. portal público) provee `true` cuando ya pinta cabecera/pie unificados.
 * Los flujos de identidad pueden ocultar su chrome duplicado.
 */
export const EMBEDDED_PORTAL_IDENTITY_CHROME = new InjectionToken<boolean>(
  'EMBEDDED_PORTAL_IDENTITY_CHROME',
);
