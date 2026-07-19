## ADDED Requirements

### Requirement: Sesión productiva sin JWT accesible a JavaScript
Los portales SHALL usar cookies HttpOnly, Secure y SameSite en producción y MUST NOT persistir access/refresh/admin tokens en Web Storage.

#### Scenario: Build productivo
- **WHEN** se inicia sesión en un build productivo
- **THEN** ningún JWT aparece en `sessionStorage` o `localStorage`

### Requirement: WebSocket sin bearer en URL
El cliente SHALL autenticar WebSocket mediante cookie same-site o ticket efímero de un uso y MUST NOT usar `?token=<JWT>`.

#### Scenario: Conexión cross-site
- **WHEN** el socket no puede usar cookie same-site
- **THEN** usa un ticket de TTL corto que no es reutilizable como access token

### Requirement: Protección CSRF
Las mutaciones autenticadas por cookie SHALL incluir protección CSRF y validación de origen.

#### Scenario: Mutación sin CSRF
- **WHEN** llega una solicitud cookie-auth sin token CSRF válido
- **THEN** el backend la rechaza

