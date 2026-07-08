function getWebhookUrl() {
  const url = process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL;
  console.log("[api/leads/base] GOOGLE_APPS_SCRIPT_WEBHOOK_URL present:", Boolean(url));

  if (!url) {
    const error = new Error("Missing GOOGLE_APPS_SCRIPT_WEBHOOK_URL");
    error.statusCode = 500;
    error.clientError = "Missing GOOGLE_APPS_SCRIPT_WEBHOOK_URL";
    error.code = "config_missing";
    throw error;
  }
  if (!/^https:\/\//i.test(url)) {
    const error = new Error("Invalid GOOGLE_APPS_SCRIPT_WEBHOOK_URL");
    error.statusCode = 500;
    error.clientError = "Invalid GOOGLE_APPS_SCRIPT_WEBHOOK_URL";
    error.code = "config_invalid";
    throw error;
  }
  return url;
}

function safeResponseText(text) {
  return String(text || "").slice(0, 2000);
}

function webhookError(message, detail, code = "webhook_failed") {
  const error = new Error(message);
  error.statusCode = 502;
  error.clientError = message;
  error.safeDetail = safeResponseText(detail);
  error.code = code;
  return error;
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
    console.log("[api/leads/base] Apps Script response status:", response.status);
    console.log("[api/leads/base] Apps Script response text:", safeResponseText(text));

    if (!response.ok) {
      throw webhookError("Apps Script webhook failed", text || response.status);
    }

    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (_error) {
      throw webhookError("Apps Script webhook returned invalid JSON", text, "webhook_invalid_json");
    }

    if (data.ok !== true) {
      throw webhookError("Apps Script returned ok:false", data.error || text, "webhook_ok_false");
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { postBaseLeadToAppsScript };
