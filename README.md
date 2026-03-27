# 🎲 Kroot

**Free online card games for gatherings — no downloads, no sign-ups. Just pick a game and play with friends!**

🌐 [kroot.online](https://kroot.online)

## Games

| Game | Description | Players |
|------|-------------|---------|
| 😈 **Bad People** | Vote on who fits the description best | 3–10 |
| 🔮 **Dark Stories** | Solve riddles using only yes/no questions | 2–15 |
| 🕵️ **Imposter** | Find the player with a different word | 4–10 |
| 🎯 **Truth or Dare** | Choose truth (answer honestly) or dare (complete the challenge) | 2–20 |
| ⚖️ **Would You Rather** | Choose between two impossible options | 2–20 |

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router, SSG)
- **Language:** TypeScript
- **UI:** React 19, [Tailwind CSS 4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com), [Framer Motion](https://motion.dev)
- **i18n:** English & Arabic with full RTL support
- **Analytics:** [Mixpanel](https://mixpanel.com)
- **Error Monitoring:** [Sentry](https://sentry.io)
- **Ads:** Google AdSense

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 20+
- [Bun](https://bun.sh) (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/kroot.git
cd kroot

# Install dependencies
bun install

# Start the development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Required
NEXT_PUBLIC_SITE_URL=https://kroot.online

# Optional — Analytics
NEXT_PUBLIC_MIXPANEL_TOKEN=

# Optional — Ads
NEXT_PUBLIC_ADSENSE_CLIENT=

# Optional — Error Monitoring
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
```

## Project Structure

```
src/
├── app/
│   ├── [lang]/                 # Locale-based routing (en, ar)
│   │   ├── dictionaries/       # Translation JSON files
│   │   ├── games/[slug]/       # Game play pages
│   │   └── page.tsx            # Home — game catalog grid
│   └── api/                    # API routes
├── components/
│   ├── game/                   # Game-specific components
│   ├── layout/                 # Header, Footer, Language Switcher
│   └── ui/                     # shadcn/ui primitives
├── data/
│   ├── games.ts                # Game registry & types
│   └── games/                  # Game content JSON (bilingual cards)
└── lib/                        # Utilities (i18n, analytics, helpers)
```

## Scripts

```bash
bun dev       # Start development server
bun run build # Build for production
bun start     # Start production server
bun run lint  # Run ESLint
```

## Internationalization

Kroot supports **English** and **Arabic** with full RTL layout:

- Locale detection via `Accept-Language` header with automatic redirect
- Per-locale fonts: **Geist Sans** (English) / **Cairo** (Arabic)
- Direction-aware UI: arrow icons, carousel animations, and text all adapt to reading direction
- SEO: `hreflang` alternates and locale-specific Open Graph metadata on every page

## Deployment

Deploy to [Vercel](https://vercel.com) for the best Next.js experience:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/kroot)

Or build and run anywhere with Node.js:

```bash
bun run build
bun start
```

## License

This project is private and not open-sourced.
