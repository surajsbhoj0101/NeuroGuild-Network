import axios from "axios";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const api = axios.create({
  baseURL: API_BASE_URL || undefined,
  withCredentials: true, 
});

api.interceptors.request.use((config) => {
  const request = { ...config };
  const url = String(request.url || "");

  if (/^https?:\/\//i.test(url)) {
    const parsed = new URL(url);
    const nextPath = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    request.url = API_BASE_URL ? `${API_BASE_URL}${nextPath}` : nextPath;
    request.baseURL = undefined;
    return request;
  }

  if (API_BASE_URL && url.startsWith("/")) {
    request.url = `${API_BASE_URL}${url}`;
    request.baseURL = undefined;
  }

  return request;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = String(error.config?.url || "");
    const isSessionProbe = requestUrl.includes("/api/auth/check-jwt");

    if (status === 401 && !isSessionProbe) {
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  }
);

export default api;
