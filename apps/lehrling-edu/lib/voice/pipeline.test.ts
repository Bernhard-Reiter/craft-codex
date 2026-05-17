import { describe, it, expect } from "vitest";
import { VoicePipeline } from "./pipeline";
import { MockSTTProvider, mockSttFromText } from "./mock-stt";
import { MockTTSProvider } from "./mock-tts";
import type { VoicePipelineState } from "@voai/lehrlings-core";

function emptyAudioStream(): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array([0]));
      controller.close();
    },
  });
}

async function drain(iter: AsyncIterable<unknown>): Promise<number> {
  let count = 0;
  for await (const _chunk of iter) {
    void _chunk;
    count++;
  }
  return count;
}

describe("VoicePipeline", () => {
  it("idle → listening → thinking → speaking → idle", async () => {
    const states: VoicePipelineState[] = [];
    const pipeline = new VoicePipeline({
      stt: mockSttFromText("Wie zinke ich Hartholz?"),
      tts: new MockTTSProvider({ secondsPerChar: 0.001 }),
      answer: async () => "1:6 Verhältnis und scharfe Eisen.",
    });
    pipeline.onStateChange((s) => states.push({ ...s }));

    expect(pipeline.getState().status).toBe("idle");
    await drain(pipeline.handle(emptyAudioStream()));

    const seq = states.map((s) => s.status);
    expect(seq[0]).toBe("listening");
    expect(seq).toContain("thinking");
    expect(seq).toContain("speaking");
    expect(seq[seq.length - 1]).toBe("idle");
  });

  it("currentQuery is set after STT, response after LLM", async () => {
    let captured: VoicePipelineState | null = null;
    const pipeline = new VoicePipeline({
      stt: mockSttFromText("Test query"),
      tts: new MockTTSProvider({ secondsPerChar: 0.001 }),
      answer: async () => "Test response",
    });
    pipeline.onStateChange((s) => {
      if (s.status === "speaking") captured = { ...s };
    });

    await drain(pipeline.handle(emptyAudioStream()));
    expect(captured).not.toBeNull();
    expect(captured!.currentQuery).toBe("Test query");
    expect(captured!.currentResponse).toBe("Test response");
  });

  it("latencyMs gets stt + llm + tts measurements", async () => {
    let final: VoicePipelineState | null = null;
    const pipeline = new VoicePipeline({
      stt: mockSttFromText("Frage"),
      tts: new MockTTSProvider({ secondsPerChar: 0.001 }),
      answer: async () => "Antwort",
    });
    pipeline.onStateChange((s) => {
      if (s.latencyMs?.tts !== undefined) final = { ...s };
    });

    await drain(pipeline.handle(emptyAudioStream()));
    expect(final).not.toBeNull();
    expect(final!.latencyMs?.stt).toBeGreaterThanOrEqual(0);
    expect(final!.latencyMs?.llm).toBeGreaterThanOrEqual(0);
    expect(final!.latencyMs?.tts).toBeGreaterThanOrEqual(0);
  });

  it("yields TTS audio chunks proportional to response length", async () => {
    const pipeline = new VoicePipeline({
      stt: mockSttFromText("?"),
      tts: new MockTTSProvider({
        sampleRate: 24000,
        secondsPerChar: 0.01,
        frameSize: 256,
      }),
      answer: async () => "x".repeat(50),
    });
    const count = await drain(pipeline.handle(emptyAudioStream()));
    expect(count).toBeGreaterThan(0);
  });

  it("empty transcript ends in idle without LLM call", async () => {
    let answerCalled = false;
    const pipeline = new VoicePipeline({
      stt: new MockSTTProvider({
        chunks: [{ text: "", isFinal: true }],
        chunkDelayMs: 0,
      }),
      tts: new MockTTSProvider(),
      answer: async () => {
        answerCalled = true;
        return "should not be called";
      },
    });
    await drain(pipeline.handle(emptyAudioStream()));
    expect(answerCalled).toBe(false);
    expect(pipeline.getState().status).toBe("idle");
  });

  it("answer can return AsyncIterable<string> (streaming)", async () => {
    const collected: VoicePipelineState[] = [];
    async function* streamingAnswer() {
      yield "Teil 1 ";
      yield "Teil 2";
    }
    const pipeline = new VoicePipeline({
      stt: mockSttFromText("Frage"),
      tts: new MockTTSProvider({ secondsPerChar: 0.001 }),
      answer: () => streamingAnswer(),
    });
    pipeline.onStateChange((s) => {
      if (s.status === "speaking") collected.push({ ...s });
    });
    await drain(pipeline.handle(emptyAudioStream()));
    expect(collected.length).toBeGreaterThan(0);
    expect(collected[0]!.currentResponse).toBe("Teil 1 Teil 2");
  });

  it("onStateChange unsubscribe stops events", async () => {
    let count = 0;
    const pipeline = new VoicePipeline({
      stt: mockSttFromText("?"),
      tts: new MockTTSProvider({ secondsPerChar: 0.001 }),
      answer: async () => "Hi",
    });
    const unsub = pipeline.onStateChange(() => count++);
    unsub();
    await drain(pipeline.handle(emptyAudioStream()));
    expect(count).toBe(0);
  });
});
