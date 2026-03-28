import Link from "next/link";
import { Locale } from "@/lib/i18n";
import { getDictionary } from "@/app/[lang]/dictionaries";

const GAMES = [
  { slug: "bad-people", emoji: "😈" },
  { slug: "dark-stories", emoji: "🔮" },
  { slug: "imposter", emoji: "🕵️" },
  { slug: "truth-or-dare", emoji: "🎯" },
  { slug: "would-you-rather", emoji: "⚖️" },
];

export async function Footer({ lang }: { lang: Locale }) {
  const dict = await getDictionary(lang);
  const isRtl = lang === "ar";

  return (
    <footer className="border-t border-border bg-card">
      {/* Main footer content */}
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div
          className={`grid grid-cols-1 gap-8 sm:grid-cols-3 ${isRtl ? "text-right" : "text-left"}`}
        >
          {/* Brand column */}
          <div className="flex flex-col gap-3">
            <Link
              href={`/${lang}`}
              className="text-xl font-bold text-foreground hover:text-primary transition-colors"
            >
              🃏 {dict.meta.siteName}
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {dict.footer.tagline}
            </p>
            {/* Language toggle */}
            <Link
              href={lang === "en" ? "/ar" : "/en"}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-fit"
            >
              🌐 {lang === "en" ? "العربية" : "English"}
            </Link>
          </div>

          {/* Games column */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {dict.footer.gamesLabel}
            </h3>
            <ul className="flex flex-col gap-2">
              {GAMES.map(({ slug, emoji }) => (
                <li key={slug}>
                  <Link
                    href={`/${lang}/games/${slug}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span>{emoji}</span>
                    <span className="capitalize">
                      {dict.games[slug as keyof typeof dict.games]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links column */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {dict.footer.linksLabel ?? "Links"}
            </h3>
            <ul className="flex flex-col gap-2">
              <li>
                <Link
                  href={`/${lang}/contact`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {dict.footer.contact}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div
          className={`mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 py-4 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between ${isRtl ? "sm:text-right" : "sm:text-left"}`}
        >
          <p>
            &copy; {new Date().getFullYear()} {dict.meta.siteName}.{" "}
            {dict.footer.rights}
          </p>
          <p className="text-xs opacity-60">{dict.footer.madeWith}</p>
        </div>
      </div>
    </footer>
  );
}
