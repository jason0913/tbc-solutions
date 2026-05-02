// Netlify Serverless Function — proxies requests to OpenRouter
// (which gives access to Claude and many other models with one API key).
//
// Reads the API key from environment variable CLAUDE_API_KEY,
// which you set in the Netlify dashboard:
//   Site → Site configuration → Environment variables
//
// The variable name is CLAUDE_API_KEY for backward compatibility
// even though the value is now an OpenRouter key (sk-or-v1-...).
//
// Endpoint:
//   POST /.netlify/functions/claude
// (or POST /api/claude — see the redirect rule in /netlify.toml)
//
// Body:  { system: string, messages: [{role, content}], model?, max_tokens? }
// Reply: { reply: string }   or   { error: string }

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type",
      },
    };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        error:
          "Server is missing CLAUDE_API_KEY. Set it under Netlify → Site configuration → Environment variables, then redeploy.",
      }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const {
      system,
      messages = [],
      model = "claude-sonnet-4-6",
      max_tokens = 600,
    } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Field 'messages' is required (non-empty array)." }),
      };
    }

    // OpenRouter is OpenAI-compatible — system goes in messages array
    const fullMessages = system
      ? [{ role: "system", content: system }, ...messages]
      : messages;

    // Upstream API base URL — change this if you switch providers.
    // Currently using a third-party OpenAI-compatible relay.
    const UPSTREAM = "https://babycookbook.top/v1/chat/completions";

    const upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens,
        messages: fullMessages,
      }),
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return {
        statusCode: upstream.status,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: `OpenRouter API error: ${text.slice(0, 500)}` }),
      };
    }

    const data = JSON.parse(text);
    const reply =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      "";

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reply: reply.trim() || "(empty response)" }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: e?.message || String(e) }),
    };
  }
};
