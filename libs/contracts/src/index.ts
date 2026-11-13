/** Stable wire-level primitives only. Domain-private entities belong to their owning service. */
export interface HealthResponse {
  status: 'ok' | 'degraded';
  service: string;
  timestamp: string;
}

export interface ReadinessResponse extends HealthResponse {
  checks: Record<string, 'ok' | 'failed'>;
}

export interface EventEnvelope<TPayload = Record<string, unknown>> {
  id: string;
  type: string;
  version: number;
  occurredAt: string;
  producer: string;
  correlationId: string;
  causationId?: string;
  payload: TPayload;
}
