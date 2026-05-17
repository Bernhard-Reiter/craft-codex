import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MicRecorder } from "./mic-recorder";

const originalNavigator = globalThis.navigator;
const originalWindow = globalThis.window;

afterEach(() => {
  if (originalNavigator !== undefined) {
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  } else {
    delete (globalThis as { navigator?: unknown }).navigator;
  }
  if (originalWindow !== undefined) {
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      configurable: true,
      writable: true,
    });
  } else {
    delete (globalThis as { window?: unknown }).window;
  }
});

function setBrowserEnv(opts: {
  hasMediaDevices?: boolean;
  hasAudioContext?: boolean;
}) {
  const navMock: Record<string, unknown> = {};
  if (opts.hasMediaDevices) {
    navMock.mediaDevices = {
      getUserMedia: async () => new (class {})(),
    };
  }
  Object.defineProperty(globalThis, "navigator", {
    value: navMock,
    configurable: true,
    writable: true,
  });
  const winMock: Record<string, unknown> = {};
  if (opts.hasAudioContext) {
    winMock.AudioContext = class {};
  }
  Object.defineProperty(globalThis, "window", {
    value: winMock,
    configurable: true,
    writable: true,
  });
}

describe("MicRecorder.isSupported", () => {
  beforeEach(() => {
    // default: no browser env
    Object.defineProperty(globalThis, "window", {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });

  it("returns false on server (no window)", () => {
    const r = new MicRecorder();
    expect(r.isSupported()).toBe(false);
  });

  it("returns false when mediaDevices missing", () => {
    setBrowserEnv({ hasMediaDevices: false, hasAudioContext: true });
    const r = new MicRecorder();
    expect(r.isSupported()).toBe(false);
  });

  it("returns false when AudioContext missing", () => {
    setBrowserEnv({ hasMediaDevices: true, hasAudioContext: false });
    const r = new MicRecorder();
    expect(r.isSupported()).toBe(false);
  });

  it("returns true when both available", () => {
    setBrowserEnv({ hasMediaDevices: true, hasAudioContext: true });
    const r = new MicRecorder();
    expect(r.isSupported()).toBe(true);
  });
});

describe("MicRecorder lifecycle", () => {
  it("isActive false before start, true after, false after stop", async () => {
    setBrowserEnv({ hasMediaDevices: true, hasAudioContext: true });

    // Stub navigator + window with working mocks for start()
    const mediaTrackMock = { stop: () => {} };
    Object.defineProperty(globalThis, "navigator", {
      value: {
        mediaDevices: {
          getUserMedia: async () => ({
            getTracks: () => [mediaTrackMock],
          }),
        },
      },
      configurable: true,
      writable: true,
    });

    class AudioContextMock {
      sampleRate = 16000;
      audioWorklet = { addModule: async (_url: string) => {} };
      createMediaStreamSource() {
        return { connect: (_n: unknown) => {} };
      }
      close() {
        return Promise.resolve();
      }
    }
    class AudioWorkletNodeMock {
      port = { onmessage: null as ((e: MessageEvent) => void) | null };
      disconnect() {}
    }
    Object.defineProperty(globalThis, "window", {
      value: { AudioContext: AudioContextMock },
      configurable: true,
      writable: true,
    });
    (globalThis as { AudioContext?: unknown }).AudioContext = AudioContextMock;
    (globalThis as { AudioWorkletNode?: unknown }).AudioWorkletNode =
      AudioWorkletNodeMock;

    const r = new MicRecorder();
    expect(r.isActive()).toBe(false);
    const result = await r.start();
    expect(r.isActive()).toBe(true);
    expect(result.sampleRate).toBe(16000);
    expect(result.stream).toBeInstanceOf(ReadableStream);

    r.stop();
    expect(r.isActive()).toBe(false);
  });

  it("start() throws when not supported", async () => {
    Object.defineProperty(globalThis, "window", {
      value: undefined,
      configurable: true,
      writable: true,
    });
    const r = new MicRecorder();
    await expect(r.start()).rejects.toThrow(/not supported/);
  });

  it("start() throws when already running", async () => {
    setBrowserEnv({ hasMediaDevices: true, hasAudioContext: true });
    class AC {
      sampleRate = 16000;
      audioWorklet = { addModule: async () => {} };
      createMediaStreamSource() {
        return { connect: () => {} };
      }
      close() {
        return Promise.resolve();
      }
    }
    class AWN {
      port = { onmessage: null };
      disconnect() {}
    }
    Object.defineProperty(globalThis, "navigator", {
      value: {
        mediaDevices: {
          getUserMedia: async () => ({ getTracks: () => [] }),
        },
      },
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "window", {
      value: { AudioContext: AC },
      configurable: true,
      writable: true,
    });
    (globalThis as { AudioContext?: unknown }).AudioContext = AC;
    (globalThis as { AudioWorkletNode?: unknown }).AudioWorkletNode = AWN;

    const r = new MicRecorder();
    await r.start();
    await expect(r.start()).rejects.toThrow(/already running/);
    r.stop();
  });
});
