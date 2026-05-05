import requests
import pandas as pd
from tqdm import tqdm
import time
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

API_KEY = "e512242ecb24c255de91a020ad438e4a"
BASE_URL = "https://api.themoviedb.org/3"
PAGES_PER_TYPE = 300 
LANGUAGE = "vi-VN"

# --- Setup Resilient Session ---
def get_resilient_session():
    session = requests.Session()
    # Retry strategy: retry on common server errors or connection resets
    retry_strategy = Retry(
        total=5, # Number of retries
        backoff_factor=1, # Wait 1s, 2s, 4s, 8s, 16s between retries
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"]
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session

session = get_resilient_session()

def safe_request(url, params):
    """Wrapper to handle hard connection drops that Retry can't catch"""
    while True:
        try:
            response = session.get(url, params=params, timeout=15)
            response.raise_for_status()
            return response.json()
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
            print(f"\n📡 Network glitch: {e}. Retrying in 5 seconds...")
            time.sleep(5)
        except requests.exceptions.HTTPError as e:
            print(f"\n❌ HTTP Error: {e}. Skipping this item.")
            return {}

def fetch_data(endpoint, page):
    url = f"{BASE_URL}/{endpoint}"
    return safe_request(url, {"api_key": API_KEY, "language": LANGUAGE, "page": page})

def fetch_details(media_type, media_id):
    url = f"{BASE_URL}/{media_type}/{media_id}"
    params = {"api_key": API_KEY, "language": LANGUAGE, "append_to_response": "videos"}
    return safe_request(url, params)

all_content = []

try:
    for media_type in ["movie", "tv"]:
        print(f"\n--- Fetching {media_type.upper()}s ---")
        for page in tqdm(range(1, PAGES_PER_TYPE + 1)):
            popular_data = fetch_data(f"{media_type}/popular", page)
            
            if "results" not in popular_data:
                continue

            for item in popular_data["results"]:
                media_id = item["id"]
                details = fetch_details(media_type, media_id)
                
                if not details: continue

                # Trailer Logic
                trailer_key = None
                if "videos" in details:
                    videos = details["videos"].get("results", [])
                    trailers = [v for v in videos if v["site"] == "YouTube" and v["type"] == "Trailer"]
                    trailer_key = trailers[0]["key"] if trailers else (videos[0]["key"] if videos else None)

                name = details.get("name") if media_type == "tv" else details.get("title")
                original_name = details.get("original_name") if media_type == "tv" else details.get("original_title")
                release_date = details.get("first_air_date") if media_type == "tv" else details.get("release_date")
                
                all_content.append({
                    "id": media_id,
                    "type": media_type,
                    "name": name,
                    "original_name": original_name,
                    "overview": details.get("overview"),
                    "poster_path": f"https://image.tmdb.org/t/p/w500{details.get('poster_path')}" if details.get('poster_path') else None,
                    "backdrop_path": f"https://image.tmdb.org/t/p/original{details.get('backdrop_path')}" if details.get('backdrop_path') else None,
                    "trailer_url": f"https://www.youtube.com/watch?v={trailer_key}" if trailer_key else None,
                    "release_date": release_date,
                    "num_seasons": details.get("number_of_seasons", 0 if media_type == "movie" else None),
                    "num_episodes": details.get("number_of_episodes", 0 if media_type == "movie" else None),
                    "runtime": details.get("runtime") if media_type == "movie" else (details.get("episode_run_time")[0] if details.get("episode_run_time") else None),
                    "genres": [g["name"] for g in details.get("genres", [])],
                    "origin_country": details.get("origin_country") if media_type == "tv" else [details.get("origin_country")] if details.get("origin_country") else [],
                    "popularity": details.get("popularity"),
                    "vote_average": details.get("vote_average"),
                    "vote_count": details.get("vote_count"),
                })
                time.sleep(0.05) # Tiny breather
                
except KeyboardInterrupt:
    print("\n🛑 Fetching paused by user. Saving what we have...")

# --- Final Export ---
if all_content:
    df = pd.DataFrame(all_content)
    df.to_csv("tv_shows_vietnam_dataset.csv", index=False, encoding='utf-8-sig')
    df.to_json("tv_shows_vietnam_dataset.json", orient="records", force_ascii=False, indent=4)
    print(f"\n✅ Done! Saved {len(all_content)} items.")
else:
    print("\n❌ No data collected.")