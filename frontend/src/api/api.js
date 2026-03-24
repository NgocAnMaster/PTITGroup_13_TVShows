const API_URL = "http://localhost:3000";

export async function fetchShows(page = 1) {
  const res = await fetch(`${API_URL}/shows?page=${page}`);
  return res.json();
}

export async function searchShows(query) {
  const res = await fetch(`${API_URL}/search?q=${query}`);
  return res.json();
}

export async function fetchRecommendations(token) {
  const res = await fetch(`${API_URL}/recommendations`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.json();
}