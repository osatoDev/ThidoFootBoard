type RequestHeaders = Record<string, string | string[] | undefined>;

type RequestLike = {
  headers?: RequestHeaders;
  method?: string;
};

export type RequestLog = {
  requestId?: string;
  route: string;
  startedAt: number;
};

function headerValue(headers: RequestHeaders | undefined, name: string) {
  const value = headers?.[name];
  return Array.isArray(value) ? value[0] : value;
}

function writeLog(level: "error" | "info", payload: Record<string, unknown>) {
  const serialized = JSON.stringify({ level, ...payload });
  if (level === "error") {
    console.error(serialized);
    return;
  }
  console.log(serialized);
}

export function startRequestLog(route: string, request: RequestLike): RequestLog {
  const requestLog = {
    requestId: headerValue(request.headers, "x-vercel-id"),
    route,
    startedAt: Date.now(),
  };
  writeLog("info", {
    message: "request_started",
    method: request.method,
    requestId: requestLog.requestId,
    route,
  });
  return requestLog;
}

export function finishRequestLog(
  requestLog: RequestLog,
  status: number,
  properties: Record<string, unknown> = {},
) {
  writeLog("info", {
    message: "request_completed",
    durationMs: Date.now() - requestLog.startedAt,
    requestId: requestLog.requestId,
    route: requestLog.route,
    status,
    ...properties,
  });
}

export function failRequestLog(
  requestLog: RequestLog,
  status: number,
  error: unknown,
) {
  writeLog("error", {
    message: "request_failed",
    durationMs: Date.now() - requestLog.startedAt,
    error: error instanceof Error ? error.message : String(error),
    requestId: requestLog.requestId,
    route: requestLog.route,
    status,
  });
}

export function logFeatureSuggestion(
  requestLog: RequestLog,
  category: string,
  suggestion: string,
) {
  writeLog("info", {
    message: "feature_suggestion_submitted",
    category,
    requestId: requestLog.requestId,
    route: requestLog.route,
    suggestion,
  });
}
