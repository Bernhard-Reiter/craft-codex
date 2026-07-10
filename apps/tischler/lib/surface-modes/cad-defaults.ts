import type { CADMode, CADModelEntry } from "./cad";

/**
 * Default GLB-Modelle fuer den CAD-Mode (Phase C MVP).
 *
 * URLs zeigen auf CC0 / public-domain Quellen. Phase D ersetzt durch
 * lizenzierte Werkstuecke aus dem INNOS / Barlieb-Material und/oder
 * eigene parametrische Schwalbenschwanz-Exports.
 *
 * NICHT auto-registriert — Caller waehlt selbst was geladen werden soll
 * (registerDefaultModels(mode) als opt-in Helper).
 */
export const DEFAULT_DOVETAIL_CAD_MODELS: ReadonlyArray<CADModelEntry> = [
  {
    url: "parametric:dovetail",
    label: "Schwalbenschwanz (parametrisch, default 5 Pins / 1:6)",
    scale: 0.01,
  },
  {
    // 1:8 = Hartholz-Winkel (Meister-Doktrin 10.07.: 1:6 Weichholz / 1:8 Hartholz).
    url: "parametric:dovetail?pinCount=7&ratio=8&width_mm=150",
    label: "Schwalbenschwanz Hartholz-Variante (7 Pins, 1:8, 150mm)",
    scale: 0.01,
  },
  {
    url: "https://threejs.org/examples/models/gltf/Duck/glTF/Duck.gltf",
    label: "Duck (three.js demo, public domain)",
    scale: 0.01,
  },
  {
    url: "https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf",
    label: "Damaged Helmet (Khronos sample, CC-BY 4.0)",
    scale: 0.5,
  },
] as const;

export interface RegisterOptions {
  /** Wenn true, fehlt-stille Mode-Mehrfach-Registrierung. Default: false. */
  ignoreDuplicates?: boolean;
}

/**
 * Registriert alle Default-Modelle in einer CADMode-Instanz.
 *
 * Idempotent: ruft `mode.listModels()` zuerst und ueberspringt bereits
 * vorhandene URLs (verhindert duplicate-key-Collisionen bei Re-Mount).
 */
export function registerDefaultModels(
  mode: CADMode,
  options: RegisterOptions = {},
): { registered: number; skipped: number } {
  const existingUrls = new Set(mode.listModels().map((m) => m.url));
  let registered = 0;
  let skipped = 0;

  for (const entry of DEFAULT_DOVETAIL_CAD_MODELS) {
    if (existingUrls.has(entry.url)) {
      skipped += 1;
      continue;
    }
    mode.registerModel(entry);
    registered += 1;
  }

  if (!options.ignoreDuplicates && skipped > 0) {
    console.debug(
      `[cad-defaults] skipped ${skipped} already-registered models`,
    );
  }

  return { registered, skipped };
}
