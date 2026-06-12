import axios from "axios";

// 🚀 Match this base URL port to your active backend server (usually 8000)
const API_URL = "http://localhost:3000";

export const api = axios.create({
  baseURL: API_URL
});

// Automatically inject token headers dynamically on all Axios-based requests
api.interceptors.request.use((config) => {
  const activeToken = localStorage.getItem("token");
  if (activeToken) {
    config.headers.Authorization = `Bearer ${activeToken}`;
  }
  return config;
});

// Handle global 401 Session logouts gracefully
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            window.location.href = "/login"; 
        }
        return Promise.reject(error);
    }
);

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

// ✅ FIXED: Grabs token directly inside the execution context thread dynamically
export async function fetchRecommendations() {
  const activeToken = localStorage.getItem("token");
  
  const res = await fetch(`${API_URL}/recommendations`, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${activeToken || ""}`
    }
  });
  
  if (res.status === 401) {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/login";
    return { error: "Session unauthorized" };
  }
  
  return res.json();
}