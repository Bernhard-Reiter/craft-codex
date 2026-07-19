"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Session } from "@supabase/supabase-js";
import { getBrowserSupabase } from "../../../lib/supabase/browser";
import {
  buildSubmitPayload,
  CONTRIBUTION_TOPICS,
} from "../../../lib/contributions/submit";
import { SiteFooter } from "../../../components/SiteFooter";
import { submitContribution, type SubmitContributionResult } from "./actions";

/**
 * /beitragen — ein Tischler tippt sein Wissen in ein Formular.
 * Nicht eingeloggt: Magic-Link-Karte (signInWithOtp, kein Passwort).
 * Eingeloggt: Formular; Submit laeuft als Server-Action ueber den RLS-Pfad.
 */

interface SourceRow {
  citation: string;
  url: string;
  page: string;
}

const EMPTY_SOURCE: SourceRow = { citation: "", url: "", page: "" };

type AuthState =
  | { kind: "loading" }
  | { kind: "unconfigured" }
  | { kind: "anonymous" }
  | { kind: "authed"; session: Session };

export default function BeitragenPage() {
  const t = useTranslations("contribute");
  const locale = useLocale();
  const [auth, setAuth] = useState<AuthState>({ kind: "loading" });

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setAuth({ kind: "unconfigured" });
      return;
    }
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setAuth(data.session ? { kind: "authed", session: data.session } : { kind: "anonymous" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth(session ? { kind: "authed", session } : { kind: "anonymous" });
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <main className="cc-page" style={{ paddingBottom: "3rem" }}>
        <p className="cc-kicker">{t("kicker")}</p>
        <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", marginTop: "0.5rem" }}>
          {t("title")}
        </h1>
        <p className="cc-lead" style={{ maxWidth: "60ch", marginTop: "0.8rem" }}>
          {t("intro")}
        </p>

        {auth.kind === "loading" && <p className="cc-muted">{t("loading")}</p>}
        {auth.kind === "unconfigured" && (
          <div className="cc-note" role="alert" style={{ marginTop: "1.5rem" }}>
            {t("unconfigured")}
          </div>
        )}
        {auth.kind === "anonymous" && <LoginCard locale={locale} />}
        {auth.kind === "authed" && <ContributionForm session={auth.session} />}
      </main>
      <SiteFooter />
    </>
  );
}

function LoginCard({ locale }: { locale: string }) {
  const t = useTranslations("contribute.login");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setState("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/${locale}/beitragen`,
      },
    });
    setState(error ? "error" : "sent");
  }

  return (
    <div className="cc-card" style={{ maxWidth: "32rem", marginTop: "2rem", padding: "1.5rem" }}>
      <h2 style={{ fontSize: "1.15rem" }}>{t("title")}</h2>
      <p className="cc-muted" style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
        {t("hint")}
      </p>
      {state === "sent" ? (
        <p className="cc-note" style={{ marginTop: "1rem" }} role="status">
          {t("sent")}
        </p>
      ) : (
        <form onSubmit={sendLink} style={{ display: "flex", gap: "0.6rem", marginTop: "1rem" }}>
          <input
            className="cc-input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            aria-label={t("emailLabel")}
          />
          <button className="cc-btn cc-btn--primary" type="submit" disabled={state === "sending"}>
            {state === "sending" ? t("sending") : t("send")}
          </button>
        </form>
      )}
      {state === "error" && (
        <p role="alert" style={{ color: "var(--cc-bad)", marginTop: "0.75rem", fontSize: "0.9rem" }}>
          {t("error")}
        </p>
      )}
    </div>
  );
}

function ContributionForm({ session }: { session: Session }) {
  const t = useTranslations("contribute.form");
  const tThanks = useTranslations("contribute.thanks");
  const tErrors = useTranslations("contribute.errors");
  const [title, setTitle] = useState("");
  const [bodyMd, setBodyMd] = useState("");
  const [topic, setTopic] = useState<string>("allgemein");
  const [sources, setSources] = useState<SourceRow[]>([{ ...EMPTY_SOURCE }]);
  const [licenseAccepted, setLicenseAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitContributionResult | null>(null);

  const updateSource = useCallback(
    (index: number, field: keyof SourceRow, value: string) => {
      setSources((prev) =>
        prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
      );
    },
    [],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!licenseAccepted || submitting) return;
    setSubmitting(true);
    setResult(null);
    const payload = buildSubmitPayload({
      title,
      body_md: bodyMd,
      topic,
      sources,
      licenseAccepted,
    });
    const res = await submitContribution(session.access_token, payload);
    setResult(res);
    setSubmitting(false);
  }

  function resetForm() {
    setTitle("");
    setBodyMd("");
    setTopic("allgemein");
    setSources([{ ...EMPTY_SOURCE }]);
    setLicenseAccepted(false);
    setResult(null);
  }

  async function signOut() {
    await getBrowserSupabase()?.auth.signOut();
  }

  if (result?.ok) {
    return (
      <div className="cc-card" style={{ maxWidth: "36rem", marginTop: "2rem", padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1.3rem" }}>{tThanks("title")}</h2>
        <p style={{ marginTop: "0.6rem", lineHeight: 1.55 }}>{tThanks("body")}</p>
        <dl style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
          <dt className="cc-muted">{tThanks("idLabel")}</dt>
          <dd className="cc-mono" style={{ margin: "0.15rem 0 0.6rem" }}>{result.id}</dd>
          <dt className="cc-muted">{tThanks("statusLabel")}</dt>
          <dd style={{ margin: "0.15rem 0 0" }}>
            <span className="cc-badge cc-badge--yellow">{result.status}</span>
          </dd>
        </dl>
        <button className="cc-btn" style={{ marginTop: "1.25rem" }} onClick={resetForm}>
          {tThanks("again")}
        </button>
      </div>
    );
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontWeight: 600,
    fontSize: "0.85rem",
    marginBottom: "0.35rem",
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "44rem", marginTop: "2rem" }}>
      <p className="cc-muted" style={{ fontSize: "0.85rem" }}>
        {t("signedInAs", { email: session.user.email ?? "" })}{" "}
        <button type="button" className="cc-btn cc-btn--sm" onClick={signOut} style={{ marginLeft: "0.5rem" }}>
          {t("signOut")}
        </button>
      </p>

      <div style={{ marginTop: "1.25rem" }}>
        <label style={labelStyle} htmlFor="cb-title">{t("titleLabel")}</label>
        <input
          id="cb-title"
          className="cc-input"
          style={{ width: "100%" }}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={3}
          maxLength={200}
        />
      </div>

      <div style={{ marginTop: "1.1rem" }}>
        <label style={labelStyle} htmlFor="cb-body">{t("bodyLabel")}</label>
        <textarea
          id="cb-body"
          className="cc-input"
          style={{ width: "100%", minHeight: "14rem", resize: "vertical", lineHeight: 1.55 }}
          value={bodyMd}
          onChange={(e) => setBodyMd(e.target.value)}
          required
          minLength={20}
          placeholder={t("bodyPlaceholder")}
        />
        <p className="cc-muted" style={{ fontSize: "0.78rem", marginTop: "0.3rem" }}>{t("bodyHint")}</p>
      </div>

      <div style={{ marginTop: "1.1rem" }}>
        <label style={labelStyle} htmlFor="cb-topic">{t("topicLabel")}</label>
        <select
          id="cb-topic"
          className="cc-input"
          style={{ width: "100%" }}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        >
          {CONTRIBUTION_TOPICS.map((value) => (
            <option key={value} value={value}>
              {t(`topics.${value}`)}
            </option>
          ))}
        </select>
      </div>

      <fieldset style={{ marginTop: "1.1rem", border: "1px solid var(--cc-hair)", borderRadius: "var(--cc-radius)", padding: "1rem" }}>
        <legend style={{ fontWeight: 600, fontSize: "0.85rem", padding: "0 0.4rem" }}>
          {t("sourcesLabel")}
        </legend>
        <p className="cc-muted" style={{ fontSize: "0.78rem", margin: "0 0 0.75rem" }}>{t("sourcesHint")}</p>
        {sources.map((source, i) => (
          <div key={i} style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.6rem" }}>
            <input
              className="cc-input"
              style={{ flex: "2 1 14rem" }}
              value={source.citation}
              onChange={(e) => updateSource(i, "citation", e.target.value)}
              placeholder={t("citationPlaceholder")}
              aria-label={t("citationLabel")}
              required
              minLength={3}
            />
            <input
              className="cc-input"
              style={{ flex: "2 1 10rem" }}
              type="url"
              value={source.url}
              onChange={(e) => updateSource(i, "url", e.target.value)}
              placeholder={t("urlPlaceholder")}
              aria-label={t("urlLabel")}
            />
            <input
              className="cc-input"
              style={{ flex: "0 1 5.5rem" }}
              type="number"
              min={1}
              value={source.page}
              onChange={(e) => updateSource(i, "page", e.target.value)}
              placeholder={t("pagePlaceholder")}
              aria-label={t("pageLabel")}
            />
            {sources.length > 1 && (
              <button
                type="button"
                className="cc-btn cc-btn--sm"
                onClick={() => setSources((prev) => prev.filter((_, j) => j !== i))}
                aria-label={t("removeSource")}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="cc-btn cc-btn--sm"
          onClick={() => setSources((prev) => [...prev, { ...EMPTY_SOURCE }])}
        >
          {t("addSource")}
        </button>
      </fieldset>

      <div className="cc-note" style={{ marginTop: "1.25rem" }}>
        <label style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={licenseAccepted}
            onChange={(e) => setLicenseAccepted(e.target.checked)}
            style={{ marginTop: "0.2rem", accentColor: "var(--cc-yellow-deep)" }}
          />
          <span>
            <strong>{t("licenseLabel")}</strong>
            <br />
            <span style={{ fontSize: "0.88rem" }}>{t("licenseText")}</span>
          </span>
        </label>
      </div>

      {result && !result.ok && (
        <p role="alert" style={{ color: "var(--cc-bad)", marginTop: "1rem", fontSize: "0.9rem" }}>
          {tErrors(result.error ?? "server")}
          {result.issues && result.issues.length > 0 && (
            <span className="cc-mono" style={{ display: "block", fontSize: "0.78rem", marginTop: "0.3rem" }}>
              {result.issues.join(" · ")}
            </span>
          )}
        </p>
      )}

      <button
        className="cc-btn cc-btn--primary"
        type="submit"
        disabled={!licenseAccepted || submitting}
        style={{ marginTop: "1.25rem" }}
      >
        {submitting ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
