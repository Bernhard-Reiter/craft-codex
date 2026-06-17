import { afterEach, describe, expect, it } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SchwalbenwinkelWahl } from "./SchwalbenwinkelWahl";

afterEach(cleanup);

describe("SchwalbenwinkelWahl", () => {
  it("zeigt zuerst 1:6 (steiler) und erklärt den Unterschied", () => {
    render(<SchwalbenwinkelWahl />);
    expect(screen.getByText(/1:6 — der steilere Winkel/)).toBeTruthy();
    expect(screen.getByText(/Der Unterschied:/)).toBeTruthy();
  });

  it("wechselt auf 1:8 (feiner) per Klick", () => {
    render(<SchwalbenwinkelWahl />);
    fireEvent.click(screen.getByRole("button", { name: /1:8/ }));
    expect(screen.getByText(/1:8 — der feinere Winkel/)).toBeTruthy();
  });
});
