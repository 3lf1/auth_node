
import axios from "axios";

const API_URL = "http://localhost:3000/api";

// Separate client for normal API requests
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Separate client for refresh requests.
// This prevents the refresh request from triggering its own interceptor.
const refreshApi = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

let accessToken = null;
let refreshPromise = null;

// Attach the access token to each request.
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// Refresh an expired access token and retry the request.
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      error.response?.data?.code !== "AUTH_TOKEN_EXPIRED" ||
      originalRequest._retried
    ) {
      throw error;
    }

    originalRequest._retried = true;

    try {
      // Reuse an in-progress refresh instead of starting another one.
      if (!refreshPromise) {
        refreshPromise = refreshApi
          .post("/auth/refresh")
          .then((response) => {
            accessToken = response.data.accessToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      await refreshPromise;

      // The request interceptor adds the new access token.
      return api(originalRequest);
    } catch (refreshError) {
      accessToken = null;
      throw refreshError;
    }
  }
);

// Example: log in, then call a protected endpoint.
async function main() {
  try {
    const loginResponse = await api.post("/auth/login", {
      email: "YOUR_TEST_EMAIL",
      password: "YOUR_TEST_PASSWORD",
    });

    accessToken = loginResponse.data.accessToken;

    console.log("Logged in successfully.");

    const response = await api.get("/YOUR_PROTECTED_ENDPOINT");

    console.log("Protected response:", response.data);
  } catch (error) {
    console.error(
      "Request failed:",
      error.response?.data ?? error.message
    );
  }
}

main();
