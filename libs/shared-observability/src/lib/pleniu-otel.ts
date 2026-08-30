import { ZoneContextManager } from '@opentelemetry/context-zone-peer-dep';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchSpanProcessor, WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

import type { PleniuObservabilityConfig } from './pleniu-observability.types';

export function isPleniuOtelEnabled(
  config: Pick<PleniuObservabilityConfig, 'otelEnabled' | 'otelExporterEndpoint'>,
): boolean {
  return Boolean(config.otelEnabled && config.otelExporterEndpoint?.trim());
}

/**
 * Inicializa OpenTelemetry browser con cobertura completa:
 * - **Traces**: WebTracerProvider + OTLP HTTP exporter + BatchSpanProcessor
 * - **Metrics**: MeterProvider + PeriodicExportingMetricReader + OTLP HTTP exporter
 * - **Logs**: LoggerProvider + BatchLogRecordProcessor + OTLP HTTP exporter
 * - **Instrumentación automática**: fetch, XHR, document load, user interaction
 * - **Propagación**: W3C Trace Context (traceparent header)
 * - **Context manager**: Zone.js (compatible con Angular)
 *
 * Debe ejecutarse antes de `bootstrapApplication` cuando OTel está habilitado.
 * Sin endpoint o deshabilitado no hace nada.
 */
export function initPleniuOtel(config: PleniuObservabilityConfig): void {
  if (!isPleniuOtelEnabled(config)) {
    return;
  }

  const endpoint = config.otelExporterEndpoint.trim();
  const serviceName = config.otelServiceName ?? `pleniu-${config.portal}-portal`;
  const serviceVersion = config.otelServiceVersion ?? '0.0.1';
  const environment = config.production ? 'production' : 'development';

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: serviceVersion,
    'deployment.environment': environment,
    portal: config.portal,
  });

  // ── Traces ──────────────────────────────────────────────────────────────
  const traceExporter = new OTLPTraceExporter({
    url: `${endpoint}/v1/traces`,
  });

  const tracerProvider = new WebTracerProvider({
    resource,
    spanProcessors: [
      new BatchSpanProcessor(traceExporter, {
        maxQueueSize: 100,
        maxExportBatchSize: 10,
      }),
    ],
  });

  // Zone.js es opcional: varios portales Pleniu son zoneless (signals +
  // OnPush, sin `zone.js` en polyfills). `ZoneContextManager` solo funciona
  // si `Zone` existe globalmente -- instanciarlo sin eso revienta con
  // "ReferenceError: Zone is not defined" antes de que Angular arranque.
  // Sin contextManager, el SDK usa su manejador por defecto: los spans se
  // siguen creando y exportando igual, solo se pierde la propagación
  // automática de contexto entre callbacks async (no crítico para trazas
  // de request/response).
  const hasZone = typeof (globalThis as { Zone?: unknown }).Zone !== 'undefined';
  tracerProvider.register({
    contextManager: hasZone ? new ZoneContextManager() : undefined,
    propagator: new W3CTraceContextPropagator(),
  });

  // ── Metrics ─────────────────────────────────────────────────────────────
  const metricExporter = new OTLPMetricExporter({
    url: `${endpoint}/v1/metrics`,
  });

  const meterProvider = new MeterProvider({
    resource,
    readers: [
      new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis: 30_000,
      }),
    ],
  });

  // ── Logs ────────────────────────────────────────────────────────────────
  const logExporter = new OTLPLogExporter({
    url: `${endpoint}/v1/logs`,
  });

  const loggerProvider = new LoggerProvider({
    resource,
    processors: [
      new BatchLogRecordProcessor({
        exporter: logExporter,
        maxQueueSize: 100,
        maxExportBatchSize: 10,
      }),
    ],
  });

  // ── Auto-instrumentations ───────────────────────────────────────────────
  registerInstrumentations({
    instrumentations: [
      getWebAutoInstrumentations({
        '@opentelemetry/instrumentation-fetch': {
          propagateTraceHeaderCorsUrls: ['.*'],
          clearTimingResources: true,
        },
        '@opentelemetry/instrumentation-document-load': {
          enabled: true,
        },
        '@opentelemetry/instrumentation-user-interaction': {
          enabled: true,
        },
      }),
    ],
  });

  // Exponer providers globalmente para debugging (no en producción)
  if (!config.production) {
    (globalThis as Record<string, unknown>)['__pleniuOtel'] = {
      tracerProvider,
      meterProvider,
      loggerProvider,
    };
  }
}
