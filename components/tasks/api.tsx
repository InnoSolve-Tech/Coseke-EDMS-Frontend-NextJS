"use client";

import axios from "axios";
import { AxiosInstance } from "../routes/api";
import { getTokenFromSessionStorage } from "../routes/sessionStorage";

type TaskData = {
  priority: string;
  description: string;
  startDate: string;
  deadline: string;
  dueDate: string;
  timelineReason: string;
  assignees: string[];
  roles: string[];
  status: "contracted" | "qualified" | "Closed";
  id: number;
  title: string;
  date: string;
};

type ApiResponse<R> = {
  title: string;
  priority: string;
  id: ApiResponse<TaskData[]>;
  data: R;
};

export const getTasks = async (): Promise<ApiResponse<TaskData[]>> => {
  const response = await AxiosInstance.get<ApiResponse<TaskData[]>>(
    "/tasks/api/v1/tasks/all",
  );
  return response.data;
};
