## Why

La estrategia por defecto conserva JWT en `sessionStorage` y el WebSocket puede enviarlo en `?token=`, exponiéndolo a historial, proxies y logs. Además coexisten dos resolutores de mensajes (`resolveApiErrorMessage` y `mapApiErrorToUserMessage`) con contratos diferentes.

## What Changes

- **BREAKING**: adoptar cookies HttpOnly/Secure/SameSite y CSRF como estrategia productiva única; dejar almacenamiento de tokens solo para desarrollo explícito.
- Retirar autenticación WebSocket por query string y usar cookie same-site o ticket efímero de un solo uso.
- Unificar el contrato de errores y deprecar los dos resolutores actuales en favor de una API canónica contextual.
- Migrar Customer Portal y Backoffice y añadir gates que impidan reintroducir tokens en URL/storage productivo.

## Capabilities

### New Capabilities

- `secure-browser-session`: Sesiones web y WebSocket sin exposición de bearer tokens.
- `canonical-api-error-messages`: Mapeo único, accesible y seguro de errores API.

### Modified Capabilities

## Impact

- `shared-auth`, `shared-http`, Identity, Core WebSocket, ambos portales, configuración de dominios/CORS/CSRF.
