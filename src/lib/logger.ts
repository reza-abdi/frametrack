type LogContext = Record<string, string | number | boolean | null | undefined>;

export function safeErrorType(error: unknown): string {
  if (error instanceof Error && error.name) return error.name;
  return "UnknownError";
}

export function logServerError(
  event: string,
  error: unknown,
  context: LogContext = {}
): void {
  const safeContext = Object.fromEntries(
    Object.entries(context).filter(([, value]) => value !== undefined)
  );
  console.error(
    JSON.stringify({
      level: "error",
      event,
      errorType: safeErrorType(error),
      ...safeContext,
      timestamp: new Date().toISOString(),
    })
  );
}
