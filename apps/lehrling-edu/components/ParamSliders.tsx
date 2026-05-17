"use client";

import type { DovetailParams } from "@voai/lehrlings-core";

interface ParamSlidersProps {
  params: DovetailParams;
  onChange: (next: DovetailParams) => void;
}

interface SliderConfig {
  key: keyof DovetailParams;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

const SLIDERS: SliderConfig[] = [
  { key: "pinCount", label: "Pin-Anzahl", min: 1, max: 12, step: 1 },
  { key: "ratio", label: "Schwalbenwinkel 1:N", min: 4, max: 10, step: 0.5 },
  {
    key: "thickness_mm",
    label: "Brettstaerke",
    min: 8,
    max: 40,
    step: 1,
    unit: "mm",
  },
  {
    key: "width_mm",
    label: "Brettbreite",
    min: 50,
    max: 300,
    step: 5,
    unit: "mm",
  },
];

export function ParamSliders({ params, onChange }: ParamSlidersProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        padding: "1rem",
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
      }}
    >
      {SLIDERS.map((cfg) => {
        const value = params[cfg.key] as number;
        return (
          <label
            key={cfg.key}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.85rem",
                color: "var(--color-muted)",
              }}
            >
              <span>{cfg.label}</span>
              <span style={{ color: "var(--color-fg)" }}>
                {value}
                {cfg.unit ? ` ${cfg.unit}` : ""}
              </span>
            </div>
            <input
              type="range"
              min={cfg.min}
              max={cfg.max}
              step={cfg.step}
              value={value}
              onChange={(e) =>
                onChange({ ...params, [cfg.key]: Number(e.target.value) })
              }
              style={{ width: "100%" }}
            />
          </label>
        );
      })}
    </div>
  );
}
