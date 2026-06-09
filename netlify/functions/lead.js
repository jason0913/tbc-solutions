// Netlify Function — parity with the Vercel /api/lead handler.
// Same env vars: RESEND_API_KEY, LEAD_NOTIFY_TO, LEAD_FROM.
// Reached via the /api/lead redirect in netlify.toml.

function esc(s){
  return String(s == null ? "" : s).replace(/[&<>"]/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { "Allow": "POST" }, body: JSON.stringify({ error: "Method not allowed" }) };
  }
  try {
    const body = JSON.parse(event.body || "{}");
    const email   = (body.email || "").toString().trim();
    const company = (body.company || "").toString().trim(); // honeypot

    if (company) return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid email" }) };
    }

    const KEY  = process.env.RESEND_API_KEY;
    const TO   = process.env.LEAD_NOTIFY_TO;
    const FROM = process.env.LEAD_FROM;
    if (!KEY || !TO || !FROM) {
      return { statusCode: 500, body: JSON.stringify({ error: "Lead capture not configured (missing RESEND env vars)." }) };
    }

    const source = (body.source || "").toString().slice(0, 40);
    const lang   = (body.lang   || "").toString().slice(0, 8);
    const page   = (body.page   || "").toString().slice(0, 300);

    const html =
      "<h2>New lead from the TBC Solutions site</h2>" +
      "<p><strong>Email:</strong> " + esc(email) + "</p>" +
      "<p><strong>Industry:</strong> " + (esc(source) || "(not set)") + "</p>" +
      "<p><strong>Language:</strong> " + esc(lang) + "</p>" +
      "<p><strong>Page:</strong> " + esc(page) + "</p>" +
      "<p><strong>Time:</strong> " + new Date().toISOString() + "</p>";

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": "Bearer " + KEY, "content-type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [TO], reply_to: email, subject: "🟢 New lead: " + email, html }),
    });

    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return { statusCode: 502, body: JSON.stringify({ error: "Email send failed", detail: t.slice(0, 200) }) };
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: (e && e.message) || "Server error" }) };
  }
};
