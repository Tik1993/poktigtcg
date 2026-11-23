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

## Data format

How cards and images are named and stored. Read this before writing any import or fetch script — the format is the contract.

### 1. Sets

- `set_id` is a slug: `{language}-{set}` in lowercase, words joined with hyphens.
  - `jp-base-set` (Japanese Base Set). Future sets: `en-base-set`, `jp-jungle`, …
- `series` is the display name (`Base Set`).
- `language` is the full word (`japanese`, later `english`) — not an ISO code.

### 2. Cards

One row per (card, version). Japanese Base Set: 95 cards × 2 versions = 190 rows.

#### card_id

- Pokémon: `{set_id}-{series_no}-{version-slug}`
  - e.g. `jp-base-set-001-normal`, `jp-base-set-026-no-rarity`
- Trainers: `{set_id}-{series_no}-{name-slug}-{version-slug}`
  - e.g. `jp-base-set-t20-impostor-professor-oak-normal`
  - The name is included because `T20` alone says nothing; the number already identifies a Pokémon.
- `version-slug` is `normal` or `no-rarity`.
- `name-slug` is lowercase, spaces → hyphens, accents and symbols dropped (`Pokémon` → `pokemon`, `♂` dropped).

#### series_no

- The **printed** number. Pokémon: 3 digits (`001`). Trainers: `T01`–`T26`.
- Misprints are kept as printed: Raichu No Rarity is `025`, Venusaur No Rarity is `068`. The `card_id` keeps the true number (`026`, `003`).

#### Other fields

- `version`: exactly `Normal` or `No Rarity` (capital N / R).
- `rarity`: `Common`, `Uncommon`, or `Rare`.
- `pricecharting_url`: that card's PriceCharting page. Source of truth for numbering and price, e.g. `https://www.pricecharting.com/game/pokemon-japanese-expansion-pack/bulbasaur-1`.
- `market_price_usd`: current price in USD, `NULL` until fetched.

### 3. Images

- Filename is `{card_id}` plus an extension:
  - Normal → `.webp` (e.g. `jp-base-set-001-normal.webp`)
  - No Rarity → `.jpg` (e.g. `jp-base-set-001-no-rarity.jpg`)
- `image_file` is the same as `card_id`, plus the extension: `image_file = {card_id}.{ext}`. Images have no separate naming scheme — the filename and the card_id are the same string apart from the extension.
- R2 key is `{set_id}/{filename}` (e.g. `jp-base-set/jp-base-set-001-normal.webp`). R2 has no real folders — the `/` is part of the key, and one folder per set keeps sets apart.
- `cards.image_file` stores the filename **only** (no folder prefix). The Worker builds the URL as `{R2_URL}/{set_id}/{image_file}`.
- Public base URL: `https://pub-43cfc6f7718b48c7bf40972935d96430.r2.dev`

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
