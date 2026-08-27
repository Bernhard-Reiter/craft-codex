"use client";

/**
 * Beschlagmontage — geführte Anleitung mit Bohrbild.
 *
 * Erster Durchstich: Hawa Combino 65/80 H FS ul. Diese Ansicht ist die
 * Desktop-Orbit-Vorschau; die AR-Ansicht mit 3-Punkt-Registrierung auf das
 * reale Türblatt liegt unter /beschlag/xr.
 *
 * Texte vorerst deutsch fest verdrahtet; i18n folgt, wenn der Ablauf steht.
 */

import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  WorkflowController,
  buildHawaCombinoLayout,
  openQuestions,
  mayRenderDrillPoints,
} from "@craft-codex/core";
import { BeschlagScene } from "../../../components/BeschlagScene";
import { Link } from "../../../i18n/navigation";
import { HAWA_COMBINO_WORKFLOW } from "../../../lib/beschlag/hawa-combino-workflow";

const TUER_BREITE = 600;
const TUER_HOEHE = 2000;

export default function BeschlagPage() {
  const [index, setIndex] = useState(0);
  const [erledigt, setErledigt] = useState<Record<string, boolean>>({});

  const controller = useMemo(
    () => new WorkflowController(HAWA_COMBINO_WORKFLOW),
    [],
  );
  const steps = controller.getSteps();
  const schritt = steps[index];

  const layout = useMemo(() => buildHawaCombinoLayout(TUER_BREITE), []);
  const offen = useMemo(() => openQuestions(layout), [layout]);
  const zeigtBohrungen = mayRenderDrillPoints(layout);

  const bohrungenHier = layout.points.filter((p) => p.stepId === schritt?.id);

  return (
    <main className="beschlag">
      <header className="kopf">
        <h1>{HAWA_COMBINO_WORKFLOW.label}</h1>
        <p className="herkunft">
          Anleitung {layout.source.document} · Seite {layout.source.page} ·
          Anschlag {layout.anschlag}
          {layout.source.crosscheck ? ` · gegengeprüft: ${layout.source.crosscheck}` : ""}
        </p>
        <p className="arlink">
          <Link href="/beschlag/xr">🥽 In AR öffnen (Quest 3)</Link>
        </p>
      </header>

      {!zeigtBohrungen && (
        <section className="warnung" role="status">
          <strong>Bohrbild noch nicht freigegeben.</strong>
          <p>
            Die Maße unten stammen unverändert aus der Herstellervorlage und
            gehen rechnerisch auf. Die genaue Lage einzelner Bohrungen ist noch
            nicht bestätigt — deshalb zeigt die Ansicht die Maße zum Nachmessen,
            aber keine Bohrpunkte.
          </p>
          {offen.length > 0 && (
            <ul>
              {offen.map((o) => (
                <li key={o.pointId}>
                  <code>{o.pointId}</code> — {o.frage}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="buehne">
        {/* Abstand so, dass ein 2-m-Türblatt ganz ins Bild passt:
            sichtbare Höhe = 2 · z · tan(fov/2) ≈ 2,4 m bei z = 2,9. */}
        <Canvas camera={{ position: [0, 0, 2.9], fov: 45 }}>
          <ambientLight intensity={0.75} />
          <directionalLight position={[1, 2, 3]} intensity={1.1} />
          <BeschlagScene
            layout={layout}
            faceHeight={TUER_HOEHE}
            activeStepId={schritt?.id}
          />
          <OrbitControls makeDefault enablePan target={[0, 0, 0]} />
        </Canvas>
      </div>

      <section className="schritt">
        <nav className="navi">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
          >
            ← Zurück
          </button>
          <span className="zaehler">
            Schritt {index + 1} von {steps.length}
          </span>
          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))}
            disabled={index === steps.length - 1}
          >
            Weiter →
          </button>
        </nav>

        {schritt && (
          <article>
            <h2>{schritt.label}</h2>

            {schritt.tools.length > 0 && (
              <p className="werkzeug">
                <span className="etikett">Werkzeug</span>
                {schritt.tools.join(" · ")}
              </p>
            )}

            <ol className="anweisungen">
              {schritt.instructions.map((z, i) => (
                <li key={i}>{z}</li>
              ))}
            </ol>

            {bohrungenHier.length > 0 && (
              <p className="bohrhinweis">
                {bohrungenHier.length} Bohrungen in diesem Schritt:{" "}
                {[...new Set(bohrungenHier.map((p) => p.tool))].join(", ")}
              </p>
            )}

            {schritt.checklist && schritt.checklist.length > 0 && (
              <ul className="checkliste">
                {schritt.checklist.map((c) => (
                  <li key={c.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={!!erledigt[c.id]}
                        onChange={(e) =>
                          setErledigt((s) => ({ ...s, [c.id]: e.target.checked }))
                        }
                      />
                      {c.label}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </article>
        )}
      </section>

      <style jsx>{`
        .beschlag {
          max-width: 68rem;
          margin: 0 auto;
          padding: 2rem 1.5rem 4rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .kopf h1 {
          margin: 0 0 0.35rem;
          font-size: 1.6rem;
          line-height: 1.2;
        }
        .arlink {
          margin: 0.5rem 0 0;
          font-size: 0.95rem;
        }
        .herkunft {
          margin: 0;
          font-size: 0.85rem;
          opacity: 0.7;
          font-variant-numeric: tabular-nums;
        }
        .warnung {
          border: 1px solid #d8c48a;
          border-left: 4px solid #8a6a1f;
          background: #fbf6e8;
          color: #3a2f12;
          padding: 1rem 1.25rem;
          border-radius: 3px;
        }
        .warnung p {
          margin: 0.5rem 0 0;
          font-size: 0.95rem;
        }
        .warnung ul {
          margin: 0.75rem 0 0;
          padding-left: 1.2rem;
          font-size: 0.87rem;
        }
        .warnung li {
          margin-bottom: 0.4rem;
        }
        .buehne {
          height: 60vh;
          min-height: 420px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 3px;
          overflow: hidden;
        }
        .navi {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .navi button {
          padding: 0.45rem 0.9rem;
          cursor: pointer;
        }
        .navi button:disabled {
          opacity: 0.4;
          cursor: default;
        }
        .zaehler {
          font-size: 0.85rem;
          opacity: 0.7;
          font-variant-numeric: tabular-nums;
        }
        .schritt h2 {
          margin: 0 0 0.6rem;
          font-size: 1.2rem;
        }
        .werkzeug {
          margin: 0 0 0.8rem;
          font-size: 0.95rem;
        }
        .etikett {
          display: inline-block;
          margin-right: 0.6rem;
          font-size: 0.7rem;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          opacity: 0.6;
        }
        .anweisungen {
          margin: 0 0 0.9rem;
          padding-left: 1.3rem;
          line-height: 1.6;
        }
        .anweisungen li {
          margin-bottom: 0.3rem;
        }
        .bohrhinweis {
          font-size: 0.9rem;
          opacity: 0.8;
          margin: 0 0 0.9rem;
        }
        .checkliste {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .checkliste label {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          font-size: 0.95rem;
          cursor: pointer;
        }
      `}</style>
    </main>
  );
}
