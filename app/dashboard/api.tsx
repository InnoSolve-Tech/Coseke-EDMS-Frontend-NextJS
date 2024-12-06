"use client"

import { AxiosInstance } from "@/components/routes/api";

export const getAllLogs = async () => {
  try {
    const response = await AxiosInstance.get("/api/v1/logging");
    return response.data;
  } catch (error) {
    console.log(error, "error response");
  }
};
