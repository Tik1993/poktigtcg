import sqlite3

db = sqlite3.connect("poktig.db")

db.execute("""
    INSERT OR IGNORE INTO sets (set_id, name, release_date, language)
    VALUES('jp-base-set', 'Base Set', '1996-10-20', 'japanese')
""")

import json

with open("./data/jp-base-set/jp-base-set.json",encoding="utf-8") as f:
    rows = json.load(f)

for row in rows:
    db.execute(
        "INSERT OR IGNORE INTO cards (card_id, set_id, series_no, card_name, card_type, rarity, version, pricecharting_url, image_file, market_price_usd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (row['card_id'], 'jp-base-set', row['series_no'], row['card_name'], row['card_type'], row['rarity'], row['version'], row['pricecharting_url'], row['image_file'], row['market_price_usd'])
    )
db.commit()
print(db.execute("SELECT COUNT(*) FROM cards").fetchone())

print(db.execute("SELECT * FROM sets").fetchone())
print(db.execute("SELECT card_id, card_name FROM cards ORDER BY series_no LIMIT 10; ").fetchall())
print(db.execute("SELECT card_id, card_name FROM cards WHERE card_name = 'Charizard'; ").fetchone())