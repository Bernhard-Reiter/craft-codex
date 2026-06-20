import { describe, it, expect } from "vitest";
import { createServerVoiceProviders } from "./factory";
import { LocalRAGProvider } from "../rag/local-rag";
import { KeywordTopicGuard } from "../rag/topic-guard";
import { getDovetailCorpus } from "../rag/corpus/dovetail-corpus";
import type { ServerVoiceHealth } from "./server-providers";

function setup() {
  const rag = new LocalRAGProvider(getDovetailCorpus());
  const guard = new KeywordTopicGuard({ rag, onTopicMin: 0.25 });
  return { rag, guard };
}

describe("createServerVoiceProviders", () => {
  it("liefert ein server-Bundle mit STT/TTS/Answer wenn alles konfiguriert", () => {
    const { rag, guard } = setup();
    const health: ServerVoiceHealth = { ok: true, stt: true, tts: true, answer: "gemini" };
    const b = createServerVoiceProviders({ rag, guard, health });
    expect(b.mode).toBe("server");
    expect(b.stt).toBeTruthy();
    expect(b.tts).toBeTruthy();
    expect(typeof b.answer).toBe("function");
  });

  it("ohne Server-STT → Mock-STT-Fallback (kein Crash, Texteingabe bleibt)", () => {
    const { rag, guard } = setup();
    const health: ServerVoiceHealth = { ok: true, stt: false, tts: false, answer: "template" };
    const b = createServerVoiceProviders({ rag, guard, health });
    expect(b.mode).toBe("server");
    expect(b.stt).toBeTruthy();
    expect(b.tts).toBeTruthy();
  });

  it("nutzt den Cache, wenn ein Manifest übergeben wird", () => {
    const { rag, guard } = setup();
    const health: ServerVoiceHealth = { ok: true, stt: false, tts: true, answer: "template" };
    const b = createServerVoiceProviders({
      rag,
      guard,
      health,
      ttsCacheManifest: { version: 1, entries: {} },
    });
    expect(b.tts).toBeTruthy();
  });
});
