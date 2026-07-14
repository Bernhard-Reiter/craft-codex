import { afterEach, describe, expect, it } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { ZinkenDiagram } from "./ZinkenDiagram";
import deWorkshop from "../messages/de/workshop.json";

afterEach(cleanup);

// Komponente liest workshop.diagram.* — Provider mit den echten DE-Messages,
// Assertions bleiben gegen die deutschen Texte.
function renderDe() {
  return render(
    <NextIntlClientProvider locale="de" messages={{ workshop: deWorkshop }}>
      <ZinkenDiagram />
    </NextIntlClientProvider>,
  );
}

describe("ZinkenDiagram", () => {
  it("rendert die Verbindung + Steuerung", () => {
    renderDe();
    expect(screen.getByRole("button", { name: /Zusammenfügen/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Auseinander/ })).toBeTruthy();
  });

  it("startet zusammengefügt und reagiert auf Auseinanderziehen", () => {
    renderDe();
    expect(screen.getByText(/Verriegelt/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Auseinander/ }));
    expect(screen.getByText(/Getrennt/)).toBeTruthy();
  });
});
