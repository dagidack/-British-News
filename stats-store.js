const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "data");
const STATS_FILE = path.join(DATA_DIR, "stats.json");
const IP_HASH_SALT = process.env.STATS_SECRET || "daily-feed-news-uk-stats";

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date());
}

function hashVisitor(ip) {
  return crypto.createHash("sha256").update(`${IP_HASH_SALT}:${ip}`).digest("hex").slice(0, 16);
}

function loadStats() {
  try {
    if (fs.existsSync(STATS_FILE)) {
      return JSON.parse(fs.readFileSync(STATS_FILE, "utf8"));
    }
  } catch {
    /* use defaults */
  }
  return { totalViews: 0, daily: {}, lastVisit: null };
}

function saveStats(stats) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
}

function pruneOldDays(stats, keepDays = 90) {
  const keys = Object.keys(stats.daily).sort();
  while (keys.length > keepDays) {
    const oldest = keys.shift();
    delete stats.daily[oldest];
  }
}

function recordVisit(ip) {
  const stats = loadStats();
  const day = todayKey();
  const visitorId = hashVisitor(ip || "unknown");

  stats.totalViews += 1;
  stats.lastVisit = new Date().toISOString();

  if (!stats.daily[day]) {
    stats.daily[day] = { views: 0, visitors: [] };
  }

  stats.daily[day].views += 1;
  if (!stats.daily[day].visitors.includes(visitorId)) {
    stats.daily[day].visitors.push(visitorId);
  }

  pruneOldDays(stats);
  saveStats(stats);
}

function lastNDays(n) {
  const days = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(
      new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(d)
    );
  }
  return days;
}

function getSummary() {
  const stats = loadStats();
  const today = todayKey();
  const todayStats = stats.daily[today] || { views: 0, visitors: [] };

  const recentDays = lastNDays(14).map((date) => {
    const day = stats.daily[date] || { views: 0, visitors: [] };
    return {
      date,
      views: day.views,
      uniqueVisitors: day.visitors.length,
    };
  });

  const last7 = recentDays.slice(-7);
  const weekViews = last7.reduce((sum, d) => sum + d.views, 0);
  const weekUnique = new Set(
    last7.flatMap((d) => {
      const day = stats.daily[d.date];
      return day ? day.visitors : [];
    })
  ).size;

  return {
    totalViews: stats.totalViews,
    todayViews: todayStats.views,
    todayUniqueVisitors: todayStats.visitors.length,
    weekViews,
    weekUniqueVisitors: weekUnique,
    lastVisit: stats.lastVisit,
    recentDays,
    timezone: "Europe/London",
    generatedAt: new Date().toISOString(),
  };
}

function shouldTrackPath(urlPath) {
  if (urlPath.startsWith("/stats") || urlPath.startsWith("/api/stats")) return false;
  if (urlPath.startsWith("/api/")) return false;
  if (urlPath === "/") return true;
  return urlPath.endsWith(".html");
}

module.exports = {
  recordVisit,
  getSummary,
  shouldTrackPath,
};
