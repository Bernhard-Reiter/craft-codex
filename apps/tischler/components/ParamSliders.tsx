"use client";

import { useTranslations } from "next-intl";
import type { DovetailParams } from "@craft-codex/core";

interface ParamSlidersProps {
  params: DovetailParams;
  onChange: (next: DovetailParams) => void;
}

interface SliderConfig {
  key: keyof DovetailParams;
  /** Message-Key unter dovetail.paramSliders.* */
  labelKey: "pinCount" | "ratio" | "thickness" | "width";
  min: number;
  max: number;
  step: number;
  unit?: string;
}

const SLIDERS: SliderConfig[] = [
  { key: "pinCount", labelKey: "pinCount", min: 1, max: 12, step: 1 },
  { key: "ratio", labelKey: "ratio", min: 4, max: 10, step: 0.5 },
  {
    key: "thickness_mm",
    labelKey: "thickness",
    min: 8,
    max: 40,
    step: 1,
    unit: "mm",
  },
  {
    key: "width_mm",
    labelKey: "width",
    min: 50,
    max: 300,
    step: 5,
    unit: "mm",
  },
];

export function ParamSliders({ params, onChange }: ParamSlidersProps) {
  const t = useTranslations("dovetail.paramSliders");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
      {SLIDERS.map((cfg) => {
        const value = params[cfg.key] as number;
        return (
          <label
            key={cfg.key}
            style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                fontSize: "0.8rem",
              }}
            >
              <span className="cc-muted" style={{ fontWeight: 600 }}>
                {t(cfg.labelKey)}
              </span>
              <span className="cc-mono" style={{ fontWeight: 700 }}>
                {value}
                {cfg.unit ? ` ${cfg.unit}` : ""}
              </span>
            </div>
            <input
              type="range"
              className="cc-range"
              min={cfg.min}
              max={cfg.max}
              step={cfg.step}
              value={value}
              onChange={(e) =>
                onChange({ ...params, [cfg.key]: Number(e.target.value) })
              }
            />
          </label>
        );
      })}
    </div>
  );
}
