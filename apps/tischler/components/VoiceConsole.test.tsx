import { afterEach, describe, expect, it } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { VoiceConsole } from "./VoiceConsole";
import { LocalRAGProvider } from "../lib/rag/local-rag";
import { KeywordTopicGuard } from "../lib/rag/topic-guard";
import { getDemoCorpus } from "../lib/rag/corpus";
import deWorkshop from "../messages/de/workshop.json";

afterEach(cleanup);

function providers() {
  const rag = new LocalRAGProvider(getDemoCorpus());
  const guard = new KeywordTopicGuard({
    rag,
    onTopicMin: 0.25,
    offTopicMax: 0.05,
    blacklist: [],
  });
  return { rag, guard };
}

describe("VoiceConsole", () => {
  it("rendert im Mock-Modus mit Demo-Fragen, ohne Mikrofon-Knopf", () => {
    const { rag, guard } = providers();
    // Komponente liest workshop.voiceConsole.* — Provider mit den echten
    // DE-Messages, Assertions bleiben gegen die deutschen Texte.
    render(
      <NextIntlClientProvider locale="de" messages={{ workshop: deWorkshop }}>
        <VoiceConsole rag={rag} guard={guard} />
      </NextIntlClientProvider>,
    );
    // Lienz Punkt 1: Der Knopf "🎤 Frage stellen" hört nicht zu, er stellt reihum
    // eine eingebaute Frage. Wer hineinspricht, bekommt eine Antwort auf etwas anderes.
    // Standard deshalb: ausgeblendet.
    expect(screen.queryByRole("button", { name: /Frage stellen/ })).toBeNull();
    // mindestens eine Demo-Frage als Chip
    expect(screen.getByRole("button", { name: /Schwalbenwinkel/ })).toBeTruthy();
    // Texteingabe als Offline-Fallback
    expect(screen.getByLabelText(/Frage eingeben/)).toBeTruthy();
  });

  it("zeigt den Reihum-Knopf nur auf ausdrücklichen Wunsch (showAskButton)", () => {
    const { rag, guard } = providers();
    render(
      <NextIntlClientProvider locale="de" messages={{ workshop: deWorkshop }}>
        <VoiceConsole rag={rag} guard={guard} showAskButton />
      </NextIntlClientProvider>,
    );
    expect(screen.getByRole("button", { name: /Frage stellen/ })).toBeTruthy();
  });
});
