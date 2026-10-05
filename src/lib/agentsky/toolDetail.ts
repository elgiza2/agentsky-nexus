/** Serialize only bounded, redacted tool data; never render tool HTML as markup. */
export function safeToolDetail(value: unknown): string {
  if (value == null) return "";
  const secret = /^(authorization|password|secret|api[_-]?key|access[_-]?token|refresh[_-]?token|cookie|token)$/i;
  try {
    const text = typeof value === "string" ? value : JSON.stringify(value, (key, item) => secret.test(key) ? "[redacted]" : item, 2);
    return text.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]").replace(/<!--megsy:[\s\S]*?-->/g, "").slice(0, 16000);
  } catch { return ""; }
}