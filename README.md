# PokTik TCG

A personal collection-journey site for Japanese vintage Pokémon cards — not a price-tracker clone, but a record of the joy and process of collecting.

**Live:** https://poktik.poktiktcg.workers.dev

## What's inside

- **Pokédex grid** — 190 slots for the Japanese Base Set (95 cards × 2 versions: Normal and No Rarity). Owned cards in colour, unowned in grey.
- **Single-card pages** — details, ownership status, and a PriceCharting link.
- **About Me** — the collecting story plus a timeline of purchases.

## Stack

- **Cloudflare Workers** — server-side rendering in vanilla JavaScript. No React in v1, minimal client-side code.
- **Cloudflare D1** — SQLite in the cloud. Same engine and SQL as local SQLite; only the hosting differs.
- **Cloudflare R2** — card images, served from a public `r2.dev` URL.
- **Python** — local data scripts (schema setup, imports) and the price fetcher.
- **GitHub Actions** — scheduled daily price fetch into D1.

## Key decisions

- **Normal and No Rarity are separate versions, not one card.** No Rarity cards are the first print of the Japanese Base Set, and most English databases don't separate them — this is the site's killer feature.
- **190 slots, one per version.** Progress is counted per set (e.g. Base Set 12/190).
- **D1 is the source of truth.** The price fetcher reads card URLs from D1, not from the dataset JSON — the JSON is a snapshot and can go stale.
- **Images are files, not database rows.** The `cards` table stores only the filename (`image_file`); the bytes live in R2 under a per-set prefix (`jp-base-set/...`).
- **Local first, then cloud.** Data is built and tested in a local SQLite file, then moved to D1 with `wrangler d1 execute --remote`. Wrangler 4 defaults to local storage, so every cloud command needs `--remote`.

## Project structure

```
├── src/index.js              # Worker: routing + HTML
├── wrangler.toml             # Worker name, D1 binding
├── fetch_price/
│   └── fetch_prices.py       # Price fetcher
├── database/
│   ├── create_db.py          # Local schema setup
│   └── insert_db.py          # Local dataset import
├── data/                     # Local only (gitignored)
├── .github/workflows/
│   └── fetch-prices.yml      # Daily price fetch
└── README.md
```

## Run it locally

```bash
npx wrangler dev --remote
# open http://localhost:8787
```

## Deploy

```bash
npx wrangler deploy
```

## Data

- Japanese Base Set, 1996 — 95 cards (69 Pokémon + 26 Trainers) × Normal / No Rarity = 190 rows.
- Numbering follows PriceCharting's Japanese Expansion Pack, including the printed misprints (Raichu No Rarity "025", Venusaur No Rarity "068").
- Prices: PriceCharting (baseline, USD, updated daily).

## Roadmap

- Daily price fetch (GitHub Actions → D1), with a price-history table that records source and date per price.
- More sets (Jungle, Fossil, …), each with its own R2 prefix.
- The About Me story.
