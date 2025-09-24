// api/proxy.js
export default async function handler(req, res) {
  const targetUrl = "https://launch.meme" + req.url.replace(/^\/api/, "");

  try {
    // тело запроса (строка или null)
    let body = undefined;
    if (req.method !== "GET" && req.body) {
      // если body уже строка → оставляем
      // если объект → превращаем в строку
      body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: "launch.meme",
      },
      body,
    });

    // проброс заголовков и данных
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
