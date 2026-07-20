# Contribution API v1

Versionierter Service-zu-Service-Andockpunkt für Beiträge (Cody Studio u.a.).
Das `/beitragen`-Formular bleibt unverändert auf dem RLS-Pfad — diese API ist
der **zweite** Client-Pfad und läuft serverseitig als Service-Role, begrenzt
durch Bearer-Token, striktes Zod-Schema und den fixen Status `submitted`.

Base-URL: `https://<tischler-app>/api/v1`

## Auth

Alle Endpunkte verlangen:

```
Authorization: Bearer <CRAFT_CONTRIB_API_TOKEN>
```

- Token-Format: `ccapi_<48hex>` (serverseitig als Env `CRAFT_CONTRIB_API_TOKEN`).
- Vergleich timing-safe (SHA-256-Digests, konstantzeitiger XOR).
- **Fail-closed:** Ist auf dem Server kein Token konfiguriert → `503` (nie offen).
- Fehlendes/falsches Token → `401`.

## POST /api/v1/contributions

Erstellt einen Beitrag im Status `submitted` (Review/Export laufen unverändert
über die Slice-1-Pipeline).

### Headers

| Header | Pflicht | Beschreibung |
|---|---|---|
| `Authorization: Bearer <token>` | ja | Service-Token |
| `Content-Type: application/json` | ja | |
| `Idempotency-Key: <string ≤100>` | empfohlen | Dedupe-Schlüssel für Retries (UUID empfohlen) |

### Body (strict — unbekannte Keys werden abgelehnt)

```jsonc
{
  "source": "cody-studio",            // "cody-studio" | "api" (NIE "web")
  "sourceSessionId": "studio-abc123", // optional, ≤200
  "trade": "tischler",                // fix
  "locale": "de-AT",                  // "de-AT" | "de" | "en"
  "visibility": "open_commons",       // fix
  "license": "CC-BY-SA-4.0",          // fix — hartes Lizenz-Gate
  "title": "Schwalbenschwanz anreissen",       // 3–200 Zeichen
  "topic": "zinken",                  // optional, Default "allgemein"
  "sections": [                       // min 1
    { "type": "procedure", "markdown": "Zuerst …" },
    { "type": "warning",   "markdown": "Niemals gegen die Faser stemmen." }
  ],
  "sources": [                        // min 1
    {
      "id": "ev-1",                   // optional (Client-Metadatum, wird NICHT persistiert)
      "type": "book",                 // optional: book | web | oral | official (nicht persistiert)
      "citation": "Fachkunde Holztechnik, 24. Auflage",  // Pflicht
      "url": "https://example.org",   // optional, NUR http(s)
      "page": 312                     // optional, positive Ganzzahl
    }
  ],
  "authorName": "…",                  // optional, ≤120 — reserviert, derzeit NICHT persistiert
  "authorEmail": "meister@example.org", // optional
  "consents": {
    "termsVersion": "2026-07",
    "licenseAcceptedAt": "2026-07-20T10:00:00Z"  // ISO-8601
  }
}
```

Mapping ins gespeicherte `content`-JSONB: `body_md` = Sections mit `\n\n`
gejoint, `warning`-Sections bekommen das Präfix `⚠️ `. Der gejointe Body muss
≥20 Zeichen ergeben, sonst `400`.

### Responses

| Status | Bedeutung | Body |
|---|---|---|
| `201` | angelegt | `{ "contributionId", "status": "submitted", "statusUrl" }` |
| `200` | Idempotency-Key bereits bekannt — **bestehender** Beitrag, kein Duplikat | gleiche Struktur wie 201 |
| `400` | ungültiges JSON / Schema-Fehler / ungültiger Idempotency-Key | `{ "error", "issues"? }` |
| `401` | Token fehlt/falsch | `{ "error": "unauthorized" }` |
| `413` | Payload > 100 KB | `{ "error": "payload_too_large" }` |
| `503` | Server ohne Token/DB-Config (fail-closed) | `{ "error": "service_unavailable" }` |
| `500` | interner Fehler (Details nur im Server-Log) | `{ "error": "internal_error" }` |

### Idempotenz-Semantik

- Gleicher `Idempotency-Key` → immer dieselbe `contributionId`, auch bei
  abweichendem Payload (der Key gewinnt; der Payload des ersten Requests zählt).
- Erzwungen durch einen partial-unique Index in der DB; ein Race zweier
  paralleler Requests wird über die Unique-Violation nachgelesen und als `200`
  beantwortet.
- Ohne Header wird jeder POST zu einer neuen Contribution — für Retries den
  Header IMMER setzen.

## GET /api/v1/contributions/:id

Status-Polling. Liefert **nur Workflow-Metadaten** — keinen Inhalt, keine
Autor-Daten (Datenminimierung).

```jsonc
// 200
{
  "contributionId": "…",
  "status": "submitted",       // submitted | in_review | changes_requested | approved | published | rejected | withdrawn
  "revision": 1,
  "approvedRevision": null,
  "publishedSlug": null,
  "gitCommit": null,
  "createdAt": "…",
  "updatedAt": "…"
}
```

`404` bei unbekannter oder nicht-UUID-förmiger ID; Auth wie oben.

## Beispiel

```sh
curl -sS -X POST "https://<tischler-app>/api/v1/contributions" \
  -H "Authorization: Bearer ccapi_<48hex-platzhalter>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "source": "api",
    "trade": "tischler",
    "locale": "de-AT",
    "visibility": "open_commons",
    "license": "CC-BY-SA-4.0",
    "title": "Schwalbenschwanz anreissen",
    "topic": "zinken",
    "sections": [
      { "type": "procedure", "markdown": "Zuerst das Werkstueck winklig hobeln und die Zinkenteilung anreissen." }
    ],
    "sources": [
      { "type": "book", "citation": "Fachkunde Holztechnik, 24. Auflage", "page": 312 }
    ],
    "consents": { "termsVersion": "2026-07", "licenseAcceptedAt": "2026-07-20T10:00:00Z" }
  }'
```

## Sicherheits-Invarianten

- Der User-Pfad (`/beitragen`, RLS-Policy `craft_contributions_insert_own`)
  erzwingt per Postgres-Policy `source = 'web'`, `source_session_id IS NULL`
  und `idempotency_key IS NULL` — ein eingeloggter Web-User kann sich nicht
  als Service-Client ausgeben (Migration `0003`).
- Quellen-URLs: nur `http(s)` (kein `javascript:`/`data:` — Review-UI-XSS).
- Fehler-Responses enthalten nie rohe DB-Fehlermeldungen.
