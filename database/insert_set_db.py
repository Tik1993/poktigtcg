import sqlite3
import json

db = sqlite3.connect("poktig.db")

def insert_set(name):
    with open("./data/sets.json") as f:
        data = json.load(f)[name]

    print(data)
    db.execute(
    "INSERT OR IGNORE INTO sets (set_id, name, release_date, language) VALUES (?, ?, ?, ?)",
    (name,data["name"], data["release_date"], data["language"]),
    )

    with open(f"./data/{name}/{name}.json",encoding="utf-8") as f:
        rows = json.load(f)

    for row in rows:
        db.execute(
            "INSERT OR IGNORE INTO cards (card_id, set_id, series_no, card_name, card_type, rarity, version, pricecharting_url, image_file, market_price_usd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (row['card_id'], name, row['series_no'], row['card_name'], row['card_type'], row['rarity'], row['version'], row['pricecharting_url'], row['image_file'], row['market_price_usd'])
        )
    db.commit()
insert_set("jp-jungle")