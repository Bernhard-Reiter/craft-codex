import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Alles außer API-Routen, Next-Interna und statischen Dateien (mit Punkt).
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
