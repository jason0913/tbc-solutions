// Vercel Serverless Function — capture a lead email and notify via Resend.
//
// Lite v1 (no database): validate email + honeypot, then email the lead to you.
// CRM / Airtable / Notion can be added in phase 2.
//
// Required env (Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY   re_xxx...           (https://resend.com)
//   LEAD_NOTIFY_TO   you@email.com       (where lead notifications land)
//   LEAD_FROM        hello@tbchk.com     (must be a Resend-verified domain/sender)
//
// Endpoint: POST /api/lead
// Body:  { email, company (honeypot), source?, lang?, page? }
// Reply: { ok: true }  or  { error: string }

function esc(s){
  return String(s == null ? "" : s).replace(/[&<>"]/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

module.exports = async function handler(req, res){
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const body = (req.body && typeof req.body === "object")
      ? req.body
      : JSON.parse(req.body || "{}");

    const email   = (body.email || "").toString().trim();
    const company = (body.company || "").toString().trim(); // honeypot — humans leave it blank

    // Honeypot tripped → pretend success, send nothing.
    if (company) return res.status(200).json({ ok: true });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email" });
    }

    const KEY  = process.env.RESEND_API_KEY;
    const TO   = process.env.LEAD_NOTIFY_TO;
    const FROM = process.env.LEAD_FROM;
    if (!KEY || !TO || !FROM) {
      return res.status(500).json({ error: "Lead capture not configured (missing RESEND_API_KEY / LEAD_NOTIFY_TO / LEAD_FROM)." });
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
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: email,
        subject: "🟢 New lead: " + email,
        html,
      }),
    });

    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return res.status(502).json({ error: "Email send failed", detail: t.slice(0, 200) });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: (e && e.message) || "Server error" });
  }
};
