/**
 * Document Utilities for Bank Account Openings
 * Handles parsing single or multiple document paths stored locally.
 */

export function parseDocPaths(pathStr?: string | null): string[] {
  if (!pathStr || !pathStr.trim()) return [];
  const trimmed = pathStr.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((p) => String(p).trim()).filter(Boolean);
      }
    } catch {
      // Fallback if JSON parsing fails
    }
  }
  return [trimmed];
}

export function formatDocPathsForStorage(paths: string[]): string | undefined {
  const clean = paths.map((p) => p.trim()).filter(Boolean);
  if (clean.length === 0) return undefined;
  if (clean.length === 1) return clean[0];
  return JSON.stringify(clean);
}
