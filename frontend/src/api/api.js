import axios from "axios";

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

const api = axios.create({
  baseURL: API_URL
});

// 🔥 attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;