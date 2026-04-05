export interface DomainEventEnvelope<TPayload> {
  eventName: string;
  version: number;
  correlationId: string;
  idempotencyKey: string;
  timestamp: string;
  payload: TPayload;
}

export function createDomainEventEnvelope<TPayload>(params: {
  eventName: string;
  version?: number;
  correlationId: string;
  idempotencyKey: string;
  payload: TPayload;
}): DomainEventEnvelope<TPayload> {
  return {
    eventName: params.eventName,
    version: params.version ?? 1,
    correlationId: params.correlationId,
    idempotencyKey: params.idempotencyKey,
    timestamp: new Date().toISOString(),
    payload: params.payload,
  };
}
