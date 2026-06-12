"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  DEFAULT_DOVETAIL_PARAMS,
  type DovetailParams,
  type DovetailStep,
  type ModeId,
  type SurfaceContext,
} from "@craft-codex/core";
import { DovetailScene } from "../../components/DovetailScene";
import { ModeBar } from "../../components/ModeBar";
import { ParamSliders } from "../../components/ParamSliders";
import { SurfaceModeBar } from "../../components/SurfaceModeBar";
import { SurfacePanel } from "../../components/SurfacePanel";
import { PlacementHandles } from "../../components/PlacementHandles";
import { VoiceConsole } from "../../components/VoiceConsole";
import { createDefaultModeBundle } from "../../lib/surface-modes";
import { createPersistedPlacementProvider } from "../../lib/tracking/persisted-placement";
import { registerDefaultModels } from "../../lib/surface-modes/cad-defaults";
import { LocalRAGProvider } from "../../lib/rag/local-rag";
import { StubTopicGuard } from "../../lib/rag/topic-guard";
import { getDemoCorpus } from "../../lib/rag/corpus";
import {
  loadModes,
  loadSession,
  saveModes,
  saveSession,
} from "../../lib/storage/local";

const PLACEMENT_TARGET_ID = "dovetail-pair";

export default function DovetailPage() {
  const [params, setParams] = useState<DovetailParams>(DEFAULT_DOVETAIL_PARAMS);
  const [step, setStep] = useState<DovetailStep>("anreissen");
  const [hydrated, setHydrated] = useState(false);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Master-Surface ModeManager — einmalig erzeugen, ueberlebt Re-Renders.
  // Bundle bringt typed Mode-Instanzen — wir registrieren CAD-Default-Modelle
  // direkt auf der Instanz.
  const bundle = useMemo(() => {
    const b = createDefaultModeBundle();
    registerDefaultModels(b.cad, { ignoreDuplicates: true });
    return b;
  }, []);
  const manager = bundle.manager;
  const [activeMode, setActiveMode] = useState<ModeId | null>(null);
  const [modeStates, setModeStates] = useState<
    Record<string, Record<string, unknown>>
  >({});

  // Manual-Placement Provider — Drag-Handle fuer Brett-Pose im 3D-Raum.
  // Persisted-Variante: hydrate aus localStorage, auto-persist bei jedem Drag.
  const placementProvider = useMemo(
    () => createPersistedPlacementProvider(),
    [],
  );
  const [showPlacement, setShowPlacement] = useState(false);

  // Voice-Pipeline: RAG + TopicGuard fuer Schwalbenschwanz-Korpus.
  const { rag, guard } = useMemo(() => {
    const r = new LocalRAGProvider(getDemoCorpus());
    const g = new StubTopicGuard({
      rag: r,
      onTopicMin: 0.25,
      offTopicMax: 0.05,
      blacklist: ["bitcoin", "krypto", "trading"],
    });
    return { rag: r, guard: g };
  }, []);

  useEffect(() => {
    void placementProvider.start();
    return () => {
      placementProvider.dispose();
    };
  }, [placementProvider]);

  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      setParams(saved.params);
      setStep(saved.step);
    }
    const savedModes = loadModes();
    if (savedModes) {
      setActiveMode(savedModes.activeMode);
      setModeStates(savedModes.modeStates ?? {});
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    // Beim Page-Unmount aktiven Mode sauber abbauen.
    return () => {
      void manager.deactivateAll();
    };
  }, [manager]);

  useEffect(() => {
    if (!hydrated) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      saveSession({ params, step, updatedAt: Date.now() });
    }, 250);
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [params, step, hydrated]);

  async function handleModeSwitch(id: ModeId): Promise<void> {
    const ctx: SurfaceContext = {
      target: null,
      state: modeStates[id] ?? {},
    };
    try {
      await manager.switch(id, ctx);
    } catch (err) {
      console.error("[dovetail] mode switch failed:", err);
      return;
    }
    const active = manager.getActive();
    const nextStates = { ...modeStates };
    if (active?.serializeState) {
      nextStates[id] = active.serializeState();
    }
    setModeStates(nextStates);
    // Narrow to ModesPersistedState's "tafel" | "cad" | "video" | null shape.
    let persistedActive: "tafel" | "cad" | "video" | null = null;
    if (id === "tafel") persistedActive = "tafel";
    else if (id === "cad") persistedActive = "cad";
    else if (id === "video") persistedActive = "video";
    setActiveMode(id);
    saveModes({ activeMode: persistedActive, modeStates: nextStates });
  }

  return (
    <main className="cc-workbench">
      <aside className="cc-workbench-rail">
        <header>
          <p className="cc-kicker">Werkstück 01</p>
          <h1
            style={{
              margin: "0.4rem 0 0",
              fontSize: "1.6rem",
              textTransform: "uppercase",
            }}
          >
            Schwalbenschwanz
          </h1>
          <p
            className="cc-muted"
            style={{ margin: "0.25rem 0 0", fontSize: "0.85rem" }}
          >
            Lernschritt und Brettmaße — live im 3D-Modell.
          </p>
        </header>

        <section className="cc-card cc-card--flat">
          <p className="cc-kicker" style={{ marginBottom: "0.75rem" }}>
            Lernschritt
          </p>
          <ModeBar active={step} onChange={setStep} />
        </section>

        <section className="cc-card cc-card--flat">
          <p className="cc-kicker" style={{ marginBottom: "0.75rem" }}>
            Brettmaße
          </p>
          <ParamSliders params={params} onChange={setParams} />
        </section>

        <section>
          <p className="cc-kicker" style={{ marginBottom: "0.6rem" }}>
            Meister fragen
          </p>
          <VoiceConsole rag={rag} guard={guard} />
        </section>
      </aside>

      <section className="cc-stage" aria-label="3D-Werkstück">
        <DovetailScene
          params={params}
          step={step}
          contentWrapper={
            showPlacement
              ? (children) => (
                  <PlacementHandles
                    targetId={PLACEMENT_TARGET_ID}
                    provider={placementProvider}
                  >
                    {children}
                  </PlacementHandles>
                )
              : undefined
          }
        />
        <button
          type="button"
          onClick={() => setShowPlacement((v) => !v)}
          className={`cc-btn cc-btn--sm${showPlacement ? " cc-btn--primary" : ""}`}
          style={{ position: "absolute", top: "0.6rem", right: "0.6rem" }}
          aria-pressed={showPlacement}
        >
          {showPlacement ? "Drag aktiv" : "Brett positionieren"}
        </button>
      </section>

      <section
        aria-label="Master-Surface"
        style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
      >
        <SurfaceModeBar
          manager={manager}
          activeId={activeMode}
          onSwitch={(id) => {
            void handleModeSwitch(id);
          }}
        />
        <SurfacePanel manager={manager} activeId={activeMode} />
      </section>
    </main>
  );
}
