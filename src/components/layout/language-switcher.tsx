"use client";

import { usePathname } from "next/navigation";

export function LanguageSwitcher({
  lang,
  label,
}: {
  lang: string;
  label: string;
}) {
  const pathname = usePathname();
  const targetLang = lang === "en" ? "ar" : "en";
  const newPath = pathname.replace(`/${lang}`, `/${targetLang}`);

  return (
    <a
      href={newPath}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {label}
    </a>
  );
}
