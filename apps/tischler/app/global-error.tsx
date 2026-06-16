"use client";

/**
 * Letztes Netz: fängt jeden sonst unbehandelten Render-Fehler ab, bevor der
 * Nutzer einen weißen Screen sieht. Ruhig gestaltet, mit „erneut versuchen".
 * (global-error.tsx ersetzt das Root-Layout im Fehlerfall → eigenes html/body.)
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="de">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#fcfcfa",
          color: "#14140f",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "30rem", textAlign: "center" }}>
          <div
            style={{
              width: 26,
              height: 26,
              margin: "0 auto 1.25rem",
              borderLeft: "6px solid #ffd400",
              borderBottom: "6px solid #ffd400",
            }}
          />
          <h1 style={{ fontWeight: 600, fontSize: "1.5rem", margin: "0 0 0.6rem" }}>
            Da ist etwas hängengeblieben.
          </h1>
          <p style={{ color: "#71716a", lineHeight: 1.5, margin: "0 0 1.5rem" }}>
            Kein Problem — nichts ist verloren. Lade die Werkstatt einfach neu.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              fontWeight: 500,
              fontSize: "0.95rem",
              padding: "0.6rem 1.25rem",
              border: "1px solid transparent",
              borderRadius: 6,
              background: "#ffd400",
              color: "#14140f",
              cursor: "pointer",
            }}
          >
            Erneut versuchen
          </button>
        </div>
      </body>
    </html>
  );
}
