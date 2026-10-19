import type { Metadata } from "next";
import type { ReactElement } from "react";

/**
 * Code-Feld des Probelauf-Tors (Zeichnung b v9, Missbrauchsschutz; Schnitt S2b).
 *
 * S2b ROT: nur der Kopf. Die Seite wirft, darum sind die Code-Feld-Tests rot.
 * Das Code-Feld folgt im nächsten Commit.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {};

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TorSeite({ params }: Props): Promise<ReactElement> {
  const { locale } = await params;
  throw new Error(`S2b ROT: Tor noch nicht gebaut (Code-Feld, ${locale})`);
}
