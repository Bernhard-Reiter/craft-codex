import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lehrling-Edu — MR-Lehrtool für Holzhandwerk",
  description:
    "Standalone WebXR Lehrlings-Lehrtool für Holzhandwerk (Schwalbenschwanz, Tafel, CAD).",
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
