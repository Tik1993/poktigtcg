import requests
from bs4 import BeautifulSoup
import json
import time
from datetime import date

def fetch_price(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    }

    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
    except requests.RequestException:
        return None

    soup = BeautifulSoup(response.text, "html.parser")
    price = soup.select_one("td#used_price .js-price")

    if not price: 
        return None

    try:
        return float(price.get_text(strip=True).replace("$", "").replace(",", ""))
    except ValueError:
        return None

def main():
    with open("fetch_price/urls.json") as f:
        rows = json.load(f)
    today = date.today().isoformat()

    with open("fetch_price/prices.sql", "w") as f:
        for row in rows:
            card_id = row["card_id"]
            price = fetch_price(row["pricecharting_url"])
            time.sleep(1)
            if price is None:
                print(card_id, "no price")
                continue           
            f.write(
                f"INSERT INTO prices (card_id, price_usd, source, recorded_at) "
                f"VALUES ('{card_id}', {price}, 'pricecharting', '{today}');\n"
            )
            print(card_id, price)

main()