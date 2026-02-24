# Veritas AI – News Authenticity Analyzer

A responsive Next.js 14 application that combines Gemini 1.5 Flash, Tavily search, Jina AI, Firecrawl, and custom extraction logic to evaluate the credibility of news articles in real time.

## Highlights

- **AI fact-checking pipeline** with structured outputs, fallbacks, and PDF exports.
- **Multi-source extraction** (Jina → Firecrawl → Article Extractor → Readability) with graceful degradation paths.
- **Production-ready tooling**: Type-safe API route, Zod validation, Radix UI primitives, Tailwind v4, Shadcn-inspired components.
- **Verified build**: `pnpm lint` and `pnpm build` both succeed locally, matching Vercel’s CI expectations.

## Responsive UI Audit (✅)

- `app/page.tsx`: hero, stats grid, and feature cards collapse to single columns under `md`, with fluid typography and gradients that no longer clip.
- `InputSection`: progress steps, button rows, and status pills now wrap on small breakpoints so CTAs stay tappable.
- `ResultsSection`: summary stats, claim cards, and footer badges use responsive grids/stacking along with safe progress calculations (no NaN when no claims exist).
- `ExportReport` / `Sidebar`: dropdowns and history items keep touch targets ≥44px, with accessible focus states and reduced motion respect.

## Requirements

- Node.js 18.18+ (matches Next 14 runtime support)
- pnpm 9+
- Modern browser (Chromium/Firefox/Safari) to test responsive layouts

## Environment Setup

1. **Clone & install**
   ```bash
   git clone <your-repo-url>
   cd Veritas-AI-main
   pnpm install
   ```

2. **Configure secrets**
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in the following variables:

   | Variable | Purpose |
   | --- | --- |
   | `GOOGLE_GENERATIVE_AI_API_KEY` | Required for Gemini 1.5 Flash analysis |
   | `JINA_AI_API_KEY` | Jina Reader (tier-1 extraction) |
   | `FIRECRAWL_API_KEY` | Firecrawl scraping fallback |
   | `TAVILY_API_KEY` | Web/fact-check search context |

3. **Run locally**
   ```bash
   pnpm dev
   ```
   Visit `http://localhost:3000` and start submitting URLs or raw text.

## Available Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Next.js dev server with HMR |
| `pnpm lint` | Runs `next lint` (ESLint + `next/core-web-vitals`) |
| `pnpm build` | Production build + type check (required by Vercel) |
| `pnpm start` | Serve the `.next` build locally |
| `pnpm deploy:vercel` | Optional helper that calls `vercel --prod` |

## Deployment on Vercel

1. **Prereq checks**: run `pnpm lint` and `pnpm build` locally (both pass in this repo).
2. **Connect repo** on [vercel.com](https://vercel.com/dashboard) → *New Project* → import GitHub repo.
3. **Build settings** (also captured in `vercel.json`):
   - Install: `pnpm install`
   - Build: `pnpm build`
   - Framework: Next.js (auto-detected)
   - Edge/function timeout: `maxDuration: 30s` for `app/api/**/*.ts`
4. **Environment variables**: add the four keys listed above for Production + Preview + Development.
5. **Deploy**: push to `main` (or click *Deploy*). Use `pnpm deploy:vercel` locally if you prefer CLI deployments.

## Testing & QA

- `pnpm lint` → ✅ No warnings (React hook deps fixed in `components/sidebar.tsx`).
- `pnpm build` → ✅ Compiles, lints, checks types, and emits static output summary shown above.
- Manual responsive checks performed across 320px, 768px, 1024px, 1440px breakpoints.

## Troubleshooting

| Issue | Fix |
| --- | --- |
| Missing API keys | Ensure `.env.local` matches `.env.local.example`, redeploy after updating Vercel envs |
| API timeouts | The analyzer truncates >50k chars and re-tries extraction tiers; still, consider shorter articles when testing |
| Vercel build fails on lint/types | Run `pnpm lint && pnpm build` locally to surface issues; we no longer skip TypeScript/ESLint in `next.config.mjs` |

## Project Structure

```
├── app/
│   ├── api/analyze/route.ts   # Gemini + Tavily orchestration
│   ├── layout.tsx             # Metadata + theming
│   ├── page.tsx               # Landing + analysis flow
│   └── globals.css            # Tailwind v4 tokens
├── components/                # UI + feature components (Shadcn-style)
├── lib/                       # Extraction, Tavily, PDF utilities
├── Docs/                      # Internal guides and playbooks
├── styles/                    # Legacy global CSS
└── vercel.json                # Deployment defaults
```

## License

MIT — see `LICENSE` for details.
