// Vercel Serverless Function — proxies requests to OpenRouter
// (which gives access to Claude and many other models with one API key).
//
// Reads the API key from environment variable CLAUDE_API_KEY,
// which you set in the Vercel dashboard:
//   Project → Settings → Environment Variables
//
// The variable name is CLAUDE_API_KEY for backward compatibility
// even though the value is now an OpenRouter key (sk-or-v1-...).
//
// Endpoint: POST /api/claude
// Body:  { system: string, messages: [{role, content}], model?, max_tokens? }
// Reply: { reply: string }   or   { error: string }

module.exports = async function handler(req, res) {
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
      messages = [],
      model = "claude-sonnet-4-6",
      max_tokens = 600,
    } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Field 'messages' is required (non-empty array)." });
    }

    // OpenRouter is OpenAI-compatible — system goes in messages array
    const fullMessages = system
      ? [{ role: "system", content: system }, ...messages]
      : messages;

    // Upstream API base URL — change this if you switch providers.
    const UPSTREAM = "https://pandaapi.top/v1/chat/completions";

    const upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, max_tokens, messages: fullMessages }),
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return res
        .status(upstream.status)
        .json({ error: `OpenRouter API error: ${text.slice(0, 500)}` });
    }

    const data = JSON.parse(text);
    const reply =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      "";

    return res.status(200).json({ reply: reply.trim() || "(empty response)" });
  } catch (e) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
