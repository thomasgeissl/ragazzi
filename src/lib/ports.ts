/**
 * Normalize a port-like value; fall back when invalid.
 */
export function normalizePort(value: unknown, fallback: number): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return fallback;
  }
  return port;
}

export type ValidateBrokerPortsResult =
  | { ok: true; wsPort: number; tcpPort: number }
  | { ok: false; error: string };

/**
 * Validate WebSocket + TCP broker ports for the Home UI.
 */
export function validateBrokerPorts(
  wsPort: unknown,
  tcpPort: unknown
): ValidateBrokerPortsResult {
  const nextWs = Number(wsPort);
  const nextTcp = Number(tcpPort);

  if (
    !Number.isInteger(nextWs) ||
    !Number.isInteger(nextTcp) ||
    nextWs < 1 ||
    nextWs > 65535 ||
    nextTcp < 1 ||
    nextTcp > 65535
  ) {
    return {
      ok: false,
      error: "Ports must be integers between 1 and 65535.",
    };
  }

  if (nextWs === nextTcp) {
    return {
      ok: false,
      error: "WebSocket and TCP ports must be different.",
    };
  }

  return { ok: true, wsPort: nextWs, tcpPort: nextTcp };
}
