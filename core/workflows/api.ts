"use client"

import { AxiosInstance } from "../../components/routes/api";
import { IWorkflow } from "./interface";

export const createWorkflow = async (workflow: IWorkflow) => {
  try {
    const response = await AxiosInstance.post("api/v1/workflows", workflow);
    return response.data;
  } catch (error) {
    console.log(error, "error response");
  }
};

export const getWorkflow = async (id: number) => {
  try {
    const response = await AxiosInstance.get(`api/v1/workflows/${id}`);
    return response.data;
  } catch (error) {
    console.log(error, "error response");
  }
};
