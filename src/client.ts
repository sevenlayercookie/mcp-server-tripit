export type TripItClient = {
  authenticate(): Promise<string>;
  getAccessToken(): string;
  listTrips(pageSize?: number, pageNum?: number, past?: boolean): Promise<unknown>;
  getTrip(id: string): Promise<unknown>;
  createTrip(params: {
    displayName: string;
    startDate: string;
    endDate: string;
    primaryLocation?: string;
  }): Promise<unknown>;
  updateTrip(params: {
    id: string;
    displayName?: string;
    startDate?: string;
    endDate?: string;
    primaryLocation?: string;
    description?: string;
  }): Promise<unknown>;
  deleteTrip(id: string): Promise<unknown>;
  getHotel(id: string): Promise<unknown>;
  createHotel(params: Record<string, unknown>): Promise<unknown>;
  updateHotel(params: Record<string, unknown>): Promise<unknown>;
  deleteHotel(id: string): Promise<unknown>;
  getFlight(id: string): Promise<unknown>;
  createFlight(params: Record<string, unknown>): Promise<unknown>;
  updateFlight(params: Record<string, unknown>): Promise<unknown>;
  deleteFlight(id: string): Promise<unknown>;
  getTransport(id: string): Promise<unknown>;
  createTransport(params: Record<string, unknown>): Promise<unknown>;
  updateTransport(params: Record<string, unknown>): Promise<unknown>;
  deleteTransport(id: string): Promise<unknown>;
  getActivity(id: string): Promise<unknown>;
  createActivity(params: Record<string, unknown>): Promise<unknown>;
  updateActivity(params: Record<string, unknown>): Promise<unknown>;
  deleteActivity(id: string): Promise<unknown>;
  attachDocument(params: Record<string, unknown>): Promise<unknown>;
  removeDocument(params: Record<string, unknown>): Promise<unknown>;
};

type TripItConstructor = new (config: {
  clientId?: string;
  username: string;
  password: string;
}) => TripItClient;

export class TripItApiError extends Error {
  readonly code = "TRIPIT_API_ERROR";

  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "TripItApiError";
  }
}

const errorDescriptionKeys = ["error_description", "description", "error_message", "message", "text"];

function normalizedErrorDetail(value: string): string | undefined {
  const detail = value.replace(/\s+/g, " ").trim();
  if (!detail) return undefined;
  return detail.length <= 1_000 ? detail : `${detail.slice(0, 997)}...`;
}

function jsonErrorDetail(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;

  if (Array.isArray(value)) {
    for (const item of value) {
      const detail = jsonErrorDetail(item);
      if (detail) return detail;
    }
    return undefined;
  }

  const record = value as Record<string, unknown>;
  for (const key of errorDescriptionKeys) {
    const candidate = record[key];
    if (typeof candidate === "string") {
      const detail = normalizedErrorDetail(candidate);
      if (detail) return detail;
    }
  }

  for (const nested of Object.values(record)) {
    const detail = jsonErrorDetail(nested);
    if (detail) return detail;
  }
  return undefined;
}

function upstreamErrorDetail(text: string): string | undefined {
  try {
    const detail = jsonErrorDetail(JSON.parse(text));
    if (detail) return detail;
  } catch {
    // TripIt sometimes returns XML or plain text for HTTP errors, even on JSON endpoints.
  }

  for (const tag of errorDescriptionKeys) {
    const match = text.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
    if (match?.[1]) {
      const detail = normalizedErrorDetail(match[1].replace(/<[^>]+>/g, " "));
      if (detail) return detail;
    }
  }

  if (!/<(?:html|body|head)\b/i.test(text)) return normalizedErrorDetail(text.replace(/<[^>]+>/g, " "));
  return undefined;
}

function apiError(status: number, text: string): TripItApiError {
  const detail = upstreamErrorDetail(text);
  const suffix = detail ? `: ${detail}` : ".";
  return new TripItApiError(status, `TripIt API request failed with status ${status}${suffix}`);
}

async function loadTripItConstructor(): Promise<TripItConstructor> {
  const module = (await import("tripit")) as unknown as {
    TripIt?: TripItConstructor;
    default?: TripItConstructor;
  };

  const TripIt = module.TripIt ?? module.default;
  if (!TripIt) {
    throw new Error("Could not load the TripIt client constructor from the tripit package.");
  }

  return TripIt;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export async function createAuthenticatedTripItClient(): Promise<TripItClient> {
  const TripIt = await loadTripItConstructor();
  const client = new TripIt({
    username: requiredEnv("TRIPIT_USERNAME"),
    password: requiredEnv("TRIPIT_PASSWORD"),
    clientId: optionalEnv("TRIPIT_CLIENT_ID"),
  });

  await client.authenticate();
  return client;
}

export async function withTripIt<T>(callback: (client: TripItClient) => Promise<T>): Promise<T> {
  const client = await createAuthenticatedTripItClient();
  return callback(client);
}

export async function tripItApiGet<T>(client: TripItClient, url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${client.getAccessToken()}`,
    },
  });
  const text = await response.text();

  if (!response.ok) {
    throw apiError(response.status, text);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new TripItApiError(response.status, "TripIt returned a non-JSON response.");
  }
}

export async function tripItApiPost<T>(
  client: TripItClient,
  url: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${client.getAccessToken()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ json: JSON.stringify(payload) }).toString(),
  });
  const text = await response.text();

  if (!response.ok) {
    throw apiError(response.status, text);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new TripItApiError(response.status, "TripIt returned a non-JSON response.");
  }
}
