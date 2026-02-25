import requests
import pandas as pd
from tqdm import tqdm
import time

API_KEY = "e512242ecb24c255de91a020ad438e4a"
BASE_URL = "https://api.themoviedb.org/3"

# Number of pages to fetch (each page ≈ 20 shows)
PAGES_TO_FETCH = 200   # 200 pages ≈ 4000 shows

# Region and language settings
REGION = "VN"
LANGUAGE = "vi-VN"


def fetch_popular_tv(page):
    url = f"{BASE_URL}/tv/popular"
    params = {
        "api_key": API_KEY,
        "language": LANGUAGE,
        "page": page
    }
    return requests.get(url, params=params).json()


def fetch_tv_details(tv_id):
    url = f"{BASE_URL}/tv/{tv_id}"
    params = {
        "api_key": API_KEY,
        "language": LANGUAGE
    }
    return requests.get(url, params=params).json()


def fetch_release_info(tv_id):
    """
    Get country release info to check if show exists in Vietnam
    """
    url = f"{BASE_URL}/tv/{tv_id}/watch/providers"
    params = {"api_key": API_KEY}
    return requests.get(url, params=params).json()


all_shows = []

print("Fetching TV shows from TMDb...")

for page in tqdm(range(1, PAGES_TO_FETCH + 1)):

    data = fetch_popular_tv(page)

    if "results" not in data:
        continue

    for show in data["results"]:
        tv_id = show["id"]

        # Fetch details
        details = fetch_tv_details(tv_id)

        # Fetch availability info
        providers = fetch_release_info(tv_id)

        # Check if Vietnam appears in watch providers
        available_in_vn = False
        if "results" in providers and "VN" in providers["results"]:
            available_in_vn = True

        record = {
            "id": tv_id,
            "name": details.get("name"),
            "original_name": details.get("original_name"),
            "first_air_date": details.get("first_air_date"),
            "last_air_date": details.get("last_air_date"),
            "num_seasons": details.get("number_of_seasons"),
            "num_episodes": details.get("number_of_episodes"),
            "languages": details.get("languages"),
            "genres": [g["name"] for g in details.get("genres", [])],
            "origin_country": details.get("origin_country"),
            "popularity": details.get("popularity"),
            "vote_average": details.get("vote_average"),
            "vote_count": details.get("vote_count"),
            "available_in_vietnam": available_in_vn
        }

        all_shows.append(record)

    # avoid API rate limits
    time.sleep(0.25)

print(f"\nCollected {len(all_shows)} TV shows")

# Save results
df = pd.DataFrame(all_shows)
df.to_csv("tv_shows_vietnam_dataset.csv", index=False)
df.to_json("tv_shows_vietnam_dataset.json", orient="records", force_ascii=False)

print("Saved dataset to CSV and JSON.")