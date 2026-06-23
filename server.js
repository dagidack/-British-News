const express = require("express");
const path = require("path");
const Parser = require("rss-parser");
const { tabs } = require("./feeds");
const { getWorldCupSummary } = require("./worldcup");

const app = express();
const parser = new Parser({
  timeout: 12000,
  headers: {
    "User-Agent": "DailyFeedNewsUK/1.0 (news aggregator)",
    Accept: "application/rss+xml, application/xml, text/xml",
  },
});

const PORT = process.env.PORT || 3000;

function dedupeByLink(articles) {
  const seen = new Set();
  return articles.filter((a) => {
    if (!a.link || seen.has(a.link)) return false;
    seen.add(a.link);
    return true;
  });
}

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

app.get("/api/worldcup", async (_req, res) => {
  try {
    res.json(await getWorldCupSummary());
  } catch {
    res.status(503).json({ error: "World Cup data unavailable" });
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`Daily Feed News UK running at http://localhost:${PORT}`);
});
