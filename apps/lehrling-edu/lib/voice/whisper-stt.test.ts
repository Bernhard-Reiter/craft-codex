import { describe, it, expect, vi } from "vitest";
import { WhisperSTTProvider, pcmToWavBlob } from "./whisper-stt";
import type { STTChunk } from "@voai/lehrlings-core";

function audioStream(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(c);
      controller.close();
    },
  });
}

async function collect(iter: AsyncIterable<STTChunk>): Promise<STTChunk[]> {
  const out: STTChunk[] = [];
  for await (const c of iter) out.push(c);
  return out;
}

describe("pcmToWavBlob", () => {
  it("produces blob with correct WAV-header magic + data size", async () => {
    const pcm = new Uint8Array(100);
    pcm.fill(42);
    const blob = pcmToWavBlob(pcm, 16000);
    expect(blob.type).toBe("audio/wav");
    expect(blob.size).toBe(44 + 100);
    const ab = await blob.arrayBuffer();
    const dv = new DataView(ab);
    expect(
      String.fromCharCode(
        dv.getUint8(0),
        dv.getUint8(1),
        dv.getUint8(2),
        dv.getUint8(3),
      ),
    ).toBe("RIFF");
    expect(
      String.fromCharCode(
        dv.getUint8(8),
        dv.getUint8(9),
        dv.getUint8(10),
        dv.getUint8(11),
      ),
    ).toBe("WAVE");
    // data-chunk size at offset 40
    expect(dv.getUint32(40, true)).toBe(100);
    // sample rate at offset 24
    expect(dv.getUint32(24, true)).toBe(16000);
  });
});

describe("WhisperSTTProvider", () => {
  it("throws when apiKey missing", async () => {
    const p = new WhisperSTTProvider({ apiKey: "" });
    await expect(
      collect(p.transcribeStream(audioStream([new Uint8Array([1, 2])]))),
    ).rejects.toThrow(/API_KEY/);
  });

  it("empty stream yields nothing (no API call)", async () => {
    const fetchImpl = vi.fn();
    const p = new WhisperSTTProvider({ apiKey: "sk-x", fetchImpl });
    const r = await collect(p.transcribeStream(audioStream([])));
    expect(r).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("posts WAV + correct headers + form-data fields", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ text: "Wie reisse ich an?" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const p = new WhisperSTTProvider({ apiKey: "sk-x", fetchImpl });
    await collect(
      p.transcribeStream(audioStream([new Uint8Array([1, 2, 3, 4])])),
    );
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("https://api.openai.com/v1/audio/transcriptions");
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer sk-x");
    expect((init as RequestInit).body).toBeInstanceOf(FormData);
    const form = (init as RequestInit).body as FormData;
    expect(form.get("model")).toBe("whisper-1");
    expect(form.get("language")).toBe("de");
    expect(form.get("response_format")).toBe("json");
    expect(form.get("file")).toBeInstanceOf(Blob);
  });

  it("yields single final STTChunk with confidence", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ text: " Hallo Welt " }), {
        status: 200,
      }),
    );
    const p = new WhisperSTTProvider({ apiKey: "sk-x", fetchImpl });
    const r = await collect(
      p.transcribeStream(audioStream([new Uint8Array([1])])),
    );
    expect(r).toHaveLength(1);
    expect(r[0]!.text).toBe("Hallo Welt");
    expect(r[0]!.isFinal).toBe(true);
  });

  it("empty whisper response yields nothing", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ text: "   " }), { status: 200 }),
      );
    const p = new WhisperSTTProvider({ apiKey: "sk-x", fetchImpl });
    const r = await collect(
      p.transcribeStream(audioStream([new Uint8Array([1])])),
    );
    expect(r).toEqual([]);
  });

  it("throws on non-200 response", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response("rate_limited", { status: 429 }));
    const p = new WhisperSTTProvider({ apiKey: "sk-x", fetchImpl });
    await expect(
      collect(p.transcribeStream(audioStream([new Uint8Array([1])]))),
    ).rejects.toThrow(/429/);
  });

  it("custom endpoint + model + language honored", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ text: "x" }), { status: 200 }),
      );
    const p = new WhisperSTTProvider({
      apiKey: "sk-x",
      endpoint: "https://api.groq.com/openai/v1/audio/transcriptions",
      model: "whisper-large-v3-turbo",
      language: "en",
      fetchImpl,
    });
    await collect(p.transcribeStream(audioStream([new Uint8Array([1])])));
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("https://api.groq.com/openai/v1/audio/transcriptions");
    const form = (init as RequestInit).body as FormData;
    expect(form.get("model")).toBe("whisper-large-v3-turbo");
    expect(form.get("language")).toBe("en");
  });
});
