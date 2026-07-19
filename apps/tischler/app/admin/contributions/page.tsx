import Link from "next/link";
import { listOpenContributions, reviewConfigFromEnv } from "../../../lib/admin/review";

/**
 * Meister-Review: Liste offener Beitraege (submitted / in_review /
 * changes_requested). Service-Role, Server-Component, hinter Basic Auth.
 * Immer zur Request-Zeit rendern — nie beim Build (dort fehlt die Env).
 */
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  submitted: "Eingereicht",
  in_review: "In Review",
  changes_requested: "Änderung angefordert",
};

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "in_review" ? "cc-badge cc-badge--yellow" : "cc-badge";
  return <span className={cls}>{STATUS_LABEL[status] ?? status}</span>;
}

export default async function AdminContributionsPage() {
  let rows;
  let loadError: string | null = null;
  try {
    rows = await listOpenContributions(reviewConfigFromEnv());
  } catch (err) {
    loadError = err instanceof Error ? err.message : String(err);
  }

  return (
    <main className="cc-page" style={{ paddingBottom: "3rem" }}>
      <p className="cc-kicker">Meister-Review</p>
      <h1 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", marginTop: "0.5rem" }}>
        Offene Beiträge
      </h1>
      <p className="cc-muted" style={{ marginTop: "0.6rem", maxWidth: "60ch" }}>
        Eingereichtes Wissen wartet auf deine Prüfung. Ohne Meister-Freigabe wird
        nichts veröffentlicht.
      </p>

      {loadError && (
        <p role="alert" style={{ color: "var(--cc-bad)", marginTop: "1.5rem" }}>
          Beiträge konnten nicht geladen werden: {loadError}
        </p>
      )}

      {rows && rows.length === 0 && (
        <p className="cc-note" style={{ marginTop: "1.5rem" }}>
          Keine offenen Beiträge — alles geprüft.
        </p>
      )}

      {rows && rows.length > 0 && (
        <div style={{ overflowX: "auto", marginTop: "1.5rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid var(--cc-line)" }}>
                <th style={{ padding: "0.5rem 0.75rem" }}>Titel</th>
                <th style={{ padding: "0.5rem 0.75rem" }}>Thema</th>
                <th style={{ padding: "0.5rem 0.75rem" }}>Autor</th>
                <th style={{ padding: "0.5rem 0.75rem" }}>Status</th>
                <th style={{ padding: "0.5rem 0.75rem" }}>Datum</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} style={{ borderBottom: "1px solid var(--cc-hair)" }}>
                  <td style={{ padding: "0.6rem 0.75rem" }}>
                    <Link
                      href={`/admin/contributions/${row.id}`}
                      style={{ fontWeight: 600, textDecoration: "underline" }}
                    >
                      {row.content?.title ?? "(ohne Titel)"}
                    </Link>
                  </td>
                  <td style={{ padding: "0.6rem 0.75rem" }}>{row.content?.topic ?? "—"}</td>
                  <td style={{ padding: "0.6rem 0.75rem" }}>{row.author_email ?? "—"}</td>
                  <td style={{ padding: "0.6rem 0.75rem" }}>
                    <StatusBadge status={row.status} />
                  </td>
                  <td style={{ padding: "0.6rem 0.75rem", whiteSpace: "nowrap" }}>
                    {new Date(row.created_at).toLocaleDateString("de-AT", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
