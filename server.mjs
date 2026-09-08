/* Bagimliliksiz statik sunucu. Yalnizca depo kokundeki dosyalari servis eder. */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, normalize, extname } from "node:path";

const ROOT = process.cwd();
const PORT = Number(process.env.PORT || 4173);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    let rel = decodeURIComponent(url.pathname);
    if (rel === "/" || rel.endsWith("/")) { rel += "index.html"; }
    const path = join(ROOT, normalize(rel).replace(/^(\.\.[/\\])+/, ""));
    if (!path.startsWith(ROOT)) { res.writeHead(403).end("forbidden"); return; }
    const info = await stat(path);
    if (!info.isFile()) { res.writeHead(404).end("not found"); return; }
    const body = await readFile(path);
    res.writeHead(200, {
      "content-type": TYPES[extname(path)] || "application/octet-stream",
      "cache-control": "no-store"
    });
    res.end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
}).listen(PORT, () => {
  console.log("serving " + ROOT + " on http://localhost:" + PORT);
});
