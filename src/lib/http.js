function buildUrl(baseUrl, pathname) {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const normalizedPathname = pathname.startsWith("/") ? pathname.slice(1) : pathname;
  return new URL(normalizedPathname, normalizedBaseUrl).toString();
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs || 4_000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        accept: "application/json",
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    const rawBody = await response.text();
    let body = null;

    if (rawBody) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        body = { rawBody };
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      body,
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  buildUrl,
  fetchJson,
};