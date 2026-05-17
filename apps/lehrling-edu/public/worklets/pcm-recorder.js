/* eslint-disable */
/**
 * PCM-Recorder AudioWorkletProcessor.
 *
 * Konvertiert Float32 Audio-Samples zu Int16 PCM little-endian und postet
 * sie an den Main-Thread. Wird vom MicRecorder (lib/voice/mic-recorder.ts)
 * geladen via audioContext.audioWorklet.addModule("/worklets/pcm-recorder.js").
 *
 * NICHT als TS — wird direkt vom Browser als ES-Module geladen, kein
 * Bundling. Keep raw JS.
 *
 * Phase D: ggf. Resampling auf 16 kHz (Whisper-Standard) hier statt im
 * Main-Thread.
 */
class PCMRecorderProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channel = input[0];
    if (!channel || channel.length === 0) return true;

    // Float32 [-1, 1] → Int16 [-32768, 32767]
    const pcm = new Int16Array(channel.length);
    for (let i = 0; i < channel.length; i++) {
      let s = channel[i];
      if (s > 1) s = 1;
      else if (s < -1) s = -1;
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    this.port.postMessage(pcm.buffer, [pcm.buffer]);
    return true;
  }
}

registerProcessor("pcm-recorder", PCMRecorderProcessor);
