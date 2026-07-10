import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/** Ein Message-File pro Seite/Bereich — Namespace = Dateiname. */
const NAMESPACES = [
  "common",
  "home",
  "learn",
  "workshop",
  "cockpit",
  "universe",
  "dovetail",
  "voice",
  "xr",
] as const;

async function loadMessages(locale: string) {
  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => [
      ns,
      (await import(`../messages/${locale}/${ns}.json`)).default,
    ]),
  );
  return Object.fromEntries(entries);
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
