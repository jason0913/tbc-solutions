// Netlify Serverless Function — proxies requests to the Anthropic Claude API
// so the API key stays on the server (never shipped to the browser).
//
// Reads the API key from environment variable CLAUDE_API_KEY,
// which you set in the Netlify dashboard:
//   Site → Site configuration → Environment variables
//
// Endpoint:
//   POST /.netlify/functions/claude
// (or POST /api/claude — see the redirect rule in /netlify.toml)
//
// Body:  { system: string, messages: [{role, content}], model?, max_tokens? }
// Reply: { reply: string }   or   { error: string }

exports.handler = async (event) => {
  // CORS / method gate
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
      messages,
      model = "claude-sonnet-4-5",
      max_tokens = 600,
    } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Field 'messages' is required (non-empty array)." }),
      };
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
      return {
        statusCode: upstream.status,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: `Anthropic API error: ${text.slice(0, 500)}` }),
      };
    }

    const data = JSON.parse(text);
    const reply =
      Array.isArray(data?.content) && data.content[0]?.text
        ? data.content[0].text
        : "";

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
