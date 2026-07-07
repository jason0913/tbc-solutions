const crypto = require("crypto");

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function getSpreadsheetId() {
  return (
    process.env.GOOGLE_SHEETS_BASE_LEADS_SPREADSHEET_ID ||
    process.env.GOOGLE_SHEETS_LEADS_SPREADSHEET_ID ||
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID ||
    ""
  );
}

function base64Url(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buffer
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function normalizePrivateKey(value) {
  return value.replace(/\\n/g, "\n");
}

async function getGoogleAccessToken() {
  const clientEmail = getRequiredEnv("GOOGLE_SHEETS_CLIENT_EMAIL");
  const privateKey = normalizePrivateKey(getRequiredEnv("GOOGLE_SHEETS_PRIVATE_KEY"));
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: clientEmail,
    scope: SHEETS_SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const unsignedToken = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claim))}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();

  const assertion = `${unsignedToken}.${base64Url(signer.sign(privateKey))}`;
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    throw new Error(`Google token request failed: ${data.error || response.status}`);
  }

  return data.access_token;
}

function cell(value, maxLength = 1000) {
  return String(value == null ? "" : value).slice(0, maxLength);
}

async function appendBaseLeadRow(row) {
  const spreadsheetId = getSpreadsheetId();
  if (!spreadsheetId) {
    throw new Error(
      "Missing environment variable: GOOGLE_SHEETS_BASE_LEADS_SPREADSHEET_ID"
    );
  }

  const range = process.env.GOOGLE_SHEETS_BASE_LEADS_RANGE || "base_leads!A:H";
  const accessToken = await getGoogleAccessToken();
  const values = [[
    cell(row.created_at, 80),
    cell(row.email, 254),
    cell(row.source, 120),
    cell(row.resource_slug, 120),
    cell(row.resource_title, 200),
    cell(row.page_url, 500),
    cell(row.user_agent, 800),
    cell(row.status, 80),
  ]];

  const endpoint =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}` +
    `/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ values }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Google Sheets append failed: ${data.error?.message || response.status}`);
  }

  return data;
}

module.exports = { appendBaseLeadRow };
