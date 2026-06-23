const WC_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";
const CACHE_MS = 5 * 60 * 1000;

let cache = { data: null, fetchedAt: 0 };

function ukToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date());
}

function isPlaceholder(team) {
  return /^[WL]\d+/.test(team || "");
}

function displayTeam(team) {
  if (!team || isPlaceholder(team)) return "TBD";
  return team;
}

function formatKickoff(date, time) {
  if (!time) return date;
  const cleaned = time.replace(/\s*UTC[+-]?\d*\s*$/, "").trim();
  return `${date} · ${cleaned}`;
}

function normalizeMatch(match) {
  const finished = Boolean(match.score?.ft);
  return {
    date: match.date,
    round: match.round || "",
    group: match.group || "",
    team1: displayTeam(match.team1),
    team2: displayTeam(match.team2),
    score1: finished ? match.score.ft[0] : null,
    score2: finished ? match.score.ft[1] : null,
    kickoff: formatKickoff(match.date, match.time),
    ground: match.ground || "",
    finished,
  };
}

function buildPayload(matches) {
  const today = ukToday();
  const finished = matches.filter((m) => m.score?.ft).map(normalizeMatch);
  const upcoming = matches.filter((m) => !m.score?.ft).map(normalizeMatch);

  const todayMatches = matches
    .filter((m) => m.date === today)
    .map(normalizeMatch);

  const recentResults = finished.slice(-8).reverse();
  const nextFixtures = upcoming.slice(0, 8);

  return {
    tournament: "World Cup 2026",
    today,
    todayMatches,
    recentResults,
    nextFixtures,
    updatedAt: new Date().toISOString(),
  };
}

async function fetchWorldCupData() {
  const res = await fetch(WC_URL, {
    headers: { "User-Agent": "DailyFeedNewsUK/1.0" },
  });
  if (!res.ok) throw new Error("World Cup feed unavailable");
  const json = await res.json();
  return buildPayload(json.matches || []);
}

async function getWorldCupSummary() {
  const now = Date.now();
  if (cache.data && now - cache.fetchedAt < CACHE_MS) {
    return cache.data;
  }

  const data = await fetchWorldCupData();
  cache = { data, fetchedAt: now };
  return data;
}

module.exports = { getWorldCupSummary };
