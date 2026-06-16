"use client";

/**
 * Browser-localStorage Persistence (MVP).
 *
 * SSR-safe: alle Methoden returnen sicher null/no-op auf dem Server.
 */

import type {
  DovetailSessionState,
  ProgressEntry,
  ModesPersistedState,
  PlacementsPersistedState,
} from "./types.js";
import type { DovetailStep, Pose } from "@craft-codex/core";

const KEY_SESSION = "craft-codex:dovetail:session";
const KEY_PROGRESS = "craft-codex:dovetail:progress";
const KEY_MODES = "craft-codex:surface:modes";
const KEY_PLACEMENTS = "craft-codex:tracking:placements";

function isBrowser(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function safeGet<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeSet<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota or serialize error — silent in MVP
  }
}

export function loadSession(): DovetailSessionState | null {
  return safeGet<DovetailSessionState>(KEY_SESSION);
}

export function saveSession(state: DovetailSessionState): void {
  safeSet(KEY_SESSION, { ...state, updatedAt: Date.now() });
}

// Fortschritt gibt es nur für die fünf Handschritte — "ueberblick" (Schritt 0)
// ist reine Erklärung und wird nicht als erledigt/offen getrackt.
type CraftStep = Exclude<DovetailStep, "ueberblick">;

export function loadProgress(): Record<CraftStep, ProgressEntry> | null {
  return safeGet<Record<CraftStep, ProgressEntry>>(KEY_PROGRESS);
}

export function saveProgress(
  progress: Record<CraftStep, ProgressEntry>,
): void {
  safeSet(KEY_PROGRESS, progress);
}

export function loadModes(): ModesPersistedState | null {
  return safeGet<ModesPersistedState>(KEY_MODES);
}

export function saveModes(state: ModesPersistedState): void {
  safeSet(KEY_MODES, state);
}

export function loadPlacements(): PlacementsPersistedState | null {
  return safeGet<PlacementsPersistedState>(KEY_PLACEMENTS);
}

export function savePlacement(targetId: string, pose: Pose): void {
  const existing = loadPlacements()?.poses ?? {};
  safeSet(KEY_PLACEMENTS, {
    poses: { ...existing, [targetId]: pose },
    updatedAt: Date.now(),
  });
}

export function clearPlacement(targetId: string): void {
  const existing = loadPlacements();
  if (!existing) return;
  const { [targetId]: _removed, ...rest } = existing.poses;
  void _removed;
  safeSet(KEY_PLACEMENTS, {
    poses: rest,
    updatedAt: Date.now(),
  });
}

export function clearAllPlacements(): void {
  safeSet(KEY_PLACEMENTS, { poses: {}, updatedAt: Date.now() });
}
