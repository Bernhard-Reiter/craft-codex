/**
 * Die Anzeigebedingung, nicht nur die Ladefunktion.
 *
 * Der Unterschied hat uns bei der Manifestprüfung eine Runde gekostet: `ladeDatengrenze` war
 * geprüft, `{grenze && …}` nicht — und genau dort entscheidet sich, ob der Handwerker den Satz
 * je sieht. Ein Wert, der geladen und nicht gezeigt wird, ist so gut wie nicht geladen
 * (Beobachtung Cody #2 an craft#44).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import Werkstoffseite from "./page";

const BUNDLE = join(__dirname, "../../../public/werkstoff-bundle");

/** fetch über das echte Bundle; `aenderung` darf eine Antwort verbiegen oder wegnehmen. */
function stub(aenderung?: (url: string, roh: string) => string | null) {
  return vi.fn(async (url: string) => {
    const pfad = join(BUNDLE, String(url).replace("/werkstoff-bundle/", ""));
    if (!existsSync(pfad)) return { ok: false, status: 404 } as Response;
    const roh = readFileSync(pfad, "utf8");
    const inhalt = aenderung ? aenderung(String(url), roh) : roh;
    if (inhalt === null) return { ok: false, status: 404 } as Response;
    return {
      ok: true,
      status: 200,
      json: async () => JSON.parse(inhalt),
      arrayBuffer: async () => new Uint8Array(readFileSync(pfad)).buffer,
    } as Response;
  });
}

// Die 3D-Komponente braucht WebGL — in jsdom gibt es keins. Hier zählt die Verdrahtung:
// bekommt sie die URL, und führt ihr Tap zur richtigen Karte? Der Ersatz ruft `onTeil` wie die
// echte Szene es täte.
vi.mock("../../../components/WerkstoffSzene", () => ({
  WerkstoffSzene: (p: { url: string; luecken: string[]; onTeil: (s: string) => void }) => (
    <div data-testid="szene" data-url={p.url} data-luecken={p.luecken.join(",")}>
      <button type="button" onClick={() => p.onTeil("teil:Bo:unten")}>
        Szene: Bo:unten antippen
      </button>
    </div>
  ),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Werkstoff-Panel: die Grenzaussage am Werkstück", () => {
  it("zeigt beide Sätze — was entfernt wurde UND wie weit die Zusage reicht", async () => {
    vi.stubGlobal("fetch", stub());
    render(<Werkstoffseite />);
    // Der zweite Satz ist der wichtigere: ohne ihn hält jemand die Grenze für dichter.
    await waitFor(() => {
      expect(screen.getByText(/Feldname/i)).toBeTruthy();
    });
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/Betriebsdaten|Einkaufspreise|Lieferantenpreise/i);
    expect(text).toMatch(/Feldname/i);
  });

  it("schweigt, wenn das Bundle keine Grenzaussage trägt", async () => {
    // Kein beruhigender Satz ohne Beleg — und kein Fehler, der die Karte verdeckt.
    vi.stubGlobal(
      "fetch",
      stub((url, roh) => (url.includes("entfernt.json") ? null : roh)),
    );
    render(<Werkstoffseite />);
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/Werkstück|Werkstoff/i);
    });
    expect(document.body.textContent ?? "").not.toMatch(/Feldname/i);
  });
});

describe("Werkstoff-Panel: der Auftrag bestimmt, welche Bretter es gibt", () => {
  it("zeigt Möbel und Revision aus dem Auftrag — und die vier Teile des Plans als Schaltflächen", async () => {
    vi.stubGlobal("fetch", stub());
    render(<Werkstoffseite />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Se:links/ })).toBeTruthy();
    });
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/moebel_beispiel0001/);
    expect(text).toMatch(/Revision 3/);
    expect(screen.getAllByRole("button", { name: /^(Bo|Se):/ })).toHaveLength(4);
    // Die Rückwand steht als fünftes Brett da — als benannte Lücke, nicht weggeschnitten.
    expect(screen.getByRole("button", { name: /^Rw/ })).toBeTruthy();
  });

  it("tippt der Handwerker auf die Rückwand, kommt keine Karte, sondern der Grund — Material noch offen", async () => {
    vi.stubGlobal("fetch", stub());
    render(<Werkstoffseite />);
    const rw = await waitFor(() => screen.getByRole("button", { name: /^Rw/ }));
    rw.click();
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/Material noch offen/);
    });
    expect(document.body.textContent).toMatch(/rw-8@1/);
    expect(document.querySelector(".karte")).toBeNull();
  });

  it("tippt der Handwerker auf »Se:links«, kommt die Karte des Plan-Teils, nicht eines Katalog-Bretts", async () => {
    vi.stubGlobal("fetch", stub());
    render(<Werkstoffseite />);
    const knopf = await waitFor(() => screen.getByRole("button", { name: /Se:links/ }));
    knopf.click();
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/Teil teil_beispielse0links/);
    });
    // Die Bezeichnung kommt aus der Karte des Plan-Teils — der Test liest sie dort, statt sie
    // zu raten; ein Katalog-Brett hieße anders.
    const karte = JSON.parse(
      readFileSync(join(BUNDLE, "karten/teil_beispielse0links.json"), "utf8"),
    ) as { werkstueck: { bezeichnung: string } };
    expect(karte.werkstueck.bezeichnung.length).toBeGreaterThan(0);
    expect(document.body.textContent).toContain(karte.werkstueck.bezeichnung);
  });

  it("ohne Auftrag im Bundle: kein Brett, sondern der Satz, dass der Auftrag fehlt", async () => {
    vi.stubGlobal("fetch", stub((url, roh) => (url.endsWith("auftrag.json") ? null : roh)));
    render(<Werkstoffseite />);
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/Kein Auftrag/);
    });
    expect(screen.queryAllByRole("button", { name: /^(Bo|Se):/ })).toHaveLength(0);
  });
});

describe("Werkstoff-Panel: die Szene zeigt nur, was zum Auftrag passt", () => {
  it("Regelbetrieb: das ausgelieferte Bundle, unverändert — die Szene erscheint, mit der Lücke, ohne Fehlersatz", async () => {
    // Der Weg des Menschen: Seite auf, Bundle so, wie es im Repo liegt. Kein verbogener Auftrag,
    // kein eingesetztes Fixture — das ausgelieferte Paar (auftrag.json ↔ modell.glb) muss durch die
    // Prüfung der Seite kommen. Gemessen war das (craft#48), gehalten hat es kein Test (R48b-5).
    vi.stubGlobal("fetch", stub());
    render(<Werkstoffseite />);
    // R49-5: bricht der Pin, soll die Meldung den ⚠-Satz der Seite tragen, nicht nur »not found«.
    const szene = await waitFor(() => {
      const s = screen.queryByTestId("szene");
      if (!s) throw new Error(`Szene fehlt — die Seite sagt: ${document.body.textContent?.match(/⚠[^.]*/)?.[0] ?? "nichts"}`);
      return s;
    });
    expect(szene.getAttribute("data-url")).toBe("/werkstoff-bundle/modell.glb");
    expect(szene.getAttribute("data-luecken")).toBe("teil:Rw");
    expect(document.body.textContent).not.toMatch(/⚠|anderes Erzeugnis|Kein 3D-Modell/);
    expect(screen.getAllByRole("button", { name: /^(Bo|Se):/ })).toHaveLength(4);
    // Die getragene Lücke auf Plan-Ebene steht auf dem Bildschirm, nicht nur im Bundle (R48b-6).
    expect(document.body.textContent).toMatch(/Demo-Plan ohne Bohrbild — 104 Bohrungen gefiltert \(cody-cad#70\)/);
  });

  it("Hinweise sind Text, nie Markup: <img>/<a>/[x](…) landen als Zeichen auf dem Bildschirm — und zwei gleiche Hinweise sind zwei Zeilen ohne React-Klage", async () => {
    // Die Zusage „der Leser escaped" hat sonst keinen Wächter (Review #50, Cody #2). Der Loader
    // prüft KEINE Zeichen — voai#1226 und cody-cad#73 auch nicht. Hier entscheidet sich, ob ein
    // Hinweis aus einem fremden Bundle Markup wird.
    const boese = ["<img src=x onerror=alert(1)>", "[Klick](http://x) <a href=\"http://x\">a</a>", "<img src=x onerror=alert(1)>"];
    const fehler = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      stub((url, roh) => (url.endsWith("auftrag.json") ? JSON.stringify({ ...JSON.parse(roh), hinweise: boese }) : roh)),
    );
    render(<Werkstoffseite />);
    await waitFor(() => screen.getByTestId("szene"));
    const zeilen = document.querySelectorAll(".hinweis-plan");
    expect(zeilen).toHaveLength(3);
    expect(document.querySelectorAll("img")).toHaveLength(0);
    expect(document.querySelectorAll(".hinweis-plan a")).toHaveLength(0);
    expect(zeilen[0]!.textContent).toContain("<img src=x onerror=alert(1)>");
    expect(zeilen[1]!.textContent).toContain("[Klick](http://x)");
    expect(fehler.mock.calls.flat().join(" ")).not.toMatch(/same key|gleiche.*key/i);
    fehler.mockRestore();
  });

  it("ohne Hinweise im Auftrag steht auch keine Hinweis-Zeile da — und ein kaputter Hinweis ist ein Auftragsfehler", async () => {
    vi.stubGlobal(
      "fetch",
      stub((url, roh) => {
        if (!url.endsWith("auftrag.json")) return roh;
        const { hinweise: _weg, ...ohne } = JSON.parse(roh);
        return JSON.stringify(ohne);
      }),
    );
    render(<Werkstoffseite />);
    await waitFor(() => screen.getByTestId("szene"));
    expect(document.body.textContent).not.toMatch(/Demo-Plan ohne Bohrbild/);
    cleanup();
    vi.stubGlobal(
      "fetch",
      stub((url, roh) => (url.endsWith("auftrag.json") ? JSON.stringify({ ...JSON.parse(roh), hinweise: [""] }) : roh)),
    );
    render(<Werkstoffseite />);
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/⚠ Kein Auftrag im Bundle: .*[Hh]inweis/);
    });
    expect(screen.queryByTestId("szene")).toBeNull();
  });

  it("nennt der Auftrag kein Modell: Schaltflächen bleiben, und der Satz sagt es", async () => {
    vi.stubGlobal(
      "fetch",
      stub((url, roh) => {
        if (!url.endsWith("auftrag.json")) return roh;
        const { modell: _weg, ...ohne } = JSON.parse(roh);
        return JSON.stringify(ohne);
      }),
    );
    render(<Werkstoffseite />);
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /^(Bo|Se):/ })).toHaveLength(4);
    });
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/Kein 3D-Modell/);
    });
    expect(screen.queryByTestId("szene")).toBeNull();
  });

  it("mit passendem Modell: die Szene bekommt die URL, und ein Tap in der Szene öffnet die Karte des Teils", async () => {
    vi.stubGlobal(
      "fetch",
      stub(), // R49-4: vorher ein No-op-Ternär
    );
    // Das ausgelieferte Modell liegt im Repo (Regelbetrieb-Test oben). Hier nimmt der Test bewusst
    // das Mini-Fixture und setzt dessen Hash in den Auftrag: der Zweig »Tap in der Szene → Karte«.
    const buf = new Uint8Array(readFileSync(join(__dirname, "../../../lib/werkstoff/fixtures/demo-mini.glb"))).buffer;
    const hash = createHash("sha256").update(new Uint8Array(buf)).digest("hex");
    const f = vi.mocked(globalThis.fetch);
    f.mockImplementation(async (url: string | URL | Request) => {
      const u = String(url);
      if (u.endsWith("modell.glb")) return { ok: true, status: 200, arrayBuffer: async () => buf } as unknown as Response;
      // Der Auftrag muss das Fixture-Modell nennen — mit dessen Hash, wie cody-cad es schriebe.
      return stub((x, roh) => (x.endsWith("auftrag.json") ? JSON.stringify({ ...JSON.parse(roh), modell: { glb_sha256: hash, datei: "modell.glb" } }) : roh))(u);
    });
    render(<Werkstoffseite />);
    const szene = await waitFor(() => screen.getByTestId("szene"));
    expect(szene.getAttribute("data-url")).toBe("/werkstoff-bundle/modell.glb");
    // Die Lücke geht bis in die Szene: das Brett ohne Karte wird grau gezeichnet.
    expect(szene.getAttribute("data-luecken")).toBe("teil:Rw");
    screen.getByRole("button", { name: /Szene: Bo:unten antippen/ }).click();
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/Teil teil_beispielbo0unten/);
    });
  });

  it("Hash passt, aber ein Brett hat keine Karte → der Fehler nennt das Brett, nicht den Hash (Knoten-Zweig)", async () => {
    // Das ausgelieferte Modell (Fixture, im Repo) passt zum Hash im Auftrag; der Auftrag wird um
    // ein Teil gekürzt → im Modell steht ein Brett ohne Karte. Kein ODER: genau dieser Zweig.
    vi.stubGlobal(
      "fetch",
      stub((url, roh) => {
        if (!url.endsWith("auftrag.json")) return roh;
        const a = JSON.parse(roh);
        a.teile = a.teile.filter((t: { schluessel: string }) => t.schluessel !== "teil:Se:rechts");
        return JSON.stringify(a);
      }),
    );
    render(<Werkstoffseite />);
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/teil:Se:rechts/);
    });
    expect(document.body.textContent).not.toMatch(/anderes Erzeugnis/);
    expect(screen.queryByTestId("szene")).toBeNull();
  });
});

describe("Werkstoff-Panel: das Modell muss das sein, das der Auftrag nennt", () => {
  it("nennt der Auftrag ein Modell, das im Bundle fehlt, ist das ein Fehler — kein stilles »kein Modell«", async () => {
    vi.stubGlobal("fetch", stub((url, roh) => (url.endsWith("modell.glb") ? null : roh)));
    render(<Werkstoffseite />);
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/fehlt im Bundle/);
    });
    expect(screen.queryByTestId("szene")).toBeNull();
    expect(document.body.textContent).not.toMatch(/Kein 3D-Modell/);
  });

  it("eine Datei mit anderem Hash wird nicht gezeigt — der Fehler nennt beide Hashes", async () => {
    // Das echte auftrag.json nennt das FreeCAD-Modell; die Datei im Test ist das Mini-Fixture.
    const buf = new Uint8Array(readFileSync(join(__dirname, "../../../lib/werkstoff/fixtures/demo-mini.glb"))).buffer;
    vi.stubGlobal("fetch", stub());
    vi.mocked(globalThis.fetch).mockImplementation(async (url: string | URL | Request) => {
      const u = String(url);
      if (u.endsWith("modell.glb")) return { ok: true, status: 200, arrayBuffer: async () => buf } as unknown as Response;
      return stub()(u);
    });
    render(<Werkstoffseite />);
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/nicht den Hash aus dem Auftrag/);
    });
    expect(screen.queryByTestId("szene")).toBeNull();
  });
});
