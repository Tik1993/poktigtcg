const R2_URL = "https://pub-43cfc6f7718b48c7bf40972935d96430.r2.dev";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return overview(env);
    }
    if (url.pathname === "/pokedex/jp-base-set") {
      return grid(env);
    }
    if (url.pathname === "/about") {
      return about(env);
    }
    if (url.pathname.startsWith("/card/")) {
      const cardId = url.pathname.slice("/card/".length);
      return cardDetail(env, cardId);
    }
    return new Response("Not found", { status: 404 });
  },
};

async function overview(env) {
  const { results } = await env.DB.prepare(
    `SELECT s.set_id, s.name,
            COUNT(c.card_id) AS total,
            COUNT(uc.card_id) AS owned
     FROM sets s
     LEFT JOIN cards c ON c.set_id = s.set_id
     LEFT JOIN user_cards uc
       ON uc.card_id = c.card_id
      AND uc.user_id = 'ernest'
     GROUP BY s.set_id`,
  ).all();

  const rows = results
    .map(
      (r) =>
        `<li><a href="/pokedex/${r.set_id}">${r.name} ${r.owned}/${r.total}</a></li>`,
    )
    .join("");

  return new Response(
    `<!doctype html><html><body><h1>PokTik TCG</h1><p><a href="/about">About Me</a></p><ul>${rows}</ul></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

async function grid(env) {
  const { results } = await env.DB.prepare(
    `SELECT c.card_id, c.series_no, c.card_name, c.version, c.image_file,
            CASE WHEN uc.card_id IS NOT NULL THEN 1 ELSE 0 END AS owned,
            (SELECT price_usd FROM prices
             WHERE card_id = c.card_id
             ORDER BY recorded_at DESC LIMIT 1) AS price_usd
     FROM cards c
     LEFT JOIN user_cards uc
       ON uc.card_id = c.card_id
      AND uc.user_id = 'ernest'
     WHERE c.set_id = 'jp-base-set'
     ORDER BY c.series_no,
              CASE WHEN c.version = 'Normal' THEN 0 ELSE 1 END`,
  ).all();

  const cells = results
    .map((r) => {
      const cls = r.owned ? "cell owned" : "cell missing";
      const img = `${R2_URL}/jp-base-set/${r.image_file}`;
      const price =
        r.price_usd === null ? "No price yet" : `$${r.price_usd.toFixed(2)}`;
      return `<a class="${cls}" href="/card/${r.card_id}"><img src="${img}" alt="${r.card_name}" loading="lazy">${r.series_no}<br>${r.card_name}<br><small>${r.version}</small><br>${price}</a>`;
    })
    .join("");

  return new Response(
    `<!doctype html><html><head><style>
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 8px; }
      .cell { border: 1px solid #ccc; border-radius: 8px; padding: 8px; text-align: center; text-decoration: none; color: #111; }
      .cell img { width: 100%; display: block; border-radius: 4px; }
      .cell.owned { background: #fff7d6; border-color: #e0a800; }
      .cell.missing { background: #eee; }
      .cell.missing img { filter: grayscale(1); }
    </style></head><body><h1>Base Set</h1><p><a href="/">← PokTik TCG</a> · <a href="/about">About Me</a></p><div class="grid">${cells}</div></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

async function cardDetail(env, cardId) {
  const row = await env.DB.prepare(
    `SELECT c.card_id, c.series_no, c.card_name, c.card_type, c.rarity, c.version,
            c.pricecharting_url, c.image_file,
            CASE WHEN uc.card_id IS NOT NULL THEN 1 ELSE 0 END AS owned,
            uc.quantity, uc.acquired_date
     FROM cards c
     LEFT JOIN user_cards uc
       ON uc.card_id = c.card_id
      AND uc.user_id = 'ernest'
     WHERE c.card_id = ?`,
  )
    .bind(cardId)
    .first();

  if (!row) {
    return new Response("Card not found", { status: 404 });
  }

  const latest = await env.DB.prepare(
    `SELECT price_usd, recorded_at FROM prices
     WHERE card_id = ? ORDER BY recorded_at DESC LIMIT 1`,
  )
    .bind(cardId)
    .first();

  let ownedLine = "Not owned";
  if (row.owned) {
    ownedLine = `Own ${row.quantity}`;
    if (row.acquired_date) ownedLine += `, bought ${row.acquired_date}`;
  }
  const priceLine =
    latest === null
      ? "No price yet"
      : `$${latest.price_usd.toFixed(2)} (as of ${latest.recorded_at})`;
  const img = `${R2_URL}/jp-base-set/${row.image_file}`;
  const imgCls = row.owned ? "" : "grey";

  return new Response(
    `<!doctype html><html><head><style>
      .grey { filter: grayscale(1); }
    </style></head><body>
      <p><a href="/pokedex/jp-base-set">← Back to Base Set</a></p>
      <h1>${row.series_no} ${row.card_name}</h1>
      <img class="${imgCls}" src="${img}" alt="${row.card_name}" style="max-width: 300px;">
      <p>${row.card_type} · ${row.rarity} · ${row.version}</p>
      <p>${ownedLine}</p>
      <p>Price: ${priceLine}</p>
      <p><a href="${row.pricecharting_url}">PriceCharting</a></p>
    </body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

async function about(env) {
  const { results } = await env.DB.prepare(
    `SELECT c.card_id, c.series_no, c.card_name, c.version,
            uc.quantity, uc.acquired_date
     FROM user_cards uc
     JOIN cards c ON c.card_id = uc.card_id
     WHERE uc.user_id = 'ernest'
     ORDER BY uc.acquired_date IS NULL, uc.acquired_date`,
  ).all();

  const items =
    results.length === 0
      ? "<p>No cards in the collection yet.</p>"
      : "<ul>" +
        results
          .map((r) => {
            const date = r.acquired_date ?? "date unknown";
            return `<li>${date} — <a href="/card/${r.card_id}">${r.series_no} ${r.card_name} (${r.version})</a> × ${r.quantity}</li>`;
          })
          .join("") +
        "</ul>";

  return new Response(
    `<!doctype html><html><body>
      <p><a href="/">← Back to Pokédex</a></p>
      <h1>About Me</h1>
      <p>Your story goes here — how you started collecting, what you love about Japanese vintage cards, and what this site is for.</p>
      <h2>Collection Timeline</h2>
      ${items}
    </body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
