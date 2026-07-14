import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-bewusste Drop-in-Ersatzteile für next/link & next/navigation.
 * Href bleibt ohne Prefix ("/lernen") — der Locale-Prefix kommt automatisch.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
