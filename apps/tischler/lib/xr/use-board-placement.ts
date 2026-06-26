"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Pose } from "@craft-codex/core";
import { savePlacement, loadPlacements, clearPlacement } from "../storage/local";

export type Vec3 = [number, number, number];

/**
 * Default-Pose des Brett-Stacks im XR-Raum.
 *
 * Der User steht am Welt-Origin (Boden). Das Brett schwebt 1.2m hoch und 0.6m
 * nach vorn — auf bequemer Arbeitshoehe vor dem Lehrling, nicht unter den
 * Fuessen. Per Hand/Controller ziehbar, Hoehe per Buttons justierbar.
 */
export const DEFAULT_BOARD_POSITION: Vec3 = [0, 1.2, -0.6];

const TARGET_ID = "board-stack";
const HEIGHT_STEP = 0.05; // 5cm pro Tipp
const DEPTH_STEP = 0.05;
const MIN_Y = 0.3;
const MAX_Y = 2.0;

/**
 * Persistente Platzierung des Brett-Stacks fuer die XR-Session.
 *
 * - **localStorage-first** (NICHT WebXR-Anchors): Anchors sind auf Quest 3 /
 *   Galaxy XR inkonsistent und ein Demo-Killer, wenn das Feature abgelehnt wird.
 *   localStorage funktioniert immer und ueberlebt einen Session-Restart.
 * - Auto-Place auf sinnvolle Default-Hoehe, dann frei justierbar.
 * - 1-Tap-Reset bringt das Brett zuverlaessig zurueck in Reichweite.
 */
export function useBoardPlacement() {
  const [position, setPosition] = useState<Vec3>(DEFAULT_BOARD_POSITION);
  const positionRef = useRef<Vec3>(DEFAULT_BOARD_POSITION);

  // Gespeicherte Pose beim Mount laden (nur Browser).
  useEffect(() => {
    const saved = loadPlacements()?.poses?.[TARGET_ID];
    if (saved?.position) {
      const p = saved.position as Vec3;
      positionRef.current = p;
      setPosition(p);
    }
  }, []);

  const persist = useCallback((p: Vec3) => {
    const pose: Pose = {
      position: p,
      rotation: [0, 0, 0, 1],
      confidence: 1,
    };
    savePlacement(TARGET_ID, pose);
  }, []);

  /** Absolute Position setzen (z.B. waehrend eines Drags). Persistiert nicht. */
  const moveTo = useCallback((p: Vec3) => {
    positionRef.current = p;
    setPosition(p);
  }, []);

  /** Aktuelle Position festschreiben (Drag-Ende). */
  const commit = useCallback(() => {
    persist(positionRef.current);
  }, [persist]);

  /** Hoehe in 5cm-Schritten anpassen (geklemmt) + sofort persistieren. */
  const nudgeHeight = useCallback(
    (dir: 1 | -1) => {
      const [x, y, z] = positionRef.current;
      const ny = Math.min(MAX_Y, Math.max(MIN_Y, y + dir * HEIGHT_STEP));
      const next: Vec3 = [x, ny, z];
      positionRef.current = next;
      setPosition(next);
      persist(next);
    },
    [persist],
  );

  /** Distanz (naeher/weiter, Z-Achse) anpassen + persistieren. */
  const nudgeDepth = useCallback(
    (dir: 1 | -1) => {
      const [x, y, z] = positionRef.current;
      // dir = 1 → naeher (Z steigt Richtung 0), dir = -1 → weiter weg.
      const nz = Math.min(-0.2, z + dir * DEPTH_STEP);
      const next: Vec3 = [x, y, nz];
      positionRef.current = next;
      setPosition(next);
      persist(next);
    },
    [persist],
  );

  /** Auf Default zuruecksetzen + gespeicherte Pose loeschen. */
  const reset = useCallback(() => {
    positionRef.current = DEFAULT_BOARD_POSITION;
    setPosition(DEFAULT_BOARD_POSITION);
    clearPlacement(TARGET_ID);
  }, []);

  return { position, moveTo, commit, nudgeHeight, nudgeDepth, reset };
}

/**
 * Generische persistente Welt-Pose (z.B. fuer das verschiebbare Menue-Panel),
 * entkoppelt vom Brett. Eigener localStorage-Key, eigener Reset.
 */
export function usePersistentPose(targetId: string, defaultPosition: Vec3) {
  const [position, setPosition] = useState<Vec3>(defaultPosition);
  const ref = useRef<Vec3>(defaultPosition);

  useEffect(() => {
    const saved = loadPlacements()?.poses?.[targetId];
    if (saved?.position) {
      const p = saved.position as Vec3;
      ref.current = p;
      setPosition(p);
    }
  }, [targetId]);

  const moveTo = useCallback((p: Vec3) => {
    ref.current = p;
    setPosition(p);
  }, []);

  const commit = useCallback(() => {
    savePlacement(targetId, {
      position: ref.current,
      rotation: [0, 0, 0, 1],
      confidence: 1,
    });
  }, [targetId]);

  const reset = useCallback(() => {
    ref.current = defaultPosition;
    setPosition(defaultPosition);
    clearPlacement(targetId);
  }, [targetId, defaultPosition]);

  return { position, moveTo, commit, reset };
}
