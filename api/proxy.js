// api/proxy.js
export default async function handler(req, res) {
  const targetUrl = "https://launch.meme/api" + req.url.replace(/^\/api/, "");

  try {
    // Берём body правильно
    let body = undefined;
    if (req.method !== "GET" && req.body) {
      if (
        req.headers["content-type"]?.includes("application/json") &&
        typeof req.body !== "string"
      ) {
        body = JSON.stringify(req.body);
      } else if (
        req.headers["content-type"]?.includes(
          "application/x-www-form-urlencoded",
        ) &&
        typeof req.body === "object"
      ) {
        // формируем строку вида a=1&b=2
        body = new URLSearchParams(req.body).toString();
      } else {
        body = req.body; // уже строка
      }
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: "launch.meme",
      },
      body,
    });

    // пробрасываем content-type
    res.setHeader(
      "Content-Type",
      response.headers.get("content-type") || "application/json",
    );

    const text = await response.text();
    res.status(response.status).send(text);
  } catch (e) {
    res.status(500).json({ error: "Proxy error", details: e.message });
  }
}
