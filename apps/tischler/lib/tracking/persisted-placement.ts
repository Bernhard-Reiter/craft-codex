"use client";

import type { Pose, TrackingTarget } from "@craft-codex/core";
import { ManualPlacementProvider } from "./manual-placement";
import {
  loadPlacements,
  savePlacement,
  clearPlacement,
} from "../storage/local";

/**
 * ManualPlacementProvider mit automatischer localStorage-Persistenz.
 *
 * Beim Erstellen werden alle gespeicherten Posen aus localStorage geseeded.
 * Bei jedem onPose-Event wird der Zustand in localStorage gespiegelt
 * (debounced über requestAnimationFrame, damit Drag-Floods nicht zur
 * Storage-Spam fuehren).
 *
 * Verwendung:
 *
 *   const provider = createPersistedPlacementProvider();
 *   await provider.start();
 *   // … beim Unmount:
 *   provider.dispose();  // detacht auto-stop des Persist-Subscribers
 */
export function createPersistedPlacementProvider(): ManualPlacementProvider {
  const provider = new ManualPlacementProvider();

  // Hydrate from localStorage (only on browser).
  const stored = loadPlacements();
  if (stored?.poses) {
    for (const [targetId, pose] of Object.entries(stored.poses)) {
      provider.setPose(targetId, pose);
    }
  }

  // rAF-debounced persistence to avoid flood during drag.
  const pendingSaves = new Map<string, Pose | null>();
  let rafScheduled = false;

  const flush = () => {
    rafScheduled = false;
    for (const [targetId, pose] of pendingSaves.entries()) {
      if (pose === null) {
        clearPlacement(targetId);
      } else {
        savePlacement(targetId, pose);
      }
    }
    pendingSaves.clear();
  };

  const scheduleFlush = () => {
    if (rafScheduled) return;
    rafScheduled = true;
    if (typeof requestAnimationFrame !== "undefined") {
      requestAnimationFrame(flush);
    } else {
      setTimeout(flush, 16);
    }
  };

  const unsub = provider.onPose((target: TrackingTarget) => {
    pendingSaves.set(target.id, target.pose);
    scheduleFlush();
  });

  // Patch dispose so we cleanup our subscriber too.
  const origDispose = provider.dispose.bind(provider);
  provider.dispose = () => {
    unsub();
    origDispose();
  };

  return provider;
}
