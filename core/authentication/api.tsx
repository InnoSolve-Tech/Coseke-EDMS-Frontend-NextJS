"use client";

import { Role, User } from "@/lib/types/user";
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

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const response = await AxiosInstance.get("api/v1/users");
    return response.data;
  } catch (error) {
    console.log(error, "error response");
    return [];
  }
};

export const getAllRoles = async (): Promise<Role[]> => {
  try {
    const response = await AxiosInstance.get("api/v1/roles");
    return response.data;
  } catch (error) {
    console.log(error, "error response");
    return [];
  }
};
