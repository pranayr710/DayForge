import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createId(prefix = 'df'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

/**
 * Returns a safe href for a user-supplied link, or undefined if it must not be
 * rendered. Blocks javascript:/data: and similar schemes, upgrades bare domains
 * (e.g. "www.example.org") to https so they don't resolve as in-app routes.
 */
export function safeExternalUrl(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  // Any other explicit scheme (javascript:, data:, vbscript:, file:, …) is rejected.
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return undefined;
  return `https://${trimmed}`;
}
