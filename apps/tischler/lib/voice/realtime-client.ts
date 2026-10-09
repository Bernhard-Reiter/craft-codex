/**
 * Browser-Client fuer die Live-Sprache mit dem Meister (OpenAI Realtime ueber
 * WebRTC, Lienz-Demo). Der Browser ist Dispatcher fuer das Werkzeug
 * "suche_wissen": Function-Call kommt ueber den DataChannel, das Ergebnis holt
 * er von /api/voice/realtime/wissen und schickt es als function_call_output
 * zurueck.
 */

import type { WissensAntwort, WissensTreffer } from "./wissen-suche";
import { WIKIPEDIA_TOOL_NAME, WISSEN_TOOL_NAME, type RealtimeThema } from "./realtime-config";

/** Werkzeug → eigene Server-Route (feste Liste; Unbekanntes wird abgewiesen). */
export const WERKZEUG_ROUTEN: Readonly<Record<string, string>> = {
  [WISSEN_TOOL_NAME]: "/api/voice/realtime/wissen",
  [WIKIPEDIA_TOOL_NAME]: "/api/voice/realtime/wikipedia",
};
import type { VoiceLocale } from "./voice-locale";

export type LiveStatus = "bereit" | "verbinde" | "hoert" | "spricht" | "denkt" | "beendet" | "fehler";

export interface LiveCallbacks {
  onStatus(status: LiveStatus): void;
  /** Laufender Text des Meisters (je Antwort-Item). */
  onMeisterText(itemId: string, text: string, fertig: boolean): void;
  /** Was der Lehrling gesagt hat (nur wenn Transkription aktiv). */
  onLehrlingText(itemId: string, text: string): void;
  onQuellen(treffer: WissensTreffer[]): void;
  onFehler(meldung: string): void;
  onRestzeit(ms: number): void;
}

interface FunctionCallItem {
  type: "function_call";
  name: string;
  call_id: string;
  arguments: string;
}

export const REALTIME_CALLS_URL = "https://api.openai.com/v1/realtime/calls";

/** Function-Calls aus einem response.done-Ereignis (pure, testbar). */
export function functionCallsAus(ereignis: unknown): FunctionCallItem[] {
  const resp = (ereignis as { response?: { status?: string; output?: unknown[] } }).response;
  if (!resp || resp.status === "cancelled" || !Array.isArray(resp.output)) return [];
  return resp.output.filter(
    (o): o is FunctionCallItem =>
      !!o &&
      (o as FunctionCallItem).type === "function_call" &&
      typeof (o as FunctionCallItem).call_id === "string" &&
      typeof (o as FunctionCallItem).name === "string",
  );
}

/** Argumente des Werkzeugs sicher lesen. */
export function frageAusArgumenten(args: string): string | null {
  try {
    const v = JSON.parse(args) as { frage?: unknown };
    return typeof v.frage === "string" && v.frage.trim().length > 0 ? v.frage.trim().slice(0, 300) : null;
  } catch {
    return null;
  }
}

export class MeisterLive {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private mic: MediaStream | null = null;
  private audio: HTMLAudioElement | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private deadline = 0;
  private erledigteCalls = new Set<string>();
  private meisterText = new Map<string, string>();
  private aktiv = false;

  constructor(
    private readonly cb: LiveCallbacks,
    private readonly locale: VoiceLocale,
    private readonly thema: RealtimeThema,
  ) {}

  /** MUSS aus einem Klick heraus gerufen werden (Mikrofon + Audio-Wiedergabe, iOS). */
  async start(): Promise<void> {
    if (this.aktiv) return;
    this.aktiv = true;
    this.cb.onStatus("verbinde");
    try {
      // 1) Mikrofon + Audio-Element sofort im Klick (iOS-Autoplay-Regel).
      this.audio = new Audio();
      this.audio.autoplay = true;
      this.mic = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });

      // 2) Kurzzeit-Schluessel vom eigenen Server.
      const tRes = await fetch("/api/voice/realtime/token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale: this.locale, thema: this.thema }),
      });
      if (!tRes.ok) throw new Error(`token_${tRes.status}`);
      const { token, maxSessionMs } = (await tRes.json()) as { token: string; maxSessionMs: number };
      if (!this.aktiv) return this.aufraeumen();

      // 3) WebRTC: Mikrofon rein, Meister-Stimme raus, Ereignisse ueber "oai-events".
      const pc = new RTCPeerConnection();
      this.pc = pc;
      pc.ontrack = (e) => {
        if (this.audio) {
          this.audio.srcObject = e.streams[0] ?? null;
          void this.audio.play().catch(() => undefined);
        }
      };
      for (const track of this.mic.getAudioTracks()) pc.addTrack(track, this.mic);
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          if (this.aktiv) this.fehler("verbindung_abgebrochen");
        }
      };
      const dc = pc.createDataChannel("oai-events");
      this.dc = dc;
      dc.onmessage = (m) => this.ereignis(m.data);
      dc.onopen = () => {
        this.cb.onStatus("hoert");
        // Kurze Begruessung, damit man hoert, dass es laeuft.
        this.senden({
          type: "response.create",
          response: {
            instructions:
              this.locale === "de"
                ? "Begrüße den Lehrling in einem kurzen Satz und frag, woran er gerade arbeitet."
                : "Greet the apprentice in one short sentence and ask what they are working on.",
          },
        });
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const sdpRes = await fetch(REALTIME_CALLS_URL, {
        method: "POST",
        body: offer.sdp ?? "",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/sdp" },
      });
      if (!sdpRes.ok) throw new Error(`calls_${sdpRes.status}`);
      await pc.setRemoteDescription({ type: "answer", sdp: await sdpRes.text() });

      // 4) Harte Obergrenze je Sitzung.
      this.deadline = Date.now() + (maxSessionMs || 600_000);
      this.timer = setInterval(() => {
        const rest = this.deadline - Date.now();
        this.cb.onRestzeit(Math.max(0, rest));
        if (rest <= 0) this.stop();
      }, 1000);
    } catch (e) {
      this.fehler(e instanceof Error ? e.message : "start_fehlgeschlagen");
    }
  }

  stop(): void {
    if (!this.aktiv) return;
    this.aufraeumen();
    this.cb.onStatus("beendet");
  }

  private fehler(code: string): void {
    this.aufraeumen();
    this.cb.onFehler(code);
    this.cb.onStatus("fehler");
  }

  private aufraeumen(): void {
    this.aktiv = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    try {
      this.dc?.close();
    } catch {
      /* egal */
    }
    try {
      this.pc?.close();
    } catch {
      /* egal */
    }
    this.mic?.getTracks().forEach((t) => t.stop());
    if (this.audio) {
      this.audio.pause();
      this.audio.srcObject = null;
    }
    this.dc = null;
    this.pc = null;
    this.mic = null;
  }

  private senden(obj: unknown): void {
    if (this.dc?.readyState === "open") this.dc.send(JSON.stringify(obj));
  }

  private ereignis(raw: unknown): void {
    let e: { type?: string; [k: string]: unknown };
    try {
      e = JSON.parse(String(raw)) as typeof e;
    } catch {
      return;
    }
    switch (e.type) {
      case "input_audio_buffer.speech_started":
        this.cb.onStatus("hoert");
        break;
      case "input_audio_buffer.speech_stopped":
        this.cb.onStatus("denkt");
        break;
      case "output_audio_buffer.started":
        this.cb.onStatus("spricht");
        break;
      case "output_audio_buffer.stopped":
        this.cb.onStatus("hoert");
        break;
      case "response.output_audio_transcript.delta": {
        const id = String(e.item_id ?? "");
        const neu = (this.meisterText.get(id) ?? "") + String(e.delta ?? "");
        this.meisterText.set(id, neu);
        this.cb.onMeisterText(id, neu, false);
        break;
      }
      case "response.output_audio_transcript.done": {
        const id = String(e.item_id ?? "");
        const text = String(e.transcript ?? this.meisterText.get(id) ?? "");
        this.meisterText.set(id, text);
        this.cb.onMeisterText(id, text, true);
        break;
      }
      case "conversation.item.input_audio_transcription.completed":
        this.cb.onLehrlingText(String(e.item_id ?? ""), String(e.transcript ?? ""));
        break;
      case "response.done":
        void this.werkzeuge(e);
        break;
      case "error": {
        const err = e.error as { message?: string; code?: string } | undefined;
        // Nicht fatal (z. B. Antwort schon abgebrochen) — anzeigen, weiterlaufen.
        console.warn("[realtime]", err?.code, err?.message);
        break;
      }
      default:
        break;
    }
  }

  private async werkzeuge(ereignis: unknown): Promise<void> {
    const calls = functionCallsAus(ereignis).filter((c) => !this.erledigteCalls.has(c.call_id));
    if (calls.length === 0) return;
    this.cb.onStatus("denkt");
    for (const call of calls) {
      this.erledigteCalls.add(call.call_id);
      let output: WissensAntwort | { ok: false; error: string };
      const route = Object.prototype.hasOwnProperty.call(WERKZEUG_ROUTEN, call.name) ? WERKZEUG_ROUTEN[call.name] : null;
      const frage = route ? frageAusArgumenten(call.arguments) : null;
      if (!route || !frage) {
        output = { ok: false, error: route ? "ungueltige_frage" : "unbekanntes_werkzeug" };
      } else {
        try {
          const r = await fetch(route, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ frage, locale: this.locale }),
            signal: AbortSignal.timeout(12000),
          });
          output = r.ok ? ((await r.json()) as WissensAntwort) : { ok: false, error: `suche_${r.status}` };
        } catch {
          output = { ok: false, error: "suche_timeout" };
        }
        if (output.ok) this.cb.onQuellen(output.treffer);
      }
      if (!this.aktiv) return;
      this.senden({
        type: "conversation.item.create",
        item: { type: "function_call_output", call_id: call.call_id, output: JSON.stringify(output) },
      });
    }
    if (this.aktiv) this.senden({ type: "response.create" });
  }
}
