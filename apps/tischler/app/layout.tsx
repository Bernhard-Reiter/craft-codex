import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tischler · Craft Codex",
  description:
    "Cabinetmaker (Tischler) tutor app — first workpiece: dovetail joint (Schwalbenschwanz). Voice + hologram + master-surface, MIT.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
