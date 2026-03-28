import mixpanel from "mixpanel-browser";

const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

let initialized = false;

const isLocalhost =
  typeof window !== "undefined" && window.location.hostname === "localhost";

export function initMixpanel() {
  if (initialized || !token || isLocalhost) return;
  mixpanel.init(token, {
    persistence: "localStorage",
    api_host: "https://api-eu.mixpanel.com",
    debug: process.env.NODE_ENV === "development",
  });
  initialized = true;
}

export function trackPageView(page: string, lang: string) {
  if (!token || isLocalhost) return;
  initMixpanel();
  mixpanel.track("Page View", { page, lang });
}

export function trackGameStart(slug: string, lang: string) {
  if (isLocalhost) return;
  mixpanel.track("Game Start", { game: slug, lang });
}

export function trackGamePlayersNumber(slug: string, players: number) {
  if (isLocalhost) return;
  mixpanel.track("Game Players Number", { game: slug, players });
}
