"use client";

export type XRMode = "immersive-ar" | "immersive-vr";

export interface XRSupport {
  ar: boolean;
  vr: boolean;
  reason?: string;
}

interface XRSystem {
  isSessionSupported(mode: XRMode): Promise<boolean>;
}

interface NavigatorWithXR {
  xr?: XRSystem;
}

export async function detectXRSupport(): Promise<XRSupport> {
  if (typeof navigator === "undefined") {
    return { ar: false, vr: false, reason: "no navigator (SSR)" };
  }
  const xr = (navigator as Navigator & NavigatorWithXR).xr;
  if (!xr) {
    return { ar: false, vr: false, reason: "WebXR API not available" };
  }
  try {
    const [ar, vr] = await Promise.all([
      xr.isSessionSupported("immersive-ar").catch(() => false),
      xr.isSessionSupported("immersive-vr").catch(() => false),
    ]);
    return { ar, vr };
  } catch (e) {
    return {
      ar: false,
      vr: false,
      reason: e instanceof Error ? e.message : "unknown error",
    };
  }
}
