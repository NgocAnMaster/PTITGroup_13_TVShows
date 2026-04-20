import axios from "axios";

const API_URL = "http://localhost:3000";

const api = axios.create({
  baseURL: API_URL
});

export async function fetchShows(page = 1) {
  const res = await fetch(`${API_URL}/shows?page=${page}`);
  return res.json();
}

export async function searchShows(query) {
  const res = await fetch(`${API_URL}/search?q=${query}`);
  return res.json();
}

export async function userHistory(query) {
  const res = await fetch(`${API_URL}/users/history?q=${query}`);
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

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            window.location.href = "/login"; // Force redirect
        }
        return Promise.reject(error);
    }
);

// 🔥 attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;