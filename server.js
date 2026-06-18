const express = require("express");
const fs = require("fs");
const path = require("path");
const Parser = require("rss-parser");
const { tabs } = require("./feeds");
const { recordVisit, getSummary, shouldTrackPath } = require("./stats-store");
const {
  getStatsPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
  requireStatsAuth,
} = require("./stats-auth");

const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const eq = trimmed.indexOf("=");
      if (eq === -1) return;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (key && process.env[key] === undefined) process.env[key] = value;
    });
}

const app = express();
const parser = new Parser({
  timeout: 12000,
  headers: {
    "User-Agent": "DailyFeedNewsUK/1.0 (news aggregator)",
    Accept: "application/rss+xml, application/xml, text/xml",
  },
});

const PORT = process.env.PORT || 3000;

app.use(express.json());

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}

app.use((req, res, next) => {
  if (req.method === "GET" && shouldTrackPath(req.path)) {
    recordVisit(clientIp(req));
  }
  next();
});

function dedupeByLink(articles) {
  const seen = new Set();
  return articles.filter((a) => {
    if (!a.link || seen.has(a.link)) return false;
    seen.add(a.link);
    return true;
  });
}

app.get("/stats", (_req, res) => {
  res.sendFile(path.join(__dirname, "private", "stats.html"));
});

app.post("/api/stats/login", (req, res) => {
  if (!getStatsPassword()) {
    return res.status(503).json({ error: "Stats are not configured." });
  }
  if (!verifyPassword(req.body?.password)) {
    return res.status(401).json({ error: "Incorrect password." });
  }
  setSessionCookie(res);
  return res.json({ ok: true });
});

app.post("/api/stats/logout", (_req, res) => {
  clearSessionCookie(res);
  return res.json({ ok: true });
});

app.get("/api/stats/summary", requireStatsAuth, (_req, res) => {
  res.json(getSummary());
});

app.get("/api/tabs", (_req, res) => {
  res.json(
    tabs.map(({ id, label, feeds }) => ({
      id,
      label,
      publishers: feeds
        .map((f) => f.name)
        .sort((a, b) => a.localeCompare(b, "en-GB")),
    }))
  );
});

app.get("/api/feed/:tabId", async (req, res) => {
  const tab = tabs.find((t) => t.id === req.params.tabId);
  if (!tab) {
    return res.status(404).json({ error: "Tab not found" });
  }

  const isHome = tab.id === "national";
  const perFeed = isHome ? 35 : 25;
  const maxArticles = isHome ? 250 : 100;
  const maxAgeMs = 5 * 24 * 60 * 60 * 1000;

  const results = await Promise.allSettled(
    tab.feeds.map(async (feed) => {
      const parsed = await parser.parseURL(feed.url);
      return (parsed.items || []).slice(0, perFeed).map((item) => ({
        title: item.title || "Untitled",
        link: item.link || "#",
        source: feed.name,
        date: item.isoDate || item.pubDate || null,
      }));
    })
  );

  const articles = [];
  const errors = [];

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      articles.push(...result.value);
    } else {
      errors.push(tab.feeds[i].name);
    }
  });

  const cutoff = Date.now() - maxAgeMs;

  const recent = dedupeByLink(articles).filter((a) => {
    if (!a.date) return false;
    const t = new Date(a.date).getTime();
    return !Number.isNaN(t) && t >= cutoff;
  });

  recent.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  res.json({
    articles: recent.slice(0, maxArticles),
    errors,
    publishers: tab.feeds
      .map((f) => f.name)
      .sort((a, b) => a.localeCompare(b, "en-GB")),
  });
});

app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`Daily Feed News UK running at http://localhost:${PORT}`);
  if (getStatsPassword()) {
    console.log(`Private visit stats: http://localhost:${PORT}/stats`);
  } else {
    console.warn("STATS_PASSWORD is not set — visit statistics are disabled.");
  }
});
