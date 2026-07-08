function getWebhookUrl() {
  const url = process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL;
  if (!url) {
    throw new Error("Missing environment variable: GOOGLE_APPS_SCRIPT_WEBHOOK_URL");
  }
  if (!/^https:\/\//i.test(url)) {
    throw new Error("Invalid GOOGLE_APPS_SCRIPT_WEBHOOK_URL");
  }
  return url;
}

async function postBaseLeadToAppsScript(payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(getWebhookUrl(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
      signal: controller.signal,
    });

    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (_error) {
      throw new Error("Apps Script webhook returned invalid JSON");
    }

    if (!response.ok || data.ok !== true) {
      throw new Error(`Apps Script webhook failed: ${data.error || response.status}`);
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { postBaseLeadToAppsScript };
