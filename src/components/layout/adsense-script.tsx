"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";

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

export function AdSenseScript() {
  const pathname = usePathname();
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  if (!clientId || !isAdAllowed(pathname)) return null;

  return (
    <Script
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  );
}
