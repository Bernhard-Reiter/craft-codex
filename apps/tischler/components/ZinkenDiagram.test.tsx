import { afterEach, describe, expect, it } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ZinkenDiagram } from "./ZinkenDiagram";

afterEach(cleanup);

describe("ZinkenDiagram", () => {
  it("rendert die Verbindung + Steuerung", () => {
    render(<ZinkenDiagram />);
    expect(screen.getByRole("button", { name: /Zusammenfügen/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Auseinander/ })).toBeTruthy();
  });

  it("startet zusammengefügt und reagiert auf Auseinanderziehen", () => {
    render(<ZinkenDiagram />);
    expect(screen.getByText(/Verriegelt/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Auseinander/ }));
    expect(screen.getByText(/Getrennt/)).toBeTruthy();
  });
});
