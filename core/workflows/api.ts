"use client"

import { Workflow } from "@/lib/types/workflow";
import { AxiosInstance } from "../../components/routes/api";

export const createWorkflow = async (workflow: Workflow) => {
  try {
    const response = await AxiosInstance.post("/workflows/api/v1/workflows", workflow);
    return response.data;
  } catch (error) {
    console.log(error, "error response");
  }
};

export const deleteWorkflow = async (id: number) => {
  try {
    const response = await AxiosInstance.delete(`/workflows/api/v1/workflows/${id}`);
    return response.data;
  } catch (error) {
    console.log(error, "error response");
  }
}

export const editWorkflow = async (workflow: Workflow) => {
  try {
    const response = await AxiosInstance.put("/workflows/api/v1/workflows/edit", workflow);
    return response.data;
  } catch (error) {
    console.log(error, "error response");
  }
}

export const getWorkflow = async (id: number) => {
  try {
    const response = await AxiosInstance.get(`/workflows/api/v1/workflows/${id}`);
    return response.data;
  } catch (error) {
    console.log(error, "error response");
  }
};

export const getAllWorkflows = async (): Promise<Workflow[]> => {
  try {
    const response = await AxiosInstance.get("/workflows/api/v1/workflows");
    return response.data as Workflow[];
  } catch (error) {
    console.log(error, "error response");
    return [];
  }
}
