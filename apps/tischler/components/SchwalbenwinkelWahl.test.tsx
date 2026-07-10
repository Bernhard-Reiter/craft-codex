import { afterEach, describe, expect, it } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { SchwalbenwinkelWahl } from "./SchwalbenwinkelWahl";
import deLearn from "../messages/de/learn.json";

afterEach(cleanup);

// Komponente liest learn.anglePicker.* — Provider mit den echten DE-Messages,
// Assertions bleiben gegen die deutschen Texte.
function renderDe() {
  return render(
    <NextIntlClientProvider locale="de" messages={{ learn: deLearn }}>
      <SchwalbenwinkelWahl />
    </NextIntlClientProvider>,
  );
}

describe("SchwalbenwinkelWahl", () => {
  it("zeigt zuerst 1:6 (steiler) und erklärt den Unterschied", () => {
    renderDe();
    expect(screen.getByText(/1:6 — der steilere Winkel/)).toBeTruthy();
    expect(screen.getByText(/Der Unterschied:/)).toBeTruthy();
  });

  it("wechselt auf 1:8 (feiner) per Klick", () => {
    renderDe();
    fireEvent.click(screen.getByRole("button", { name: /1:8/ }));
    expect(screen.getByText(/1:8 — der feinere Winkel/)).toBeTruthy();
  });
});
