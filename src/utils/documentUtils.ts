/**
 * Document Utilities for Bank Account Openings
 * Handles parsing, serialization, and name extraction for single or multiple document paths stored locally.
 */

export function parseDocPaths(pathStr?: string | null): string[] {
  if (!pathStr || !pathStr.trim()) return [];
  const trimmed = pathStr.trim();
  if (trimmed === '[]') return [];

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
  return JSON.stringify(clean);
}

export function extractFileName(pathStr?: string | null, fallback = 'Document'): string {
  if (!pathStr || !pathStr.trim()) return fallback;
  const normalized = pathStr.trim().replace(/\\/g, '/');
  const base = normalized.split('/').pop() || fallback;
  // If the filename starts with type prefix and timestamp (e.g. aadhaar_1732300000000_front.jpg), strip timestamp for clean display
  const cleaned = base.replace(/^[a-z]+_\d{10,14}_/, '');
  return cleaned || base;
}
