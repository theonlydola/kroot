export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const PLAYER_ICONS = [
  "🐨",
  "🦁",
  "🐯",
  "🐴",
  "🐱",
  "🐶",
  "🐬",
  "🐵",
  "🐦",
  "🦆",
  "🐸",
  "🐢",
  "🐙",
  "🦉",
  "🐺",
  "🦄",
  "🐝",
  "🐻",
  "🐘",
  "🦋",
];

export function createGameStorage<T>(key: string) {
  return {
    save(state: T) {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch {
        // ignore quota errors
      }
    },
    load(): T | null {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    },
    clear() {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    },
  };
}
