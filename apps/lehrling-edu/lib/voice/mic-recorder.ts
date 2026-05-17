"use client";

/**
 * Browser-MicRecorder mit AudioWorklet → PCM-Stream.
 *
 * Phase C+ Foundation: zieht echtes Mic-Audio (browser-side), liefert PCM
 * Int16 Bytes als ReadableStream<Uint8Array>. Plug-in fuer Whisper-streaming
 * (Phase D) — VoicePipeline.handle(stream) konsumiert direkt.
 *
 * SSR-safe: alle Browser-APIs nur on-demand referenziert. Server-render
 * faellt zurueck auf no-op Methoden.
 */

export interface MicRecorderConfig {
  /** Pfad zum AudioWorklet-JS. Default: "/worklets/pcm-recorder.js" */
  workletUrl?: string;
  /** Sampling-Rate. Default: 16000 (Whisper-Standard) */
  sampleRate?: number;
  /** echoCancellation / noiseSuppression / autoGainControl */
  constraints?: MediaTrackConstraints;
}

export interface MicRecorderStartResult {
  /** PCM Int16 little-endian Stream, jedes Chunk = ein Worklet-Frame */
  stream: ReadableStream<Uint8Array>;
  /** Effektive Sample-Rate des AudioContext (kann vom Wunsch abweichen) */
  sampleRate: number;
}

export class MicRecorder {
  private config: Required<Omit<MicRecorderConfig, "constraints">> & {
    constraints?: MediaTrackConstraints;
  };
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private streamController: ReadableStreamDefaultController<Uint8Array> | null =
    null;
  private active = false;

  constructor(config: MicRecorderConfig = {}) {
    this.config = {
      workletUrl: config.workletUrl ?? "/worklets/pcm-recorder.js",
      sampleRate: config.sampleRate ?? 16000,
      constraints: config.constraints,
    };
  }

  isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return (
      typeof navigator.mediaDevices?.getUserMedia === "function" &&
      typeof window.AudioContext === "function"
    );
  }

  isActive(): boolean {
    return this.active;
  }

  async start(): Promise<MicRecorderStartResult> {
    if (this.active) {
      throw new Error("MicRecorder already running — call stop() first");
    }
    if (!this.isSupported()) {
      throw new Error(
        "MicRecorder not supported in this environment (no MediaDevices or AudioContext)",
      );
    }

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: this.config.constraints ?? {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.audioContext = new AudioContext({
      sampleRate: this.config.sampleRate,
    });

    await this.audioContext.audioWorklet.addModule(this.config.workletUrl);

    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.workletNode = new AudioWorkletNode(this.audioContext, "pcm-recorder");

    const stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        this.streamController = controller;
      },
      cancel: () => {
        this.streamController = null;
      },
    });

    this.workletNode.port.onmessage = (event) => {
      if (!this.streamController) return;
      const buffer = event.data as ArrayBuffer;
      this.streamController.enqueue(new Uint8Array(buffer));
    };

    source.connect(this.workletNode);
    // Worklet output verbinden wir NICHT mit destination —
    // wir wollen Mic abhoeren, nicht Echo.

    this.active = true;
    return { stream, sampleRate: this.audioContext.sampleRate };
  }

  stop(): void {
    this.active = false;
    if (this.streamController) {
      try {
        this.streamController.close();
      } catch {
        // controller already closed
      }
      this.streamController = null;
    }
    if (this.workletNode) {
      this.workletNode.port.onmessage = null;
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
  }
}
