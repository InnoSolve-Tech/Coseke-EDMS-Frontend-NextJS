"use client";

import axios from "axios";
import { getTokenFromSessionStorage } from "./sessionStorage";

const baseURL = "http://localhost:8787";

export const AxiosInstance = axios.create({
  baseURL,
});

AxiosInstance.interceptors.request.use(
  (config) => {
    const token = getTokenFromSessionStorage(),
      authorization = `Bearer ${JSON.parse(token)}`,
      contentType = "application/json";

    if (token) {
      config.headers["Authorization"] = authorization;
      config.headers["Content-Type"] = contentType;
    } else config.headers["Content-Type"] = contentType;
    return config;
  },
  (error) => Promise.reject(error),
);

// Add response interceptor for better error handling
AxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "Network Error") {
      console.error("Network error - please check your connection");
    } else if (error.response) {
      console.error(
        "Response error:",
        error.response.status,
        error.response.data,
      );
    }
    return Promise.reject(error);
  },
);
