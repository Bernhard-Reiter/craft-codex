/**
 * Logo-Mark: stilisierter Schwalbenschwanz-Querschnitt — zwei schwarze
 * Zinken greifen in die gelbe Fläche. Rein dekorativ (aria-hidden),
 * der Wortlaut „Craft Codex" steht immer daneben.
 */
export function DovetailMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" fill="#ffed00" />
      <path
        d="M32 0 H19 V3 L11 6 V12 L19 15 V17 L11 20 V26 L19 29 V32 H32 Z"
        fill="#0a0a0a"
      />
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        fill="none"
        stroke="#0a0a0a"
        strokeWidth="2"
      />
    </svg>
  );
}
