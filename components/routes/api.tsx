"use client"
{/*"use client"

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
);*/}



import axios from "axios";
import { getTokenFromSessionStorage } from "./sessionStorage";

const baseURL = "http://localhost:8787";

export const AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

AxiosInstance.interceptors.request.use(
  (config) => {
    try {
      const token = getTokenFromSessionStorage();
      if (token) {
        // Only parse the token if it exists
        const parsedToken = JSON.parse(token);
        config.headers.Authorization = `Bearer ${parsedToken}`;
      }
      return config;
    } catch (error) {
      console.error('Error processing token:', error);
      return config;
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
AxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error - please check your connection');
    } else if (error.response) {
      console.error('Response error:', error.response.status, error.response.data);
    }
    return Promise.reject(error);
  }
);

