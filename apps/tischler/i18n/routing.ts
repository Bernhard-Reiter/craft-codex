import { defineRouting } from "next-intl/routing";

/**
 * Locale-Routing: /de (Default) + /en, Prefix immer sichtbar.
 * Unprefixte Alt-URLs (z.B. /dovetail) leitet die Middleware per
 * Accept-Language auf die passende Locale um — alte Deeplinks bleiben gültig.
 */
export const routing = defineRouting({
  locales: ["de", "en"],
  defaultLocale: "de",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];
