import type {
  ISTTProvider,
  ITTSProvider,
  STTChunk,
  TTSChunk,
  VoicePipelineState,
  VoicePipelineListener,
} from "@craft-codex/core";

/**
 * Antwort-Strategie der Pipeline (LLM-Stub-Phase).
 *
 * Phase C+ ersetzt das durch Claude-streaming SSE + RAG-Retrieve.
 */
export type AnswerFn = (
  query: string,
) => Promise<string> | AsyncIterable<string>;

export interface VoicePipelineConfig {
  stt: ISTTProvider;
  tts: ITTSProvider;
  answer: AnswerFn;
  ttsOptions?: { voiceId?: string; ssml?: boolean };
}

/**
 * Voice-Pipeline orchestriert STT → LLM(answer) → TTS.
 *
 * Status-State wird ueber Listener publiziert (idle/listening/thinking/speaking)
 * inkl. Latenz-Messungen pro Phase.
 */
export class VoicePipeline {
  private stt: ISTTProvider;
  private tts: ITTSProvider;
  private answer: AnswerFn;
  private ttsOptions: { voiceId?: string; ssml?: boolean };

  private state: VoicePipelineState = { status: "idle" };
  private listeners = new Set<VoicePipelineListener>();

  constructor(config: VoicePipelineConfig) {
    this.stt = config.stt;
    this.tts = config.tts;
    this.answer = config.answer;
    this.ttsOptions = config.ttsOptions ?? {};
  }

  getState(): Readonly<VoicePipelineState> {
    return this.state;
  }

  onStateChange(listener: VoicePipelineListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Verarbeite einen Audio-Eingangsstream end-to-end.
   *
   * Returns: Async-Iterable von TTS-Audio-Chunks (caller spielt sie ab).
   * Callers koennen via onStateChange auch Zwischenstaende beobachten
   * (currentQuery nach STT, currentResponse nach LLM, Latenz-Messungen).
   */
  async *handle(
    audioStream: ReadableStream<Uint8Array>,
  ): AsyncIterable<TTSChunk> {
    this.update({ status: "listening", latencyMs: {} });

    const sttStart = performance.now();
    const transcript = await collectFinalTranscript(
      this.stt.transcribeStream(audioStream),
    );
    const sttMs = performance.now() - sttStart;

    if (!transcript) {
      this.update({ status: "idle" });
      return;
    }

    this.update({
      status: "thinking",
      currentQuery: transcript,
      latencyMs: { ...this.state.latencyMs, stt: Math.round(sttMs) },
    });

    const llmStart = performance.now();
    const response = await collectAnswer(this.answer(transcript));
    const llmMs = performance.now() - llmStart;

    this.update({
      status: "speaking",
      currentResponse: response,
      latencyMs: {
        ...this.state.latencyMs,
        llm: Math.round(llmMs),
      },
    });

    const ttsStart = performance.now();
    let firstByteEmitted = false;
    for await (const chunk of this.tts.synthesizeStream(response, this.ttsOptions)) {
      if (!firstByteEmitted) {
        firstByteEmitted = true;
        this.update({
          latencyMs: {
            ...this.state.latencyMs,
            tts: Math.round(performance.now() - ttsStart),
          },
        });
      }
      yield chunk;
    }

    this.update({ status: "idle" });
  }

  private update(patch: Partial<VoicePipelineState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l(this.state));
  }
}

async function collectFinalTranscript(
  iter: AsyncIterable<STTChunk>,
): Promise<string> {
  let final = "";
  for await (const chunk of iter) {
    if (chunk.isFinal) final += (final ? " " : "") + chunk.text;
  }
  return final.trim();
}

async function collectAnswer(
  result: Promise<string> | AsyncIterable<string>,
): Promise<string> {
  if (typeof (result as Promise<string>).then === "function") {
    return await (result as Promise<string>);
  }
  let acc = "";
  for await (const piece of result as AsyncIterable<string>) {
    acc += piece;
  }
  return acc;
}
