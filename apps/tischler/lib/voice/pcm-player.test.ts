import { describe, it, expect } from "vitest";
import { canPlayAudio, playPcmChunks } from "./pcm-player";

// node-Env: kein window/AudioContext → die Stimm-Wiedergabe muss sauber
// no-oppen (false zurückgeben), nicht crashen. Das ist die „Demo bleibt
// still, aber bricht nie"-Garantie für Offline/SSR/Insecure-Context.
describe("pcm-player (ohne AudioContext)", () => {
  it("canPlayAudio ist false ohne AudioContext", () => {
    expect(canPlayAudio()).toBe(false);
  });

  it("playPcmChunks gibt false zurück statt zu werfen", async () => {
    expect(await playPcmChunks([])).toBe(false);
    expect(
      await playPcmChunks([{ audio: new Uint8Array([0, 0]), sampleRate: 24000 }]),
    ).toBe(false);
  });
});
