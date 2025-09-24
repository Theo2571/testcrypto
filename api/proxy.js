// api/proxy.js
export default async function handler(req, res) {
  const targetUrl = "https://launch.meme" + req.url.replace(/^\/api/, "");

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: "launch.meme",
      },
      body: req.method !== "GET" ? req.body : undefined,
    });

    res.setHeader(
      "Content-Type",
      response.headers.get("content-type") || "application/json",
    );

    const data = await response.text();
    res.status(response.status).send(data);
  } catch (e) {
    res.status(500).json({ error: "Proxy error", details: e.message });
  }
}
