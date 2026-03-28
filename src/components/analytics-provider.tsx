"use client";

import { useEffect } from "react";
import { initMixpanel } from "@/lib/mixpanel";

export function AnalyticsProvider() {
  useEffect(() => {
    initMixpanel();
  }, []);

  return null;
}
