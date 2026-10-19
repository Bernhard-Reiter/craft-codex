/**
 * Tor-Route der Werkbank (Zeichnung b v9, Missbrauchsschutz; Schnitt S2b, ohne DB).
 *
 * S2b ROT: nur die Köpfe. Beide werfen, darum sind die Route-Tests rot.
 * Die Route folgt im nächsten Commit.
 */
export const dynamic = "force-dynamic";

const ROT = "S2b ROT: Tor noch nicht gebaut";

export async function POST(req: Request): Promise<Response> {
  throw new Error(`${ROT} (POST, ${req.method})`);
}

export function GET(): Response {
  throw new Error(`${ROT} (GET)`);
}
