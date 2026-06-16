import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteHeader } from "../components/SiteHeader";

// Schrift = Plus Jakarta Sans (wie das VOAI-Paper-Design). Offline-Doktrin:
// vendored im Repo (OFL), kein Google-Fonts-Request — weder Build noch Laufzeit.
const jakarta = localFont({
  src: "./fonts/plus-jakarta-sans-variable.woff2",
  weight: "200 800",
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Craft Codex · Tischler — Wissenspool fürs Handwerk",
  description:
    "MR-Lerntool fürs Holzhandwerk: parametrischer Schwalbenschwanz in 3D, Meister-Antworten per Stimme (RAG, offline-fest), WebXR auf Quest 3. Open Source, MIT.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={jakarta.variable}>
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
