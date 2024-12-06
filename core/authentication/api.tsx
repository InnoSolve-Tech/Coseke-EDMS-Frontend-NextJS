"use client"

import { AxiosInstance } from "../../components/routes/api";
import { ILoginState } from "./interface";

export const loginService = async (body: ILoginState) => {
  try {
    const response = await AxiosInstance.post("api/v1/auth/authenticate", body);
    return response.data;
  } catch (error) {
    console.log(error, "error response");
  }
};
