import { describe, expect, it } from "vitest";
import { istVi4Route, VI4_ROUTEN } from "./look";

describe("istVi4Route — welche Routen den VI4-Look tragen", () => {
  it("nur der Zinken-Lehrgang (Stufe 1)", () => {
    expect([...VI4_ROUTEN]).toEqual(["/zinken"]);
  });

  it.each(["/zinken", "/zinken/", "/zinken/xr", "/zinken/xr/"])("%s → VI4", (p) => {
    expect(istVi4Route(p)).toBe(true);
  });

  // Unverändert: Startseite (Lienz-Demo), alle bisherigen Routen, admin.
  it.each([
    "/",
    "/dovetail",
    "/dovetail/xr",
    "/lernen",
    "/werkstatt",
    "/beschlag",
    "/beschlag/xr",
    "/werkstoff",
    "/cockpit",
    "/universum",
    "/voice",
    "/beitragen",
    "/admin/contributions",
    "/zinkenx",
    "/de/zinken", // usePathname liefert ohne Locale; ein Pfad mit Präfix ist kein Treffer
    "",
  ])("%s → bisheriger Look", (p) => {
    expect(istVi4Route(p)).toBe(false);
  });

  it("null/undefined → bisheriger Look", () => {
    expect(istVi4Route(null)).toBe(false);
    expect(istVi4Route(undefined)).toBe(false);
  });
});
