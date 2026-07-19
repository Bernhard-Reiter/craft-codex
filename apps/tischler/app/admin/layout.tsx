import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";

/**
 * Root-Layout fuer /admin/* — AUSSERHALB von [locale], bewusst deutsch,
 * kein i18n. Zugang erzwingt die Middleware per HTTP Basic Auth.
 */

const jakarta = localFont({
  src: "../fonts/plus-jakarta-sans-variable.woff2",
  weight: "200 800",
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Craft Codex — Meister-Review",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={jakarta.variable}>
      <body>
        <header className="cc-header">
          <span className="cc-logo">
            Craft Codex
            <span style={{ color: "var(--cc-muted)", fontWeight: 600 }}> / Meister-Review</span>
          </span>
        </header>
        {children}
      </body>
    </html>
  );
}
