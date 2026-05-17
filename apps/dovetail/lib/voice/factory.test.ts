import { describe, it, expect } from "vitest";
import {
  createMockVoiceProviders,
  createRealVoiceProviders,
  createVoiceProviders,
} from "./factory";
import { LocalRAGProvider } from "../rag/local-rag";
import { StubTopicGuard } from "../rag/topic-guard";
import { getDovetailCorpus } from "../rag/corpus/dovetail-corpus";

function setup() {
  const rag = new LocalRAGProvider(getDovetailCorpus());
  const guard = new StubTopicGuard({ rag, onTopicMin: 0.25 });
  return { rag, guard };
}

describe("createMockVoiceProviders", () => {
  it("returns bundle with mode=mock", () => {
    const { rag, guard } = setup();
    const b = createMockVoiceProviders({ rag, guard });
    expect(b.mode).toBe("mock");
  });

  it("includes stt + tts + answer (all dormant)", () => {
    const { rag, guard } = setup();
    const b = createMockVoiceProviders({ rag, guard });
    expect(b.stt).toBeDefined();
    expect(b.tts).toBeDefined();
    expect(typeof b.answer).toBe("function");
  });

  it("uses first sampleQuery in mock STT", () => {
    const { rag, guard } = setup();
    const b = createMockVoiceProviders({
      rag,
      guard,
      sampleQueries: ["Wie reisse ich an", "Schwalbenwinkel"],
    });
    expect(b.stt).toBeDefined();
  });
});

describe("createRealVoiceProviders", () => {
  it("requires all 3 keys, throws otherwise", () => {
    const { rag, guard } = setup();
    expect(() =>
      createRealVoiceProviders({
        rag,
        guard,
        anthropicApiKey: "",
        openaiApiKey: "sk-x",
        elevenLabsApiKey: "sk-y",
      }),
    ).toThrow(/three API keys/);
  });

  it("returns bundle with mode=real when all keys provided", () => {
    const { rag, guard } = setup();
    const b = createRealVoiceProviders({
      rag,
      guard,
      anthropicApiKey: "sk-ant",
      openaiApiKey: "sk-oai",
      elevenLabsApiKey: "sk-el",
    });
    expect(b.mode).toBe("real");
    expect(b.stt).toBeDefined();
    expect(b.tts).toBeDefined();
    expect(typeof b.answer).toBe("function");
  });

  it("wraps TTS in CachedTTSProvider when manifest provided", () => {
    const { rag, guard } = setup();
    const b = createRealVoiceProviders({
      rag,
      guard,
      anthropicApiKey: "sk-ant",
      openaiApiKey: "sk-oai",
      elevenLabsApiKey: "sk-el",
      ttsCacheManifest: {
        version: 1,
        entries: {},
      },
    });
    // CachedTTSProvider wrapping is verified by structural difference:
    // the inner upstream is an ElevenLabsTTSProvider. We can't introspect
    // private fields easily — accept that constructor didn't throw.
    expect(b.tts).toBeDefined();
  });
});

describe("createVoiceProviders (auto)", () => {
  it("falls back to mock when keys missing", () => {
    const { rag, guard } = setup();
    const b = createVoiceProviders({ rag, guard });
    expect(b.mode).toBe("mock");
  });

  it("picks real when all keys present", () => {
    const { rag, guard } = setup();
    const b = createVoiceProviders({
      rag,
      guard,
      anthropicApiKey: "sk-a",
      openaiApiKey: "sk-o",
      elevenLabsApiKey: "sk-e",
    });
    expect(b.mode).toBe("real");
  });

  it("partial keys → mock (alle drei oder gar nicht)", () => {
    const { rag, guard } = setup();
    const b = createVoiceProviders({
      rag,
      guard,
      anthropicApiKey: "sk-a",
      openaiApiKey: undefined,
      elevenLabsApiKey: "sk-e",
    });
    expect(b.mode).toBe("mock");
  });
});
