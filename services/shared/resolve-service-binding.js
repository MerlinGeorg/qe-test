function resolvePortFromUrl(urlValue, fallbackPort) {
  if (!urlValue) {
    return fallbackPort;
  }

  try {
    const parsedUrl = new URL(urlValue);
    return Number(parsedUrl.port || fallbackPort);
  } catch {
    return fallbackPort;
  }
}

function resolveHostFromUrl(urlValue, fallbackHost) {
  if (!urlValue) {
    return fallbackHost;
  }

  try {
    const parsedUrl = new URL(urlValue);
    return parsedUrl.hostname || fallbackHost;
  } catch {
    return fallbackHost;
  }
}

module.exports = {
  resolveHostFromUrl,
  resolvePortFromUrl,
};