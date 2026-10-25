import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import de from "../../../../messages/de/werkbank.json";
import en from "../../../../messages/en/werkbank.json";
import TorSeite, { dynamic, metadata } from "./page";

/**
 * Werkbank S2b: das Code-Feld des Probelauf-Tors (Zeichnung b v9; Prüfplan »Tor (S2, ohne DB; v8)«).
 * Texte wortgleich aus messages/<sprache>/werkbank.json. next-intl/server wird durch einen
 * Ersatz gegeben, der genau diese Dateien liest und nur den Namensraum werkbank.tor kennt.
 */

vi.mock("next-intl/server", async () => {
  const texte = {
    de: (await import("../../../../messages/de/werkbank.json")).default,
    en: (await import("../../../../messages/en/werkbank.json")).default,
  };
  return {
    getTranslations: async ({ locale, namespace }: { locale: "de" | "en"; namespace: string }) => {
      if (namespace !== "werkbank.tor") throw new Error(`falscher Namensraum ${namespace}`);
      const tor: Record<string, string> = texte[locale].tor;
      return (schluessel: string) => tor[schluessel] ?? `FEHLT ${schluessel}`;
    },
  };
});

const CODE = "c0dec0dec0dec0dec0dec0dec0dec0de";
const SALZ = "5a175a175a175a175a175a175a175a175a175a175a175a175a175a175a175a17";
const NAMEN = ["ZINKEN_MEISTER_CODE", "ZINKEN_MEISTER_SALZ", "DEBUG", "NODE_DEBUG", "ANTHROPIC_LOG"] as const;
let gesichert: Record<string, string | undefined> = {};

beforeEach(() => {
  gesichert = Object.fromEntries(NAMEN.map((name) => [name, process.env[name]]));
  for (const name of NAMEN) delete process.env[name];
  process.env.ZINKEN_MEISTER_CODE = CODE;
  process.env.ZINKEN_MEISTER_SALZ = SALZ;
});

afterEach(() => {
  cleanup();
  for (const name of NAMEN) {
    const wert = gesichert[name];
    if (wert === undefined) delete process.env[name];
    else process.env[name] = wert;
  }
});

async function zeige(locale: string, suche: Record<string, string> = {}): Promise<HTMLElement> {
  render(await TorSeite({ params: Promise.resolve({ locale }), searchParams: Promise.resolve(suche) }));
  return screen.getByTestId("tor-feld");
}

describe("Probelauf-Tor: Code-Feld", () => {
  it("Code-Feld de: tor-feld mit Formular (POST an /api/zinken/tor, Feld code, Sprache de), Texte aus messages/de, keine Werkbank", async () => {
    const feld = await zeige("de");
    const formular = feld.querySelector("form");
    expect([formular?.getAttribute("method"), formular?.getAttribute("action")]).toEqual(["post", "/api/zinken/tor"]);
    const code = screen.getByLabelText(de.tor.feld) as HTMLInputElement;
    expect([code.name, code.type, code.getAttribute("autocomplete")]).toEqual(["code", "text", "off"]);
    expect(feld.querySelector<HTMLInputElement>('input[name="sprache"]')?.value).toBe("de");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(de.tor.titel);
    expect(screen.getByText(de.tor.erklaerung)).toBeTruthy();
    expect(screen.getByRole("button").textContent).toBe(de.tor.knopf);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByTestId("werkbank")).toBeNull();
    expect(document.body.innerHTML).not.toContain(CODE);
  });

  it("Code-Feld en: Texte aus messages/en, Sprache en", async () => {
    const feld = await zeige("en");
    expect(feld.querySelector<HTMLInputElement>('input[name="sprache"]')?.value).toBe("en");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(en.tor.titel);
    expect(screen.getByText(en.tor.erklaerung)).toBeTruthy();
    expect((screen.getByLabelText(en.tor.feld) as HTMLInputElement).name).toBe("code");
    expect(screen.getByRole("button").textContent).toBe(en.tor.knopf);
  });

  it("Code-Feld nach falschem Code: Hinweis aus messages, sonst keiner", async () => {
    await zeige("de", { tor: "falsch" });
    expect(screen.getByRole("alert").textContent).toBe(de.tor.falsch);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("Code-Feld bei Tor zu (SALZ fehlt): »Probelauf gerade nicht aktiv« aus messages", async () => {
    delete process.env.ZINKEN_MEISTER_SALZ;
    await zeige("en", { tor: "falsch" });
    expect(screen.getByRole("status").textContent).toBe(en.tor.zu);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(de.tor.zu).toBe("Probelauf gerade nicht aktiv");
  });

  it("Code-Feld ist noindex und dynamisch (nie gecacht)", async () => {
    await zeige("de");
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(dynamic).toBe("force-dynamic");
  });
});
