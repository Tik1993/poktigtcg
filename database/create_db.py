import sqlite3

db = sqlite3.connect("poktig.db")

db.execute("""
    CREATE TABLE IF NOT EXISTS sets(
    set_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    release_date TEXT,
    language TEXT NOT NULL
    )
""")

db.execute("""
    CREATE TABLE IF NOT EXISTS cards(
    card_id TEXT PRIMARY KEY,
    set_id TEXT NOT NULL REFERENCES sets(set_id),
    card_name TEXT NOT NULL,
    series_no TEXT NOT NULL,
    card_type TEXT NOT NULL,
    rarity TEXT,
    version TEXT NOT NULL,
    pricecharting_url TEXT,
    image_file TEXT,
    market_price_usd REAL
    )
""")

db.execute("""
    CREATE INDEX IF NOT EXISTS idx_cards_set ON cards(set_id);
""")

db.execute("""
    CREATE TABLE IF NOT EXISTS users(
    user_id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL
    )
""")

db.execute("""
    CREATE TABLE IF NOT EXISTS user_cards(
    user_id TEXT NOT NULL REFERENCES users(user_id),
    card_id TEXT NOT NULL REFERENCES cards(card_id),
    quantity INTEGER NOT NULL DEFAULT 1,
    acquired_date TEXT, 
    PRIMARY KEY(user_id, card_id)
    )
""")

db.execute("""
    CREATE TABLE IF NOT EXISTS prices(
        price_id INTEGER PRIMARY KEY AUTOINCREMENT,
        card_id TEXT NOT NULL REFERENCES cards(card_id),
        price_usd REAL NOT NULL,
        source TEXT NOT NULL,
        recorded_at TEXT NOT NULL
    )
""")
db.execute("""
    CREATE INDEX IF NOT EXISTS idx_prices_card_time ON prices(card_id, recorded_at)
""")


db.commit()

tables = db.execute(
    "SELECT name FROM sqlite_master WHERE type='table'"
).fetchall()
print(tables)