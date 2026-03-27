import Link from "next/link";
import Image from "next/image";
import { Locale } from "@/lib/i18n";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { MobileMenu } from "@/components/layout/mobile-menu";

export async function Header({ lang }: { lang: Locale }) {
  const dict = await getDictionary(lang);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href={`/${lang}`}
          className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 row"
        >
          <Image
            src="/kroot.svg" // Path relative to the public folder
            alt="Kroot Logo"
            width={40} // Set desired width
            height={40} // Set desired height
            priority // Tells Next.js to load this immediately (LCP)
          />
          {dict.meta.siteName}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 sm:flex">
          <Link
            href={`/${lang}`}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {dict.nav.home}
          </Link>
          <Link
            href={`/${lang}/contact`}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {dict.nav.contact}
          </Link>
          <LanguageSwitcher lang={lang} label={dict.nav.switchLanguage} />
          <ThemeToggle label={dict.nav.darkMode} />
        </nav>

        {/* Mobile nav */}
        <div className="flex items-center gap-1 sm:hidden">
          <ThemeToggle label={dict.nav.darkMode} />
          <MobileMenu lang={lang} dict={dict} />
        </div>
      </div>
    </header>
  );
}
