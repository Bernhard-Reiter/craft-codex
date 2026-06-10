import Link from "next/link";
import { DemoResetButton } from "../components/DemoResetButton";

const cards: Array<{
  href: string;
  title: string;
  body: string;
  status: "ready" | "stub";
}> = [
  {
    href: "/dovetail",
    title: "Schwalbenschwanz",
    body: "3D-Demo: Brett A + B mit Anrisslinien fuer alle 5 Schritte (Anreissen → Pruefen). Plus Mode-Switcher (Tafel / CAD / Video) + Drag-Placement.",
    status: "ready",
  },
  {
    href: "/dovetail/xr",
    title: "WebXR Demo",
    body: "Schwalbenschwanz immersiv via WebXR — Enter AR / VR (Quest 3 / Galaxy XR / Chrome WebXR Emulator).",
    status: "ready",
  },
  {
    href: "/voice",
    title: "Voice-Pipeline",
    body: "Demo-Fragen, Texteingabe oder Mic → 41-Doc RAG-Korpus + TopicGuard → Antwort mit Stimme (Offline-Cache → Server-ElevenLabs → still). Keys bleiben am Server.",
    status: "ready",
  },
];

export default function Page() {
  return (
    <main>
      <p
        style={{
          color: "var(--color-muted)",
          fontSize: "0.85rem",
          textTransform: "uppercase",
          letterSpacing: 0.8,
          margin: 0,
        }}
      >
        Craft Codex · Gewerk
      </p>
      <h1 style={{ marginTop: "0.25rem", fontWeight: 600, fontSize: "2rem" }}>
        Tischler
      </h1>
      <p style={{ color: "var(--color-muted)", marginBottom: "2.5rem" }}>
        MR-Lerntool fuers Holzhandwerk. Werkstuecke unten waehlen.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1rem",
        }}
      >
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            style={{
              display: "block",
              padding: "1.25rem",
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              color: "var(--color-fg)",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.15rem",
                  fontWeight: 600,
                }}
              >
                {c.title}
              </h2>
              <span
                style={{
                  fontSize: "0.75rem",
                  color:
                    c.status === "ready"
                      ? "var(--color-accent)"
                      : "var(--color-muted)",
                }}
              >
                {c.status}
              </span>
            </div>
            <p
              style={{
                margin: "0.5rem 0 0",
                color: "var(--color-muted)",
                lineHeight: 1.5,
              }}
            >
              {c.body}
            </p>
          </Link>
        ))}
      </div>
      <div style={{ marginTop: "2.5rem" }}>
        <DemoResetButton />
      </div>
    </main>
  );
}
