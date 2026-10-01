const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

function getToken() {
  return localStorage.getItem("yearbookToken");
}

export function setToken(token) {
  if (token) {
    localStorage.setItem("yearbookToken", token);
  } else {
    localStorage.removeItem("yearbookToken");
  }
}

async function handleResponse(res) {
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const message =
      (data && (data.detail || data.message)) || `Request failed (${res.status})`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
  return data;
}

export async function apiGet(path) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return handleResponse(res);
}

export async function apiJson(path, method, body) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handleResponse(res);
}

export async function apiForm(path, method, formData) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  return handleResponse(res);
}

export function fileUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
}

export { API_BASE };
