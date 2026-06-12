import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteHeader } from "../components/SiteHeader";

// Offline-Doktrin: Outfit liegt vendored im Repo — kein Google-Fonts-Request,
// weder beim Build noch zur Laufzeit. Variable Font 100–900, latin.
const outfit = localFont({
  src: "./fonts/outfit-variable.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-outfit",
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
    <html lang="de" className={outfit.variable}>
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
