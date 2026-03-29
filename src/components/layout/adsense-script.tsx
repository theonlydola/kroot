"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Allowlist of route patterns where AdSense Auto Ads may load.
 * Only content-rich pages should be listed here.
 * Pattern: each regex is tested against the full pathname.
 */
const AD_ALLOWED_PATTERNS = [
  /^\/[a-z]{2}$/, // Home pages: /en, /ar
  /^\/[a-z]{2}\/games\/[^/]+$/, // Game play pages: /en/games/imposter (NOT /online/*)
];

function isAdAllowed(pathname: string): boolean {
  return AD_ALLOWED_PATTERNS.some((pattern) => pattern.test(pathname));
}

/**
 * Dynamically loads/unloads the AdSense script based on the current route.
 * This prevents ads from persisting on low-content pages during SPA navigation.
 */
export function AdSenseScript() {
  const pathname = usePathname();
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (!clientId) return;

    const allowed = isAdAllowed(pathname);

    if (allowed) {
      // Only add the script if it's not already present
      if (!scriptRef.current) {
        const existing = document.querySelector(
          `script[src*="adsbygoogle.js"]`
        );
        if (existing) {
          scriptRef.current = existing as HTMLScriptElement;
        } else {
          const script = document.createElement("script");
          script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
          script.async = true;
          script.crossOrigin = "anonymous";
          document.head.appendChild(script);
          scriptRef.current = script;
        }
      }
    } else {
      // Remove the AdSense script on non-content pages
      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }
      // Remove any auto-ad containers injected by AdSense
      document
        .querySelectorAll(
          'ins.adsbygoogle[data-ad-status], iframe[id^="aswift_"], iframe[id^="google_ads_"]'
        )
        .forEach((el) => el.remove());
      // Remove leftover AdSense styling/containers
      document
        .querySelectorAll(
          'div[id^="google_ads_"], div.google-auto-placed, div[data-google-query-id]'
        )
        .forEach((el) => el.remove());
    }
  }, [pathname, clientId]);

  return null;
}
