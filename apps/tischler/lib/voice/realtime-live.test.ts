import { describe, expect, it } from "vitest";
import {
  REALTIME_DEFAULT_MODEL,
  WISSEN_TOOL_NAME,
  buildClientSecretRequest,
  parseThema,
  realtimeInstructions,
  transcribeModelAusEnv,
} from "./realtime-config";
import { erlaubteUrl, zuWissensAntwort, MAX_TREFFER } from "./wissen-suche";
import { frageAusArgumenten, functionCallsAus } from "./realtime-client";
import { getRisCorpus } from "../rag/corpus/ris-corpus";

describe("realtime-config", () => {
  it("baut den client_secrets-Body mit Persona, Werkzeug und kurzer Gueltigkeit", () => {
    const b = buildClientSecretRequest({ locale: "de", thema: "allgemein" });
    expect(b.expires_after).toEqual({ anchor: "created_at", seconds: 60 });
    expect(b.session.type).toBe("realtime");
    expect(b.session.model).toBe(REALTIME_DEFAULT_MODEL);
    expect(b.session.tools.map((t) => t.name)).toEqual([WISSEN_TOOL_NAME]);
    expect(b.session.instructions).toContain("Tischlermeister");
    expect(b.session.instructions).toContain(WISSEN_TOOL_NAME);
    expect(b.session.audio.input).not.toHaveProperty("transcription");
    expect(JSON.stringify(b)).not.toMatch(/sk-|OPENAI_API_KEY/);
  });

  it("setzt Transkription nur, wenn ein Modell konfiguriert ist", () => {
    const b = buildClientSecretRequest({ locale: "de", thema: "zinken", transcribeModel: "x-transcribe" });
    expect(b.session.audio.input).toMatchObject({ transcription: { model: "x-transcribe", language: "de" } });
    expect(b.session.instructions).toContain("Zinken-Station");
  });

  it("Transkription: Standard an, per 'off' aus", () => {
    expect(transcribeModelAusEnv(undefined)).toBe("gpt-4o-mini-transcribe");
    expect(transcribeModelAusEnv("off")).toBeUndefined();
    expect(transcribeModelAusEnv("y")).toBe("y");
  });

  it("thema: nur bekannte Werte, sonst allgemein", () => {
    expect(parseThema("zinken")).toBe("zinken");
    expect(parseThema("<script>")).toBe("allgemein");
    expect(realtimeInstructions("en", "allgemein")).toContain("master cabinetmaker");
  });
});

describe("wissen-suche", () => {
  it("laesst nur https-Links auf ris.bka.gv.at durch", () => {
    expect(erlaubteUrl("https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR1/NOR1.html")).toMatch(/^https:\/\/www\.ris/);
    expect(erlaubteUrl("http://www.ris.bka.gv.at/x")).toBeNull();
    expect(erlaubteUrl("https://ris.bka.gv.at.evil.example/x")).toBeNull();
    expect(erlaubteUrl("javascript:alert(1)")).toBeNull();
    expect(erlaubteUrl(undefined)).toBeNull();
  });

  it("begrenzt Treffer und kuerzt Auszuege", () => {
    const docs = Array.from({ length: 5 }, (_, i) => ({
      id: `d${i}`,
      text: "Wort ".repeat(800),
      metadata: { source: "s", title: `T${i}`, license: "official-document", source_url: "https://evil.example/" },
    }));
    const a = zuWissensAntwort(docs);
    expect(a.treffer).toHaveLength(MAX_TREFFER);
    expect(a.treffer[0]!.url).toBeNull();
    expect(a.treffer[0]!.amtlich).toBe(true);
    expect(a.treffer[0]!.auszug.length).toBeLessThanOrEqual(1402);
    expect(zuWissensAntwort([]).hinweis).toBeTruthy();
  });
});

describe("realtime-client (pure Teile)", () => {
  it("liest Function-Calls aus response.done, nicht aus abgebrochenen Antworten", () => {
    const call = { type: "function_call", name: WISSEN_TOOL_NAME, call_id: "c1", arguments: '{"frage":"Lehrplan"}' };
    expect(functionCallsAus({ response: { status: "completed", output: [{ type: "message" }, call] } })).toEqual([call]);
    expect(functionCallsAus({ response: { status: "cancelled", output: [call] } })).toEqual([]);
    expect(functionCallsAus({})).toEqual([]);
  });

  it("validiert die Werkzeug-Argumente", () => {
    expect(frageAusArgumenten('{"frage":" Berufsschule "}')).toBe("Berufsschule");
    expect(frageAusArgumenten('{"frage":""}')).toBeNull();
    expect(frageAusArgumenten("kein json")).toBeNull();
    expect(frageAusArgumenten('{"frage":42}')).toBeNull();
  });
});

describe("RIS-Korpus (frisch geerntet)", () => {
  const ris = getRisCorpus();
  it("hat je Chunk einen RIS-Link und keine Verwaltungszeilen", () => {
    expect(ris.length).toBeGreaterThan(100);
    for (const d of ris) {
      expect(erlaubteUrl(d.metadata.source_url), d.id).not.toBeNull();
      expect(d.text, d.id).not.toMatch(/Kundmachungsorgan|Dokumentnummer|Zuletzt aktualisiert am|&#\d+;/);
      expect(d.text, d.id).not.toMatch(/Paragraph eins|Absatz eins,/);
    }
  });
});
