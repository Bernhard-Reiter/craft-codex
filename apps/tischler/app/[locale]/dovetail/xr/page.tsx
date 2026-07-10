"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Object3D } from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { XR, createXRStore } from "@react-three/xr";
import {
  DEFAULT_DOVETAIL_PARAMS,
  type DovetailParams,
  type DovetailStep,
  type TeilungEbene,
  type DovetailVariante,
} from "@craft-codex/core";
import { DovetailSceneContents } from "../../../../components/DovetailScene";
import { XRPlacement } from "../../../../components/XRPlacement";
import { XRDetailTafel } from "../../../../components/XRDetailTafel";
import { XRToolbar } from "../../../../components/XRToolbar";
import { XROrnament } from "../../../../components/XROrnament";
import { XRWristMenu } from "../../../../components/XRWristMenu";
import { SiteFooter } from "../../../../components/SiteFooter";
import { buildAnreissFlowEn } from "../../../../lib/zinken/anreiss-flow.en";
import {
  buildAnreissFlow,
  type AnreissPhase,
} from "../../../../lib/zinken/anreiss-flow";
import type { AnrissLayer } from "../../../../components/AnrissFlat";
import { detectXRSupport, type XRSupport } from "../../../../lib/xr/support";
import { loadSession, saveSession } from "../../../../lib/storage/local";
import { useBoardPlacement } from "../../../../lib/xr/use-board-placement";
import { XRMovable } from "../../../../components/XRMovable";
import { LocalRAGProvider } from "../../../../lib/rag/local-rag";
import { KeywordTopicGuard } from "../../../../lib/rag/topic-guard";
import { getDemoCorpus } from "../../../../lib/rag/corpus";
import { useServerVoice } from "../../../../lib/voice/use-server-voice";
import { useMeisterSpeak } from "../../../../lib/voice/use-meister-speak";
import { Link } from "../../../../i18n/navigation";

// Menue-Panel-Startpose: LINKS neben dem Brett (rechts sitzen die Brett-Controls),
// auf Arbeitshoehe vor dem User — entzerrt, damit nichts ueberlappt.
const MENU_DEFAULT: [number, number, number] = [-0.8, 1.2, -0.5];

// Progressiver Anriss-Aufbau pro Lernschritt (wie der Meister anreisst):
// erst einteilen → Grundlinie → Schwalben + Abfall. Leere Schritte zeigen nichts.
const ANRISS_LAYERS_BY_PHASE: Record<AnreissPhase, AnrissLayer[]> = {
  messen: [],
  schwalbenzahl: [],
  teile: ["divisions"],
  streichmass: ["baseline", "divisions"],
  markieren: ["baseline", "divisions", "flanks", "tails", "wastes"],
  schraege: ["baseline", "flanks", "tails", "wastes"],
  fertig: ["baseline", "flanks", "tails", "wastes"],
};

export default function DovetailXRPage() {
  const t = useTranslations("xr");
  const locale = useLocale();
  const appLocale: "de" | "en" = locale === "en" ? "en" : "de";
  const [support, setSupport] = useState<XRSupport | null>(null);
  const [params, setParams] = useState<DovetailParams>({
    ...DEFAULT_DOVETAIL_PARAMS,
    width_mm: 140,
    thickness_mm: 13,
    length_mm: 200,
  });
  const [step, setStep] = useState<DovetailStep>("anreissen");
  const [tafelOffen, setTafelOffen] = useState(false);
  // Stiller Werkstatt-Modus: Default zeigt nur Holz + Anriss + kleines Ornament.
  // Das Detail-Panel (Maße/Formel/Werkzeug) erscheint erst auf "Mehr…".
  const [panelOffen, setPanelOffen] = useState(false);
  // Teilungsebene: "stirn" (praxisnah) oder "mittellinie" (Lehrbuch) — Anriss +
  // Bemaßung passen sich an; der Lehrling sieht den Unterschied.
  const [teilung, setTeilung] = useState<TeilungEbene>("stirn");
  // Variante: Standard-Teilung oder Randzinkenverstaerkung (kraeftige Eckzinken).
  const [variante, setVariante] = useState<DovetailVariante>("standard");
  const placement = useBoardPlacement();
  const previewControls = useRef<{ reset: () => void } | null>(null);
  // Ref auf das greifbare Brett — die Toolbar nutzt ihn fuer "Lotrecht".
  const boardRef = useRef<Object3D | null>(null);
  const lotrecht = () => {
    const o = boardRef.current;
    if (!o) return;
    o.rotation.set(0, 0, 0);
    o.quaternion.set(0, 0, 0, 1);
  };
  // Reset-Key: erhoehen remountet die verschiebbaren Panels → zurueck auf ihre
  // Default-Pose (die Handle-Transform wird dabei verworfen).
  const [resetKey, setResetKey] = useState(0);

  // Brett, Panels UND Vorschau-Ansicht zuruecksetzen.
  const zentrieren = () => {
    placement.reset();
    setResetKey((k) => k + 1);
    previewControls.current?.reset();
  };

  // Gefuehrtes Anreissen im XR: 7 Sub-Schritte mit 3D-Tafel + progressiven
  // Linien + Werkzeugen. Default an; ueber "Hand-Schritte" auf die generische
  // 5-Schritt-Leiste umschaltbar.
  const [anreissModus, setAnreissModus] = useState(true);
  const [anreissIndex, setAnreissIndex] = useState(0);
  const anreissFlow = useMemo(
    () =>
      appLocale === "en"
        ? buildAnreissFlowEn(params.width_mm, params.thickness_mm)
        : buildAnreissFlow(params.width_mm, params.thickness_mm),
    [appLocale, params.width_mm, params.thickness_mm],
  );
  const anreissSchritt =
    anreissFlow.schritte[
      Math.min(anreissIndex, anreissFlow.schritte.length - 1)
    ]!;
  // Im Anreiss-Modus zeigt das Hologramm die berechnete Lehrbuch-Teilung.
  const xrParams: DovetailParams = useMemo(
    () =>
      anreissModus
        ? { ...params, pinCount: anreissFlow.layout.AZS, ratio: anreissFlow.layout.slopeRatio }
        : params,
    [anreissModus, params, anreissFlow.layout.AZS, anreissFlow.layout.slopeRatio],
  );
  // Welche flachen Anriss-Ebenen pro Lernschritt sichtbar sind (progressiver
  // Aufbau wie ein Meister: erst einteilen, dann Grundlinie, dann Schwalben +
  // Abfall). Ersetzt die alten Roehren-Linien durch die fachliche Darstellung.
  const anrissLayers = useMemo<ReadonlySet<AnrissLayer>>(
    () => new Set(ANRISS_LAYERS_BY_PHASE[anreissSchritt.id]),
    [anreissSchritt.id],
  );

  // Übersetztes Kurzlabel des aktuellen Anreiss-Schritts (Phase-Id als Key —
  // die Fachdaten in lib/zinken bleiben unangetastet).
  const phaseLabel = t(`phases.${anreissSchritt.id}`);
  const stepTotal = anreissFlow.schritte.length;

  // Masszahlen wie der Meister sie anschreibt: DE mit Komma, EN mit Punkt.
  const dec = locale === "de" ? "," : ".";
  const fmt1 = (x: number) => x.toFixed(1).replace(".", dec);
  const fmt2 = (x: number) => x.toFixed(2).replace(".", dec);

  // Ausfuehrliche Lehrer-Erklaerung fuer die Detail-Tafel — hier (ausserhalb
  // des Canvas) uebersetzt und als fertiger String reingereicht.
  const L = anreissFlow.layout;
  const tafelDetail = (() => {
    switch (anreissSchritt.id) {
      case "messen":
        return t("tafel.detail.messen", { B: fmt1(L.B), D: fmt1(L.D) });
      case "schwalbenzahl":
        return t("tafel.detail.schwalbenzahl", {
          B: fmt1(L.B),
          D: fmt1(L.D),
          BD: fmt1(1.7 * L.D),
          AZSraw: fmt2(L.AZS_raw),
          AZS: L.AZS,
        });
      case "teile":
        return t("tafel.detail.teile", {
          AZS: L.AZS,
          AZT: L.AZT,
          B: fmt1(L.B),
          T: fmt1(L.T),
          zinken: fmt1(L.zinkenBreite),
          schwalbe: fmt1(L.schwalbeBreite),
        });
      case "streichmass":
        return t("tafel.detail.streichmass", { D: fmt1(L.D) });
      case "markieren":
        return t("tafel.detail.markieren", {
          AZT: L.AZT,
          AZS: L.AZS,
          zinken: fmt1(L.zinkenBreite),
          schwalbe: fmt1(L.schwalbeBreite),
        });
      case "schraege":
        return t("tafel.detail.schraege", {
          ratio: L.slopeRatio,
          deg: L.slopeDeg.toFixed(0),
        });
      case "fertig":
        return t("tafel.detail.fertig", {
          AZS: L.AZS,
          AZT: L.AZT,
          T: fmt1(L.T),
          ratio: L.slopeRatio,
        });
      default:
        return "";
    }
  })();

  // Die fuenf Handschritte (Name + Merksatz) fuer die Detail-Tafel.
  const tafelHandSteps = (
    ["anreissen", "saegen", "stemmen", "passen", "pruefen"] as const
  ).map((id) => ({
    name: t(`tafel.handSteps.${id}.name`),
    hint: t(`tafel.handSteps.${id}.hint`),
  }));

  // Label-Objekte fuer die Canvas-Komponenten (nie useTranslations im Canvas).
  const toolbarLabels = {
    tabAnreissen: t("toolbar.tabAnreissen"),
    tabHand: t("toolbar.tabHand"),
    width: t("toolbar.width"),
    thickness: t("toolbar.thickness"),
    length: t("toolbar.length"),
    teilung: t("toolbar.teilung"),
    stirnkante: t("toolbar.stirnkante"),
    mittellinie: t("toolbar.mittellinie"),
    variante: t("toolbar.variante"),
    standard: t("toolbar.standard"),
    rzv: t("toolbar.rzv"),
    step: t("toolbar.step", {
      current: anreissIndex + 1,
      total: stepTotal,
      label: phaseLabel,
    }),
    back: t("toolbar.back"),
    tafel: t("toolbar.tafel"),
    done: t("toolbar.done"),
    next: t("toolbar.next"),
    handTitle: t("toolbar.handTitle"),
    handSteps: {
      anreissen: t("toolbar.hand.anreissen"),
      saegen: t("toolbar.hand.saegen"),
      stemmen: t("toolbar.hand.stemmen"),
      passen: t("toolbar.hand.passen"),
      pruefen: t("toolbar.hand.pruefen"),
    },
    board: t("toolbar.board"),
    plumb: t("toolbar.plumb"),
    up: t("toolbar.up"),
    down: t("toolbar.down"),
    near: t("toolbar.near"),
    far: t("toolbar.far"),
    reset: t("toolbar.reset"),
    askMaster: t("toolbar.askMaster"),
    statusThinking: t("toolbar.status.thinking"),
    statusSpeaking: t("toolbar.status.speaking"),
    statusListening: t("toolbar.status.listening"),
    noAudio: t("toolbar.noAudio"),
  };
  const ornamentLabels = {
    step: t("ornament.step", { current: anreissIndex + 1, total: stepTotal }),
    tafel: t("ornament.tafel"),
    master: t("ornament.master"),
  };
  const wristLabels = {
    tafel: t("wrist.tafel"),
    plumb: t("wrist.plumb"),
  };

  // Voice-Coach: gleicher RAG + TopicGuard + Stimm-Kette wie /dovetail.
  // Ohne Server/Cache bleibt tts undefined → Text-Antwort, Demo laeuft weiter.
  const { rag, guard } = useMemo(() => {
    const r = new LocalRAGProvider(getDemoCorpus(appLocale));
    const g = new KeywordTopicGuard({
      rag: r,
      onTopicMin: 0.25,
      offTopicMax: 0.05,
      blacklist: ["bitcoin", "krypto", "trading"],
    });
    return { rag: r, guard: g };
  }, [appLocale]);
  const { bundle: voiceBundle } = useServerVoice(rag, guard, appLocale);
  const speak = useMeisterSpeak(voiceBundle?.tts);

  // Schrittwechsel = gefuehrte Vorfuehrung: setzen + Meister erklaert per Stimme
  // (Klick zaehlt als Geste → Audio-Autoplay erlaubt). Die Linie waechst dazu.
  const gotoSchritt = (i: number) => {
    setAnreissIndex(i);
    const s = anreissFlow.schritte[Math.min(i, anreissFlow.schritte.length - 1)];
    if (s) speak(s.meisterSagt);
  };

  const store = useMemo(
    () =>
      createXRStore({
        emulate: false,
        // AR-Modus auf Quest 3 / Galaxy XR braucht Floor-Reference + DOM-Overlay
        offerSession: false,
      }),
    [],
  );

  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      setParams(saved.params);
      // XR kennt keinen "Überblick"-Schritt (Schritt 0 ist 2D-Erklärung) —
      // ein wiederhergestellter Überblick wird auf den ersten Handschritt
      // gemappt, sonst bliebe in XR kein Tab aktiv.
      setStep(saved.step === "ueberblick" ? "anreissen" : saved.step);
    }
    let cancelled = false;
    detectXRSupport().then((r) => {
      if (!cancelled) setSupport(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const enterAR = async () => {
    try {
      const session = await store.enterAR();
      if (!session) {
        console.warn(
          "[XR] enterAR returned no session — denied or unsupported",
        );
      }
    } catch (e) {
      console.error("[XR] enterAR failed:", e);
    }
  };

  const enterVR = async () => {
    try {
      const session = await store.enterVR();
      if (!session) {
        console.warn(
          "[XR] enterVR returned no session — denied or unsupported",
        );
      }
    } catch (e) {
      console.error("[XR] enterVR failed:", e);
    }
  };

  return (
    <>
      <main className="cc-page" style={{ maxWidth: 960 }}>
        <p className="cc-kicker">{t("kicker")}</p>
        <h1
          style={{
            margin: "0.5rem 0 0.75rem",
            fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
            textTransform: "uppercase",
          }}
        >
          {t.rich("h1", {
            mark: (chunks) => <span className="cc-mark">{chunks}</span>,
          })}
        </h1>
        <p className="cc-muted" style={{ lineHeight: 1.6, margin: 0 }}>
          {t("intro")}
        </p>

        {support === null && (
          <p className="cc-muted" style={{ marginTop: "1.5rem" }}>
            {t("checking")}
          </p>
        )}

        {support && (
          <section className="cc-card" style={{ marginTop: "1.5rem" }}>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <Capability label="Immersive AR" supported={support.ar} />
              <Capability label="Immersive VR" supported={support.vr} />
            </div>
            {support.reason && (
              <p
                className="cc-muted"
                style={{ marginTop: "1rem", fontSize: "0.85rem" }}
              >
                <strong>{t("reasonLabel")}</strong> {support.reason}
              </p>
            )}

            <div
              style={{
                marginTop: "1.25rem",
                display: "flex",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                disabled={!support.ar}
                onClick={enterAR}
                className="cc-btn cc-btn--primary"
              >
                Enter AR
              </button>
              <button
                type="button"
                disabled={!support.vr}
                onClick={enterVR}
                className="cc-btn cc-btn--primary"
              >
                Enter VR
              </button>
            </div>

            {!support.ar && !support.vr && (
              <FallbackMessage reason={support.reason} />
            )}
          </section>
        )}

        <div
          style={{
            marginTop: "1.25rem",
            display: "flex",
            gap: "0.6rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            className={anreissModus ? "cc-btn cc-btn--primary cc-btn--sm" : "cc-btn cc-btn--sm"}
            onClick={() => setAnreissModus(true)}
          >
            {t("modes.guided")}
          </button>
          <button
            type="button"
            className={!anreissModus ? "cc-btn cc-btn--primary cc-btn--sm" : "cc-btn cc-btn--sm"}
            onClick={() => setAnreissModus(false)}
          >
            {t("modes.hand")}
          </button>
          <button
            type="button"
            className="cc-btn cc-btn--sm"
            onClick={zentrieren}
            style={{ marginLeft: "auto" }}
            title={t("centerTitle")}
          >
            {t("center")}
          </button>
          {anreissModus && (
            <span className="cc-muted" style={{ fontSize: "0.8rem" }}>
              {t("stepSummary", {
                current: anreissIndex + 1,
                total: stepTotal,
                label: phaseLabel,
                count: anreissFlow.layout.AZS,
              })}
            </span>
          )}
        </div>

        <section
          className="cc-stage"
          style={{ marginTop: "0.75rem", height: "60vh", minHeight: 400 }}
        >
          <Canvas
            shadows
            // uikit (apfel-Panels) braucht localClippingEnabled fuers Layout.
            gl={{ localClippingEnabled: true }}
            // 2D-Vorschau: Kamera auf das Brett richten (Default-Pose 1.2m hoch,
            // 0.6m vor dem User). In der echten XR-Session uebernimmt das Headset
            // die Kamera — Position hier betrifft NUR die Vorschau.
            camera={{ position: [0.8, 1.7, 0.9], fov: 45 }}
            onCreated={({ camera }) => {
              camera.lookAt(0, 1.2, -0.6);
            }}
            style={{ background: "#0a0a0a" }}
          >
            <XR store={store}>
              {/* In AR/VR steht der User am Welt-Origin (Boden). Der Brett-Stack
                  startet auf Arbeitshoehe vor dem Lehrling und ist per Ziehgriff
                  + Buttons frei platzierbar; die Pose ueberlebt einen Reload. */}
              <XRPlacement
                position={placement.position}
                boardRef={boardRef}
                contentScale={3}
              >
                <DovetailSceneContents
                  params={xrParams}
                  step={anreissModus ? "anreissen" : step}
                  withOrbitControls={false}
                  markingStyle="tube"
                  showBoardB={!anreissModus}
                  anrissLayers={anreissModus ? anrissLayers : undefined}
                  dimensionPhase={anreissModus ? anreissSchritt.id : undefined}
                  teilung={teilung}
                  variante={variante}
                />
                {/* Werkzeug-Sollposition gehoert laut Spec NICHT in die Anreiss-
                    Phase (sie verdeckte die Geometrie) — sie kommt als eigenes,
                    transparentes Guide-Objekt erst beim Saege-/Stemm-Schritt (PR2). */}
              </XRPlacement>

              {/* STILLER MODUS: das ruhige Apple-/visionOS-Ornament ist die
                  einzige dauerhafte Bedienung — Lernschritt, schneller Tafel-
                  Zugriff, Ein-Tap-Meister, "Mehr…". Comfort-platziert, billboardet. */}
              <XRMovable
                key={`ornament-${resetKey}`}
                position={[0, 0.92, -0.42]}
                griffOffsetY={-0.07}
                griffBreite={160}
              >
                <XROrnament
                  index={anreissIndex}
                  total={anreissFlow.schritte.length}
                  label={phaseLabel}
                  labels={ornamentLabels}
                  meisterFrage="Wie reisse ich mit dem Streichmass an"
                  onPrev={() => gotoSchritt(Math.max(0, anreissIndex - 1))}
                  onNext={() =>
                    gotoSchritt(
                      Math.min(anreissFlow.schritte.length - 1, anreissIndex + 1),
                    )
                  }
                  onTafel={() => setTafelOffen((o) => !o)}
                  tafelOffen={tafelOffen}
                  onMehr={() => setPanelOffen((o) => !o)}
                  panelOffen={panelOffen}
                  rag={rag}
                  guard={guard}
                  tts={voiceBundle?.tts}
                />
              </XRMovable>

              {/* Detail-Panel — erscheint NUR auf "Mehr…" (Maße/Formel/Werkzeug/
                  Modus/Voice). Im stillen Modus tritt es zurueck. */}
              {panelOffen && (
                <XRMovable
                  key={`toolbar-${resetKey}`}
                  position={MENU_DEFAULT}
                  griffOffsetY={-0.45}
                  griffBreite={260}
                >
                  <XRToolbar
                    anreissModus={anreissModus}
                    onModus={setAnreissModus}
                    onZentrieren={zentrieren}
                    labels={toolbarLabels}
                    flow={anreissFlow}
                    index={anreissIndex}
                    onIndex={gotoSchritt}
                    masse={{
                      width_mm: params.width_mm,
                      thickness_mm: params.thickness_mm,
                      length_mm: params.length_mm,
                    }}
                    onMasse={(m) => setParams((p) => ({ ...p, ...m }))}
                    onTafel={() => setTafelOffen((o) => !o)}
                    tafelOffen={tafelOffen}
                    step={step}
                    onStep={(s) => {
                      setStep(s);
                      saveSession({ params, step: s, updatedAt: Date.now() });
                    }}
                    onLotrecht={lotrecht}
                    onReset={placement.reset}
                    onNudgeHeight={placement.nudgeHeight}
                    onNudgeDepth={placement.nudgeDepth}
                    teilung={teilung}
                    onTeilung={setTeilung}
                    variante={variante}
                    onVariante={setVariante}
                    rag={rag}
                    guard={guard}
                    tts={voiceBundle?.tts}
                  />
                </XRMovable>
              )}

              {/* Detail-Tafel als visionOS-Fenster (auf Wunsch) — das zweite,
                  separate Element. Persistiert ueber beide Modi (die Tab-Rail
                  links schaltet Anreissen/Hand). */}
              {tafelOffen && (
                <XRMovable
                  key={`tafel-${resetKey}`}
                  position={[0, 1.55, -1.05]}
                  griffOffsetY={-0.42}
                  griffBreite={300}
                >
                  <XRDetailTafel
                    flow={anreissFlow}
                    index={anreissIndex}
                    anreissModus={anreissModus}
                    onModus={setAnreissModus}
                    onClose={() => setTafelOffen(false)}
                    title={
                      anreissModus
                        ? t("tafel.titleGuided", { label: phaseLabel })
                        : t("tafel.titleHand")
                    }
                    detailText={tafelDetail}
                    handSteps={tafelHandSteps}
                    position={[0, 0, 0]}
                  />
                </XRMovable>
              )}

              {/* Wrist-Menü (Hand-Tracking) — Schnellzugriff am Handgelenk, wenn
                  die Handflaeche zum User zeigt. Additiv: ohne Hand rendert es
                  nichts, die Welt-Toolbar bleibt der Fallback (Controller/Desktop). */}
              <XRWristMenu
                anreissModus={anreissModus}
                onModus={setAnreissModus}
                labels={wristLabels}
                onPrev={() => gotoSchritt(Math.max(0, anreissIndex - 1))}
                onNext={() =>
                  gotoSchritt(
                    Math.min(anreissFlow.schritte.length - 1, anreissIndex + 1),
                  )
                }
                onTafel={() => setTafelOffen((o) => !o)}
                onZentrieren={zentrieren}
                onLotrecht={lotrecht}
              />
            </XR>
            {/* Vorschau-Navigation (nur am Screen; in der AR-Session steuert das
                Headset die Kamera). Pan AUS + Blick aufs Brett = nie "verloren". */}
            <OrbitControls
              ref={previewControls as never}
              target={[0, 1.2, -0.6]}
              enablePan={false}
              enableZoom
              minDistance={0.5}
              maxDistance={5}
            />
          </Canvas>
        </section>
        <div
          className="cc-card cc-card--gray cc-card--flat cc-muted"
          style={{ marginTop: "0.75rem", padding: "0.6rem 0.9rem", fontSize: "0.78rem" }}
        >
          {t.rich("preview", {
            step,
            width: params.width_mm,
            length: params.length_mm,
            pins: params.pinCount,
            ratio: params.ratio,
            strong: (chunks) => <strong>{chunks}</strong>,
            link: (chunks) => (
              <Link
                href="/dovetail"
                style={{ borderBottom: "2px solid var(--cc-yellow)" }}
              >
                {chunks}
              </Link>
            ),
          })}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Capability({
  label,
  supported,
}: {
  label: string;
  supported: boolean;
}) {
  const t = useTranslations("xr");
  return (
    <div
      className={supported ? "cc-badge cc-badge--yellow" : "cc-badge"}
      style={{ fontSize: "0.72rem", padding: "0.4rem 0.7rem" }}
    >
      {label}: {supported ? t("capability.ready") : t("capability.unavailable")}
    </div>
  );
}

function FallbackMessage({ reason }: { reason?: string }) {
  const t = useTranslations("xr");
  return (
    <div
      className="cc-card cc-card--gray cc-card--flat"
      style={{ marginTop: "1rem", fontSize: "0.9rem", lineHeight: 1.5 }}
    >
      <strong>{t("fallback.title")}</strong>
      <p className="cc-muted" style={{ margin: "0.5rem 0 0" }}>
        {t.rich("fallback.body", {
          link: (chunks) => (
            <Link
              href="/dovetail"
              style={{ borderBottom: "2px solid var(--cc-yellow)", fontWeight: 600 }}
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
      {reason && (
        <p className="cc-muted" style={{ margin: "0.5rem 0 0", fontSize: "0.8rem" }}>
          {t("fallback.detail", { reason })}
        </p>
      )}
    </div>
  );
}
