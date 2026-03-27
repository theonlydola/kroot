"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initMixpanel, trackPageView } from "@/lib/mixpanel";

export function AnalyticsProvider({ lang }: { lang: string }) {
  const pathname = usePathname();

  useEffect(() => {
    initMixpanel();
  }, []);

  useEffect(() => {
    trackPageView(pathname, lang);
  }, [pathname, lang]);

  return null;
}
