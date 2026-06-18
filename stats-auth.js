const crypto = require("crypto");

const SESSION_COOKIE = "stats_session";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function getStatsPassword() {
  return process.env.STATS_PASSWORD || null;
}

function getSessionSecret() {
  return process.env.STATS_SECRET || "daily-feed-news-uk-stats-session";
}

function createSessionToken() {
  return crypto.createHmac("sha256", getSessionSecret()).update("stats-authenticated").digest("hex");
}

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function verifyPassword(password) {
  const expected = getStatsPassword();
  if (!expected || typeof password !== "string") return false;
  return timingSafeEqual(password, expected);
}

function verifySessionToken(token) {
  if (!token) return false;
  return timingSafeEqual(token, createSessionToken());
}

function parseCookies(header) {
  if (!header) return {};
  return header.split(";").reduce((cookies, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (key) cookies[key] = decodeURIComponent(rest.join("="));
    return cookies;
  }, {});
}

function isStatsAuthed(req) {
  const cookies = parseCookies(req.headers.cookie);
  return verifySessionToken(cookies[SESSION_COOKIE]);
}

function setSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${createSessionToken()}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(SESSION_MAX_AGE_MS / 1000)}`
  );
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
}

function requireStatsAuth(req, res, next) {
  if (!getStatsPassword()) {
    return res.status(503).json({ error: "Stats are not configured. Set STATS_PASSWORD." });
  }
  if (isStatsAuthed(req)) return next();
  return res.status(401).json({ error: "Unauthorized" });
}

module.exports = {
  SESSION_COOKIE,
  getStatsPassword,
  verifyPassword,
  isStatsAuthed,
  setSessionCookie,
  clearSessionCookie,
  requireStatsAuth,
};
