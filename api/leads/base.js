const { appendBaseLeadRow } = require("../_lib/googleSheets");

function parseJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (!req.body) return {};
  if (typeof req.body !== "string") return {};

  try {
    return JSON.parse(req.body);
  } catch (_error) {
    const error = new Error("Invalid JSON body");
    error.statusCode = 400;
    throw error;
  }
}

function clean(value, maxLength = 500) {
  return String(value == null ? "" : value).trim().slice(0, maxLength);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function mapError(error) {
  if (error.statusCode) return error.statusCode;
  if (/Missing environment variable/.test(error.message || "")) return 500;
  if (/Google token request failed|Google Sheets append failed/.test(error.message || "")) return 502;
  return 500;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = parseJsonBody(req);
    const email = clean(body.email, 254).toLowerCase();

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email" });
    }

    const row = {
      created_at: new Date().toISOString(),
      email,
      source: clean(body.source || "blog_base", 120),
      resource_slug: clean(body.resource_slug || "base", 120),
      resource_title: clean(body.resource_title || "業務資料整理框架", 200),
      page_url: clean(body.page_url, 500),
      user_agent: clean(body.user_agent || (req.headers && req.headers["user-agent"]), 800),
      status: clean(body.status || "unlocked", 80),
    };

    await appendBaseLeadRow(row);
    return res.status(200).json({ ok: true });
  } catch (error) {
    const statusCode = mapError(error);
    const message =
      statusCode === 400
        ? error.message
        : "Failed to save lead";

    console.error("[api/leads/base]", error);
    return res.status(statusCode).json({ error: message });
  }
};
