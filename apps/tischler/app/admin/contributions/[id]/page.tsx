import Link from "next/link";
import { isHttpUrl } from "../../../../lib/contributions/schema";
import { getContribution, reviewConfigFromEnv } from "../../../../lib/admin/review";
import {
  approveAction,
  rejectAction,
  reopenReviewAction,
  requestChangesAction,
  takeInReviewAction,
} from "../actions";

/**
 * Meister-Review: Detailansicht + Entscheidungs-Buttons (Server-Actions).
 * Markdown wird bewusst OHNE neue Dependency als <pre> gerendert.
 * KEIN Publish-Button — Publish laeuft ueber das Export-Script (PR C).
 */
export const dynamic = "force-dynamic";

export default async function ContributionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: actionError } = await searchParams;

  let row = null;
  let loadError: string | null = null;
  try {
    row = await getContribution(reviewConfigFromEnv(), id);
  } catch (err) {
    loadError = err instanceof Error ? err.message : String(err);
  }

  if (loadError) {
    return (
      <main className="cc-page">
        <p role="alert" style={{ color: "var(--cc-bad)" }}>Fehler: {loadError}</p>
      </main>
    );
  }
  if (!row) {
    return (
      <main className="cc-page">
        <p>Beitrag nicht gefunden.</p>
        <Link href="/admin/contributions" style={{ textDecoration: "underline" }}>
          ← Zurück zur Liste
        </Link>
      </main>
    );
  }

  const labelStyle: React.CSSProperties = {
    fontWeight: 600,
    fontSize: "0.8rem",
    color: "var(--cc-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };

  return (
    <main className="cc-page" style={{ paddingBottom: "3rem", maxWidth: "820px" }}>
      <Link href="/admin/contributions" style={{ textDecoration: "underline", fontSize: "0.85rem" }}>
        ← Zurück zur Liste
      </Link>

      <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", marginTop: "1rem" }}>
        {row.content?.title ?? "(ohne Titel)"}
      </h1>
      <p className="cc-muted" style={{ marginTop: "0.4rem", fontSize: "0.9rem" }}>
        Thema: <strong>{row.content?.topic ?? "—"}</strong> · Autor:{" "}
        <strong>{row.author_email ?? "—"}</strong> · Status:{" "}
        <span className="cc-badge cc-badge--yellow">{row.status}</span>
      </p>

      {actionError && (
        <p role="alert" className="cc-note" style={{ marginTop: "1rem", borderLeftColor: "var(--cc-bad)" }}>
          Aktion fehlgeschlagen: {actionError}
        </p>
      )}

      <section style={{ marginTop: "1.75rem" }}>
        <p style={labelStyle}>Inhalt (Markdown-Quelle)</p>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily: "inherit",
            fontSize: "0.95rem",
            lineHeight: 1.6,
            background: "var(--cc-paper-pure)",
            border: "1px solid var(--cc-hair)",
            borderRadius: "var(--cc-radius)",
            padding: "1.1rem 1.25rem",
            margin: "0.5rem 0 0",
          }}
        >
          {row.content?.body_md ?? ""}
        </pre>
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <p style={labelStyle}>Quellen</p>
        <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem", fontSize: "0.9rem", lineHeight: 1.6 }}>
          {(row.content?.sources ?? []).map((s, i) => (
            <li key={i}>
              {s.citation}
              {s.page ? `, S. ${s.page}` : ""}
              {s.url ? (
                <>
                  {" — "}
                  {/* Defense in depth: content is untrusted user input — link
                      only http(s), otherwise render as inert text. */}
                  {isHttpUrl(s.url) ? (
                    <a href={s.url} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
                      {s.url}
                    </a>
                  ) : (
                    <span className="cc-muted">{s.url} (Link blockiert — keine http/https-URL)</span>
                  )}
                </>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "2rem", fontSize: "0.9rem" }}>
        <div>
          <p style={labelStyle}>Lizenz</p>
          <p style={{ margin: "0.35rem 0 0" }}>
            {row.license_type}{" "}
            {row.license_accepted ? (
              <span className="cc-badge cc-badge--good">akzeptiert</span>
            ) : (
              <span className="cc-badge" style={{ color: "var(--cc-bad)" }}>NICHT akzeptiert</span>
            )}
            <br />
            <span className="cc-muted">
              am {row.license_accepted_at ? new Date(row.license_accepted_at).toLocaleString("de-AT") : "—"} ·
              Terms {row.terms_version ?? "—"}
            </span>
          </p>
        </div>
        <div>
          <p style={labelStyle}>Revision</p>
          <p style={{ margin: "0.35rem 0 0" }}>
            revision <strong>{row.revision}</strong> · approved_revision{" "}
            <strong>{row.approved_revision ?? "—"}</strong>
            {row.approved_by ? (
              <>
                <br />
                <span className="cc-muted">
                  freigegeben von {row.approved_by} am{" "}
                  {row.approved_at ? new Date(row.approved_at).toLocaleString("de-AT") : "—"}
                </span>
              </>
            ) : null}
          </p>
        </div>
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <p style={labelStyle}>Review-Verlauf</p>
        {row.review_notes.length === 0 ? (
          <p className="cc-muted" style={{ margin: "0.5rem 0 0", fontSize: "0.9rem" }}>
            Noch keine Review-Schritte.
          </p>
        ) : (
          <ol style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem", fontSize: "0.9rem", lineHeight: 1.7 }}>
            {row.review_notes.map((note, i) => (
              <li key={i}>
                <span className="cc-mono">{note.from} → {note.to}</span> · {note.actor} ·{" "}
                {new Date(note.at).toLocaleString("de-AT")}
                {note.reason ? <> — &bdquo;{note.reason}&ldquo;</> : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section style={{ marginTop: "2rem", borderTop: "2px solid var(--cc-line)", paddingTop: "1.5rem" }}>
        <p style={labelStyle}>Entscheidung</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.75rem" }}>
          {row.status === "submitted" && (
            <form action={takeInReviewAction}>
              <input type="hidden" name="id" value={row.id} />
              <button className="cc-btn cc-btn--primary" type="submit">In Review nehmen</button>
            </form>
          )}

          {row.status === "changes_requested" && (
            <form action={reopenReviewAction}>
              <input type="hidden" name="id" value={row.id} />
              <button className="cc-btn" type="submit">Wieder in Review nehmen</button>
            </form>
          )}

          {row.status === "in_review" && (
            <>
              <form action={approveAction}>
                <input type="hidden" name="id" value={row.id} />
                <button className="cc-btn cc-btn--primary" type="submit">
                  Freigeben (Meister)
                </button>
                <span className="cc-muted" style={{ marginLeft: "0.75rem", fontSize: "0.8rem" }}>
                  Freigabe gilt für Revision {row.revision}. Veröffentlicht wird erst per Export.
                </span>
              </form>
              <form action={requestChangesAction} style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                <input type="hidden" name="id" value={row.id} />
                <textarea
                  className="cc-input"
                  name="reason"
                  required
                  placeholder="Begründung für die Änderungsanforderung …"
                  style={{ flex: "1 1 20rem", minHeight: "3.2rem" }}
                />
                <button className="cc-btn" type="submit">Änderung anfordern</button>
              </form>
            </>
          )}

          {(row.status === "submitted" || row.status === "in_review") && (
            <form action={rejectAction} style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <input type="hidden" name="id" value={row.id} />
              <input type="hidden" name="from" value={row.status} />
              <textarea
                className="cc-input"
                name="reason"
                required
                placeholder="Begründung für die Ablehnung …"
                style={{ flex: "1 1 20rem", minHeight: "3.2rem" }}
              />
              <button className="cc-btn cc-btn--danger" type="submit">Ablehnen</button>
            </form>
          )}

          {!["submitted", "in_review", "changes_requested"].includes(row.status) && (
            <p className="cc-muted" style={{ fontSize: "0.9rem" }}>
              Keine Aktionen für Status &bdquo;{row.status}&ldquo; — Publish läuft über das Export-Script.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
