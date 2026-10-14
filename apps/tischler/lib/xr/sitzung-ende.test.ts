import { describe, it, expect } from "vitest";
import { beiSitzungsEnde, type SitzungsQuelle } from "./sitzung-ende";

function fakeStore() {
  let l: ((s: { session?: unknown }) => void) | null = null;
  const store: SitzungsQuelle = {
    subscribe(listener) {
      l = listener;
      return () => {
        l = null;
      };
    },
  };
  return { store, sende: (session?: unknown) => l?.({ session }) };
}

describe("beiSitzungsEnde", () => {
  it("meldet das Ende genau einmal je Sitzung", () => {
    const { store, sende } = fakeStore();
    let n = 0;
    beiSitzungsEnde(store, () => n++);
    sende(); // vor dem Start: keine Sitzung → kein Ende
    expect(n).toBe(0);
    sende({ id: 1 });
    sende({ id: 1 });
    expect(n).toBe(0);
    sende(); // Sitzung vorbei
    sende(); // weitere Updates ohne Sitzung zählen nicht
    expect(n).toBe(1);
    sende({ id: 2 });
    sende();
    expect(n).toBe(2);
  });

  it("abmelden beendet die Meldungen", () => {
    const { store, sende } = fakeStore();
    let n = 0;
    const ab = beiSitzungsEnde(store, () => n++);
    sende({ id: 1 });
    ab();
    sende();
    expect(n).toBe(0);
  });
});
