function normalizePort(value, fallback) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return fallback;
  }
  return port;
}

module.exports = { normalizePort };
