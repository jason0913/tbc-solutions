// Vercel Serverless Function — proxies requests to the Anthropic Claude API
// so the API key stays on the server (never shipped to the browser).
//
// Reads the API key from the environment variable CLAUDE_API_KEY,
// which you set in the Vercel dashboard:
//   Project → Settings → Environment Variables
//
// Endpoint: POST /api/claude
// Body:  { system: string, messages: [{role, content}], model?, max_tokens? }
// Reply: { reply: string }   or   { error: string }

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error:
        "Server is missing CLAUDE_API_KEY. Set it under Vercel → Project → Settings → Environment Variables, then redeploy.",
    });
  }

  try {
    const {
      system,
      messages,
      model = "claude-sonnet-4-5",
      max_tokens = 600,
    } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Field 'messages' is required (non-empty array)." });
    }

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({ model, max_tokens, system, messages }),
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      // Pass through Anthropic's error message but keep status meaningful
      return res
        .status(upstream.status)
        .json({ error: `Anthropic API error: ${text.slice(0, 500)}` });
    }

    const data = JSON.parse(text);
    const reply =
      Array.isArray(data?.content) && data.content[0]?.text
        ? data.content[0].text
        : "";

    return res.status(200).json({ reply: reply.trim() || "(empty response)" });
  } catch (e) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
