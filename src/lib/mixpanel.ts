import mixpanel from "mixpanel-browser";

const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

let initialized = false;

export function initMixpanel() {
  if (initialized || !token) return;
  mixpanel.init(token, {
    persistence: "localStorage",
    api_host: "https://api-eu.mixpanel.com",
    debug: process.env.NODE_ENV === "development",
  });
  initialized = true;
}

export function trackPageView(page: string, lang: string) {
  if (!token) return;
  initMixpanel();
  mixpanel.track("Page View", { page, lang });
}

export function trackGameStart(slug: string, lang: string) {
  if (!token) return;
  initMixpanel();
  mixpanel.track("Game Start", { game: slug, lang });
}

export function trackCardView(slug: string, cardIndex: number) {
  if (!token) return;
  initMixpanel();
  mixpanel.track("Card View", { game: slug, cardIndex });
}

export function trackThemeChange(theme: string) {
  if (!token) return;
  initMixpanel();
  mixpanel.track("Theme Change", { theme });
}

export function trackLanguageSwitch(from: string, to: string) {
  if (!token) return;
  initMixpanel();
  mixpanel.track("Language Switch", { from, to });
}
