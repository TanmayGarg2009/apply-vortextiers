/**
 * Shared singleton client for Vortex Tiers Player API
 * Eliminates duplicate network downloads and provides in-memory + sessionStorage caching
 */

export interface TierInfo {
  tier: number;
  pos: number;
  tier_name?: string;
  points?: number;
}

export interface PlayerRecord {
  id?: string;
  username: string;
  avatar?: string;
  roles?: string[];
  title?: string;
  points?: number;
  region?: string;
  overall?: {
    points: number;
    rank: number;
  };
  tiers?: Record<string, any>;
  [key: string]: any;
}

let memoryPlayersCache: PlayerRecord[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let inFlightPromise: Promise<PlayerRecord[]> | null = null;

export async function getPlayersList(): Promise<PlayerRecord[]> {
  const now = Date.now();

  // 1. Check in-memory cache
  if (memoryPlayersCache && now - cacheTimestamp < CACHE_TTL_MS) {
    return memoryPlayersCache;
  }

  // 2. Check browser sessionStorage if available
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem("vortex_cached_players_list");
      const storedTs = sessionStorage.getItem("vortex_cached_players_ts");
      if (stored && storedTs && now - parseInt(storedTs, 10) < CACHE_TTL_MS) {
        memoryPlayersCache = JSON.parse(stored);
        cacheTimestamp = parseInt(storedTs, 10);
        return memoryPlayersCache || [];
      }
    } catch {}
  }

  // 3. Deduplicate in-flight fetch
  if (inFlightPromise) {
    return inFlightPromise;
  }

  inFlightPromise = (async () => {
    try {
      const res = await fetch("https://api.vortextiers.xyz/players-api", {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const players: PlayerRecord[] = Array.isArray(data?.players) ? data.players : [];

      memoryPlayersCache = players;
      cacheTimestamp = Date.now();

      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("vortex_cached_players_list", JSON.stringify(players));
          sessionStorage.setItem("vortex_cached_players_ts", String(cacheTimestamp));
        } catch {}
      }

      return players;
    } catch (err) {
      console.warn("Failed to fetch players list:", err);
      return memoryPlayersCache || [];
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
}

export async function searchPlayers(query: string, limit = 8): Promise<PlayerRecord[]> {
  if (!query || query.trim().length < 2) return [];
  const players = await getPlayersList();
  const q = query.trim().toLowerCase();
  return players
    .filter((p) => p.username?.toLowerCase().includes(q))
    .slice(0, limit);
}

export async function findPlayerByUsername(username: string): Promise<PlayerRecord | null> {
  if (!username || username.trim().length < 3) return null;
  const players = await getPlayersList();
  const u = username.trim().toLowerCase();
  return players.find((p) => p.username?.toLowerCase() === u) || null;
}
