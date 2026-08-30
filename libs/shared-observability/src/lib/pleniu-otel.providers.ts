import { APP_INITIALIZER, Provider } from '@angular/core';

import type { PleniuObservabilityConfig } from './pleniu-observability.types';
import { isPleniuOtelEnabled } from './pleniu-otel';

/**
 * Providers de Angular para OpenTelemetry.
 *
 * OTel se inicializa en `main.ts` antes del bootstrap (ver `initPleniuOtel`),
 * por lo que estos providers solo aseguran que el SDK se mantenga activo
 * durante el ciclo de vida de la aplicación y facilitan el shutdown ordenado
 * al destruir la app.
 *
 * Vacío si OTel no está habilitado.
 */
export function pleniuOtelProviders(config: PleniuObservabilityConfig): Provider[] {
  if (!isPleniuOtelEnabled(config)) {
    return [];
  }

  return [
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => {
        // OTel ya fue inicializado en main.ts; este APP_INITIALIZER
        // asegura que el árbol de inyección dependa de OTel para que
        // no sea tree-shaken en builds optimizados.
        return () => undefined;
      },
    },
  ];
}
