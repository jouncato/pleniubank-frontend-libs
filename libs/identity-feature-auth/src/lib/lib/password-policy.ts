/** Alineado con identity-service `validate_password_policy` (12+ y complejidad). */
export const APP_PASSWORD_MIN_LENGTH = 12;
export const APP_PASSWORD_COMPLEXITY_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
