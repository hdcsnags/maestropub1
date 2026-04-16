type Primitive = string | number | boolean | null;

type JsonValue = Primitive | JsonObject | JsonArray;

interface JsonObject {
  [key: string]: JsonValue;
}

interface JsonArray extends Array<JsonValue> {}

export interface MockExternalServiceResponse<T extends JsonValue = JsonValue> {
  ok: boolean;
  status: number;
  service: string;
  endpoint: string;
  method: string;
  requestId: string;
  timestamp: string;
  latencyMs: number;
  data: T;
}

export interface MockExternalServiceOptions<T extends JsonValue = JsonValue> {
  service: string;
  endpoint: string;
  method?: string;
  status?: number;
  minLatencyMs?: number;
  maxLatencyMs?: number;
  data?: T;
  shouldFail?: boolean;
  errorMessage?: string;
}

export class MockExternalServiceError extends Error {
  public readonly status: number;
  public readonly service: string;
  public readonly endpoint: string;
  public readonly method: string;
  public readonly requestId: string;

  constructor(params: {
    message: string;
    status: number;
    service: string;
    endpoint: string;
    method: string;
    requestId: string;
  }) {
    super(params.message);
    this.name = 'MockExternalServiceError';
    this.status = params.status;
    this.service = params.service;
    this.endpoint = params.endpoint;
    this.method = params.method;
    this.requestId = params.requestId;
  }
}

const DEFAULT_MIN_LATENCY_MS = 25;
const DEFAULT_MAX_LATENCY_MS = 150;
const DEFAULT_STATUS = 200;
const DEFAULT_METHOD = 'GET';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function randomInt(min: number, max: number): number {
  const normalizedMin = Math.ceil(min);
  const normalizedMax = Math.floor(max);
  return Math.floor(Math.random() * (normalizedMax - normalizedMin + 1)) + normalizedMin;
}

function createRequestId(service: string): string {
  const normalizedService = service.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${normalizedService || 'service'}_${Date.now()}_${randomPart}`;
}

function normalizeLatencyRange(minLatencyMs?: number, maxLatencyMs?: number): { min: number; max: number } {
  const min = Number.isFinite(minLatencyMs) ? Math.max(0, Number(minLatencyMs)) : DEFAULT_MIN_LATENCY_MS;
  const max = Number.isFinite(maxLatencyMs) ? Math.max(0, Number(maxLatencyMs)) : DEFAULT_MAX_LATENCY_MS;

  if (min <= max) {
    return { min, max };
  }

  return { min: max, max: min };
}

export async function mockExternalService<T extends JsonValue = JsonValue>(
  options: MockExternalServiceOptions<T>,
): Promise<MockExternalServiceResponse<T>> {
  const {
    service,
    endpoint,
    data = {} as T,
    shouldFail = false,
    errorMessage,
  } = options;

  const method = (options.method || DEFAULT_METHOD).toUpperCase();
  const status = options.status ?? (shouldFail ? 500 : DEFAULT_STATUS);
  const requestId = createRequestId(service);
  const timestamp = new Date().toISOString();
  const { min, max } = normalizeLatencyRange(options.minLatencyMs, options.maxLatencyMs);
  const latencyMs = randomInt(min, max);

  await sleep(latencyMs);

  if (shouldFail || status >= 400) {
    throw new MockExternalServiceError({
      message: errorMessage || `Mock ${service} request failed with status ${status}`,
      status,
      service,
      endpoint,
      method,
      requestId,
    });
  }

  return {
    ok: true,
    status,
    service,
    endpoint,
    method,
    requestId,
    timestamp,
    latencyMs,
    data,
  };
}

export async function mockExternalHealthCheck(service: string): Promise<MockExternalServiceResponse<{ healthy: boolean }>> {
  return mockExternalService<{ healthy: boolean }>({
    service,
    endpoint: '/health',
    method: 'GET',
    data: { healthy: true },
    minLatencyMs: 10,
    maxLatencyMs: 40,
  });
}
