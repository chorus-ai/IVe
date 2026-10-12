import { genConfig } from "react-nice-avatar";

const cache = new Map<string, ReturnType<typeof genConfig>>();

export function avatarConfigFrom(stored?: string | null) {
  if (!stored) return null;
  const cached = cache.get(stored);
  if (cached) return cached;
  try {
    const cfg = genConfig(JSON.parse(stored));
    cache.set(stored, cfg);
    return cfg;
  } catch {
    return null;
  }
}
