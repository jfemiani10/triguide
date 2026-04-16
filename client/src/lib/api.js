const RAW_API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const API_URL = RAW_API_URL.replace(/\/+$/, "");

export function getToken() {
  return localStorage.getItem("triguide_token");
}

export function setToken(token) {
  localStorage.setItem("triguide_token", token);
}

export function clearToken() {
  localStorage.removeItem("triguide_token");
}

export async function apiRequest(path, options = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${normalizedPath}`, {
    ...options,
    headers,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(data?.error || "Request failed");
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}
