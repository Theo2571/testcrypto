const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "https://launch.meme",
      changeOrigin: true,
      secure: false,
    }),
  );
};
