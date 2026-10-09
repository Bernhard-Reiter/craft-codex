"use client";

import { useLocale } from "next-intl";
import { useState } from "react";

const TEXT = {
  de: {
    kicker: "Demo-Zugang",
    h1: "Zugangscode",
    intro: "Diese Vorschau ist geschützt. Bitte den Zugangscode eingeben.",
    label: "Zugangscode",
    button: "Weiter",
    falsch: "Der Code stimmt nicht.",
    zuViele: "Zu viele Versuche. Bitte in ein paar Minuten nochmal.",
    fehler: "Zugang gerade nicht möglich.",
  },
  en: {
    kicker: "Demo access",
    h1: "Access code",
    intro: "This preview is protected. Please enter the access code.",
    label: "Access code",
    button: "Continue",
    falsch: "That code is not correct.",
    zuViele: "Too many attempts. Please try again in a few minutes.",
    fehler: "Access is not possible right now.",
  },
} as const;

export default function ZugangPage() {
  const t = TEXT[useLocale() === "en" ? "en" : "de"];
  const [pin, setPin] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [laeuft, setLaeuft] = useState(false);

  async function absenden(e: React.FormEvent) {
    e.preventDefault();
    setLaeuft(true);
    setFehler(null);
    const ziel = new URLSearchParams(window.location.search).get("ziel") ?? undefined;
    try {
      const res = await fetch("/api/zugang", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pin, ziel }),
      });
      if (res.ok) {
        const data = (await res.json()) as { ziel: string };
        window.location.assign(data.ziel);
        return;
      }
      setFehler(res.status === 401 ? t.falsch : res.status === 429 ? t.zuViele : t.fehler);
    } catch {
      setFehler(t.fehler);
    }
    setLaeuft(false);
  }

  return (
    <main className="cc-page" style={{ maxWidth: 480 }}>
      <p className="cc-kicker">{t.kicker}</p>
      <h1 style={{ margin: "0.5rem 0 0.75rem", fontSize: "2rem", textTransform: "uppercase" }}>{t.h1}</h1>
      <p className="cc-muted" style={{ lineHeight: 1.6 }}>{t.intro}</p>
      <form onSubmit={absenden} style={{ display: "grid", gap: "0.75rem", marginTop: "1.25rem" }}>
        <label htmlFor="zugang-pin" style={{ fontWeight: 600 }}>{t.label}</label>
        <input
          id="zugang-pin"
          className="cc-input"
          type="password"
          autoComplete="off"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />
        <button className="cc-btn cc-btn--primary" type="submit" disabled={laeuft || pin.length === 0}>
          {t.button}
        </button>
        {fehler ? (
          <p role="alert" style={{ color: "var(--cc-bad)", margin: 0 }}>{fehler}</p>
        ) : null}
      </form>
    </main>
  );
}
