"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DovetailMark } from "./DovetailMark";

const LINKS: Array<{ href: string; label: string }> = [
  { href: "/", label: "Start" },
  { href: "/lernen", label: "Überblick" },
  { href: "/dovetail", label: "Werkstatt" },
  { href: "/voice", label: "Stimme" },
  { href: "/dovetail/xr", label: "XR" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="cc-header">
      <Link href="/" className="cc-logo">
        <DovetailMark />
        <span>
          Craft Codex
          <span style={{ color: "var(--cc-muted)", fontWeight: 600 }}>
            {" "}
            / Tischler
          </span>
        </span>
      </Link>
      <nav className="cc-nav" aria-label="Hauptnavigation">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={pathname === l.href ? "page" : undefined}
          >
            {l.label}
          </Link>
        ))}
        <a
          href="https://github.com/Bernhard-Reiter/craft-codex"
          target="_blank"
          rel="noreferrer"
        >
          GitHub ↗
        </a>
      </nav>
    </header>
  );
}
