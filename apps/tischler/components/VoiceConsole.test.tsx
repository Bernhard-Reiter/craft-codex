import { afterEach, describe, expect, it } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { VoiceConsole } from "./VoiceConsole";
import { LocalRAGProvider } from "../lib/rag/local-rag";
import { StubTopicGuard } from "../lib/rag/topic-guard";
import { getDemoCorpus } from "../lib/rag/corpus";

afterEach(cleanup);

function providers() {
  const rag = new LocalRAGProvider(getDemoCorpus());
  const guard = new StubTopicGuard({
    rag,
    onTopicMin: 0.25,
    offTopicMax: 0.05,
    blacklist: [],
  });
  return { rag, guard };
}

describe("VoiceConsole", () => {
  it("rendert im Mock-Modus mit Frage-Button + Demo-Fragen", () => {
    const { rag, guard } = providers();
    render(<VoiceConsole rag={rag} guard={guard} />);
    expect(screen.getByRole("button", { name: /Frage stellen/ })).toBeTruthy();
    // mindestens eine Demo-Frage als Chip
    expect(screen.getByRole("button", { name: /Schwalbenwinkel/ })).toBeTruthy();
    // Texteingabe als Offline-Fallback
    expect(screen.getByLabelText(/Frage eingeben/)).toBeTruthy();
  });
});
