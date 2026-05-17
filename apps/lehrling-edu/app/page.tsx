import Link from "next/link";

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
    body: "Mic-Button → MockSTT → 41-Doc RAG-Korpus + 3-Layer TopicGuard → Template-Antwort → MockTTS. Phase D ersetzt durch Whisper / Claude / ElevenLabs.",
    status: "ready",
  },
];

export default function Page() {
  return (
    <main>
      <h1 style={{ marginTop: 0, fontWeight: 600, fontSize: "2rem" }}>
        Lehrling-Edu
      </h1>
      <p style={{ color: "var(--color-muted)", marginBottom: "2.5rem" }}>
        MR-Lehrtool fuer Holzhandwerk — Test-Ballon Phase B (MIT, Open-Core).
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
    </main>
  );
}
