"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

type Dict = {
  nav: { home: string; switchLanguage: string; menu: string };
};

export function MobileMenu({ lang, dict }: { lang: string; dict: Dict }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={dict.nav.menu}
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {open && (
        <div className="absolute inset-x-0 top-14 z-50 border-b border-border bg-background p-4 shadow-lg">
          <nav className="flex flex-col gap-2">
            <Link
              href={`/${lang}`}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {dict.nav.home}
            </Link>
            <LanguageSwitcher lang={lang} label={dict.nav.switchLanguage} />
          </nav>
        </div>
      )}
    </>
  );
}
