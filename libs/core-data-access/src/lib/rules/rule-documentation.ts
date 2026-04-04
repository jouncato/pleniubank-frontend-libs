/**
 * Metadata de gobernanza por regla, almacenada en `Rule.config.documentation` (JSON en motor).
 * Pensada para equipos de negocio (lenguaje natural, política) y técnicos (inputs, expresiones).
 */
import type { Rule } from './rules.models';

export const RULE_DOCUMENTATION_CONFIG_KEY = 'documentation' as const;

export interface RuleDocumentationAudit {
  created_by?: string;
  updated_at?: string;
  notes?: string;
}

export interface RuleDocumentationFaqItem {
  question: string;
  answer: string;
}

/** Subconjunto flexible; todos los campos son opcionales salvo convención de equipo. */
export interface RuleDocumentationMetadata {
  rule_id?: string;
  name?: string;
  purpose?: string;
  /** Qué hace la regla en lenguaje de negocio (sin tecnicismos innecesarios). */
  business_explanation?: string;
  /** Ejemplo de aplicación paso a paso (texto libre; puede ir numerado). */
  usage_steps?: string;
  /** Dónde ajustar parámetros (menús, claves JSON, etc.). */
  parameters_help?: string;
  /** Preguntas frecuentes (contenido embebido en config.documentation). */
  faqs?: RuleDocumentationFaqItem[];
  policy_ref?: string;
  logic_natural?: string;
  logic_technical?: string;
  inputs?: string[];
  outputs?: string[];
  configurable_params?: string[];
  markets?: string[];
  audit?: RuleDocumentationAudit;
}

export function getRuleDocumentation(rule: Rule): RuleDocumentationMetadata | null {
  const raw = rule.config?.[RULE_DOCUMENTATION_CONFIG_KEY];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  return raw as RuleDocumentationMetadata;
}

/** True si hay texto útil para negocio o técnico (no solo objeto vacío). */
export function hasSubstantiveRuleDocumentation(rule: Rule): boolean {
  const d = getRuleDocumentation(rule);
  if (!d) {
    return false;
  }
  const t = (s?: string) => (s ?? '').trim().length > 0;
  return (
    t(d.name) ||
    t(d.purpose) ||
    t(d.business_explanation) ||
    t(d.usage_steps) ||
    t(d.parameters_help) ||
    (Array.isArray(d.faqs) && d.faqs.length > 0) ||
    t(d.logic_natural) ||
    t(d.logic_technical) ||
    (Array.isArray(d.inputs) && d.inputs.length > 0) ||
    (Array.isArray(d.outputs) && d.outputs.length > 0) ||
    (Array.isArray(d.configurable_params) && d.configurable_params.length > 0)
  );
}

/** Resumen corto para tooltip (accesible también vía título / aria). */
export function ruleDocumentationTooltipSummary(rule: Rule): string {
  const d = getRuleDocumentation(rule);
  if (!d) {
    return 'Sin documentación de gobernanza. Edita la regla y completa la sección Documentación.';
  }
  const parts: string[] = [];
  if (d.name?.trim()) {
    parts.push(d.name.trim());
  }
  const biz = d.business_explanation?.trim() || d.purpose?.trim();
  if (biz) {
    parts.push(biz);
  } else if (d.logic_natural?.trim()) {
    parts.push(d.logic_natural.trim());
  }
  if (!parts.length) {
    return 'Documentación incompleta: añade al menos nombre, explicación de negocio, propósito o lógica en lenguaje natural.';
  }
  const head = parts[0];
  const sub = parts[1];
  if (!sub) {
    return head.length > 200 ? `${head.slice(0, 197)}…` : head;
  }
  const combined = `${head} — ${sub}`;
  return combined.length > 220 ? `${combined.slice(0, 217)}…` : combined;
}

/** Parsea JSON de FAQs desde el formulario del backoffice (vacío → undefined). */
export function parseRuleDocumentationFaqsJson(raw: string): RuleDocumentationFaqItem[] | undefined {
  const t = raw.trim();
  if (!t) {
    return undefined;
  }
  try {
    return parseRuleDocumentationFaqsJsonStrict(t);
  } catch {
    return undefined;
  }
}

/**
 * Igual que parseRuleDocumentationFaqsJson pero con texto no vacío debe ser JSON válido;
 * lanza si el JSON es inválido o no es un array.
 */
export function parseRuleDocumentationFaqsJsonStrict(raw: string): RuleDocumentationFaqItem[] | undefined {
  const t = raw.trim();
  if (!t) {
    return undefined;
  }
  const v = JSON.parse(t) as unknown;
  if (!Array.isArray(v)) {
    throw new Error('FAQs: se esperaba un array JSON');
  }
  const out: RuleDocumentationFaqItem[] = [];
  for (const item of v) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const o = item as Record<string, unknown>;
    const q = o['question'];
    const a = o['answer'];
    if (typeof q === 'string' && typeof a === 'string' && (q.trim() || a.trim())) {
      out.push({ question: q.trim(), answer: a.trim() });
    }
  }
  return out.length ? out : undefined;
}

export function formatRuleDocumentationFaqsJson(faqs: RuleDocumentationFaqItem[] | undefined): string {
  if (!faqs?.length) {
    return '';
  }
  return JSON.stringify(faqs, null, 2);
}

export function parseDocumentationListField(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function formatDocumentationListField(items: string[] | undefined): string {
  return (items ?? []).join('\n');
}
