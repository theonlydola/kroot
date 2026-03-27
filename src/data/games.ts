import badPeople from "./games/bad-people.json";
import darkStories from "./games/dark-stories.json";
import imposter from "./games/imposter.json";
import truthOrDare from "./games/truth-or-dare.json";
import wouldYouRather from "./games/would-you-rather.json";

type WordPair = { word: string; imposter: string };
type CategoryKey = "food" | "animals" | "objects";

export type Game = {
  slug: string;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  howToPlay: { en: string; ar: string };
  icon: string;
  color: string;
  minPlayers: number;
  maxPlayers: number;
  supportsOnline?: boolean;
  cards?: { en: string[]; ar: string[] };
  truths?: { en: string[]; ar: string[] };
  dares?: { en: string[]; ar: string[] };
  categories?: {
    en: Record<CategoryKey, WordPair[]>;
    ar: Record<CategoryKey, WordPair[]>;
  };
};

export type ImposterGame = Game & {
  categories: {
    en: Record<CategoryKey, WordPair[]>;
    ar: Record<CategoryKey, WordPair[]>;
  };
};

export const games: Game[] = [
  badPeople,
  darkStories,
  imposter as unknown as Game,
  truthOrDare,
  wouldYouRather,
];

export function getGameBySlug(slug: string): Game | undefined {
  return games.find((g) => g.slug === slug);
}

export function getImposterGame(): ImposterGame {
  return imposter as unknown as ImposterGame;
}

export type TruthOrDareData = Game & {
  truths: { en: string[]; ar: string[] };
  dares: { en: string[]; ar: string[] };
};

export function getTruthOrDareGame(): TruthOrDareData {
  return truthOrDare as unknown as TruthOrDareData;
}
