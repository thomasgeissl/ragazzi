/**
 * Normalize a port-like value; fall back when invalid.
 * Keep in sync with public/ports.js (Electron main).
 */
export function normalizePort(value, fallback) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return fallback;
  }
  return port;
}

/**
 * Validate WebSocket + TCP broker ports for the Home UI.
 * @returns {{ ok: true, wsPort: number, tcpPort: number } | { ok: false, error: string }}
 */
export function validateBrokerPorts(wsPort, tcpPort) {
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
