# Política de seguridad — pleniubank-frontend-libs

## Versiones soportadas

Solo la rama `main` recibe actualizaciones de seguridad. Las librerías se referencian por path local (`file:../pleniubank-frontend-libs/...`) en los portales; no existe un ciclo de release público independiente.

| Rama/versión | Recibe parches de seguridad |
| --- | --- |
| `main` (1.0.0) | Sí |
| Cualquier otra rama | No |

## Reporte de vulnerabilidades

Reporta cualquier vulnerabilidad de seguridad **por correo privado** a [joel.paez@gmail.com](mailto:joel.paez@gmail.com).

**No abras un issue público** hasta que el problema haya sido evaluado y, si aplica, parcheado.

SLA orientativo:

| Severidad | Acuse de recibo | Evaluación inicial | Resolución objetivo |
| --- | --- | --- | --- |
| Crítica | 24 h | 48 h | 7 días |
| Alta | 48 h | 5 días | 15 días |
| Media / Baja | 5 días | 15 días | 60 días |

Incluye en el reporte: descripción del problema, pasos para reproducirlo, impacto potencial y, si puedes, una prueba de concepto mínima.

## Modelo de seguridad

### Rol en la arquitectura

`pleniubank-frontend-libs` es un monorepo de librerías Angular compartidas consumidas por los tres portales (customer, backoffice, public). **No es una aplicación desplegable por sí misma**; no sirve peticiones de red ni gestiona sesiones directamente. Su relevancia de seguridad radica en que contiene la lógica de autenticación que usan los portales.

### Librerías con lógica de seguridad

La librería `@pleniu/shared-auth` centraliza toda la infraestructura de autenticación y autorización:

| Artefacto | Descripción |
| --- | --- |
| `SessionStore` | Servicio Angular (signals) que mantiene en memoria los tokens de sesión. En estrategia `bearer` persiste en `sessionStorage`; en `httpOnlyCookie` no persiste nada en el navegador. |
| `authTokenInterceptor` | Adjunta `Authorization: Bearer <token>` a peticiones autenticadas. Distingue entre token de usuario y token de administración según la URL destino. |
| `csrfInterceptor` | Adjunta `X-CSRF-Token` (leído de la cookie `pleniu_csrf`) en peticiones mutantes cuando la estrategia es `httpOnlyCookie`. |
| `authGuard` | Verifica token presente y claims frescos (TTL 5 min). Maneja errores transitorios de red sin invalidar la sesión. |
| `adminGuard` | Requiere token de usuario + token de administración + `role === 'admin'` + sin `password_must_change`. |
| `guestGuard` | Bloquea acceso a rutas de auth si ya hay sesión activa. |
| `auditAccessGuard` | Permite acceso solo a roles `admin` y `auditor`. |
| `enterpriseScopeGuard` | Requiere `claims.enterprise_id` presente. |
| `personalScopeGuard` | Requiere `claims.customer_id` no vacío. |
| `phoneVerifiedGuard` | Requiere `claims.phone_verified === true`. |

### Publicación de las librerías

Las librerías se publican a GitHub Packages como `@pleniu/*`. El acceso requiere un PAT con scope `read:packages` (instalación) o `write:packages` (publicación). Este token nunca debe comitearse en el repositorio.

### Observabilidad

Las librerías integran [Sentry](https://sentry.io) (`@sentry/angular ^10.47.0`) para reportar errores en tiempo de ejecución cuando son consumidas por los portales. Ningún token de sesión se envía a Sentry de forma intencional.

## Variables de entorno y build

| Variable | Tipo | Uso |
| --- | --- | --- |
| `GITHUB_REPOSITORY` | Requerida | Repositorio destino para `npm publish` a GitHub Packages (p. ej. `jouncato/pleniubank-frontend-libs`) |
| `NODE_AUTH_TOKEN` | Secreto | PAT de GitHub con scope `write:packages` (publicación) o `read:packages` (instalación) |

## Secretos que NO deben comitearse

- `.env` con valores reales de `NODE_AUTH_TOKEN`
- Cualquier PAT de GitHub con permisos de escritura en código fuente o configuración
- Claves privadas o certificados TLS

Usar siempre `.env.example` como plantilla y gestionar los valores reales a través de secretos de CI/CD (GitHub Actions Secrets, GCP Secret Manager, etc.).
