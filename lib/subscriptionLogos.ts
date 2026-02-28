/**
 * Subscription service logos and brand colors.
 * Uses Google favicon for known domains; fallback is first letter + hash-based color.
 */

const SERVICE_DOMAINS: Record<string, string> = {
  netflix: "netflix.com",
  spotify: "spotify.com",
  "youtube premium": "youtube.com",
  youtube: "youtube.com",
  "disney+": "disneyplus.com",
  disney: "disneyplus.com",
  anghami: "anghami.com",
  shahid: "shahid.net",
  "amazon prime": "amazon.com",
  amazon: "amazon.com",
  "apple music": "apple.com",
  apple: "apple.com",
  canva: "canva.com",
  "microsoft 365": "microsoft.com",
  microsoft: "microsoft.com",
  dropbox: "dropbox.com",
  "adobe creative cloud": "adobe.com",
  adobe: "adobe.com",
  "playstation plus": "playstation.com",
  playstation: "playstation.com",
  "nintendo switch online": "nintendo.com",
  nintendo: "nintendo.com",
  "google one": "google.com",
  google: "google.com",
  cursor: "cursor.com",
  chatgpt: "openai.com",
  "claude": "anthropic.com",
  anthropic: "anthropic.com",
  openai: "openai.com",
  tidal: "tidal.com",
  deezer: "deezer.com",
  "hbo max": "max.com",
  hulu: "hulu.com",
  "xbox game pass": "xbox.com",
  xbox: "xbox.com",
  "bbc iplayer": "bbc.com",
  bbc: "bbc.com",
  "now tv": "nowtv.com",
  canal: "canalplus.com",
  starzplay: "starzplay.com",
};

const BRAND_COLORS: Record<string, string> = {
  netflix: "#E50914",
  spotify: "#1DB954",
  youtube: "#FF0000",
  disney: "#113CCF",
  anghami: "#FF2D55",
  shahid: "#E50914",
  amazon: "#FF9900",
  apple: "#000000",
  canva: "#00C4CC",
  microsoft: "#00A4EF",
  dropbox: "#0061FF",
  adobe: "#FF0000",
  playstation: "#003791",
  nintendo: "#E60012",
  google: "#4285F4",
  cursor: "#000000",
  openai: "#10A37F",
  anthropic: "#D4A574",
  tidal: "#000000",
  deezer: "#FE0862",
  hulu: "#1CE783",
  xbox: "#107C10",
  bbc: "#BB1919",
  canal: "#FF0000",
};

const FALLBACK_COLORS = [
  "#FF4000", "#f59e0b", "#10b981", "#6366f1", "#ec4899", "#8b5cf6", "#06b6d4", "#84cc16",
];

function normalizeServiceName(name: string): string {
  return name.toLowerCase().trim();
}

function getDomain(serviceName: string): string | null {
  const key = normalizeServiceName(serviceName);
  if (SERVICE_DOMAINS[key]) return SERVICE_DOMAINS[key];
  for (const [k, domain] of Object.entries(SERVICE_DOMAINS)) {
    if (key.includes(k)) return domain;
  }
  return null;
}

function getBrandColor(serviceName: string): string {
  const key = normalizeServiceName(serviceName);
  if (BRAND_COLORS[key]) return BRAND_COLORS[key];
  for (const [k, color] of Object.entries(BRAND_COLORS)) {
    if (key.includes(k)) return color;
  }
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

const FAVICON_BASE = "https://www.google.com/s2/favicons?domain=";

export function getSubscriptionLogoUrl(serviceName: string): string | null {
  const domain = getDomain(serviceName);
  return domain ? `${FAVICON_BASE}${domain}&sz=128` : null;
}

export function getSubscriptionColor(serviceName: string): string {
  return getBrandColor(serviceName);
}

export function getSubscriptionInitial(serviceName: string): string {
  const n = serviceName.trim();
  return n ? n[0].toUpperCase() : "?";
}
