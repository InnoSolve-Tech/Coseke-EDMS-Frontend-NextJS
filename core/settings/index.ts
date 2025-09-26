import { Settings } from "@/types/settings";
import { AxiosInstance, getBaseUrl } from "@/components/routes/api";
import axios from "axios";
import { getTokenFromSessionStorage } from "@/components/routes/sessionStorage";
import { JSONParser } from "formidable/parsers";

export const getSettings = async (): Promise<Settings> => {
  try {
    const response = await AxiosInstance.get<Settings>(`/api/v1/settings`);
    return response.data;
  } catch (error) {
    console.error("Error in getSettings function:", error);
    throw new Error("Error in getSettings function");
  }
};

export const createSettings = async (
  settings: Settings,
  logo: File,
): Promise<Settings> => {
  const formData = new FormData();
  const token = JSON.parse(getTokenFromSessionStorage())
  formData.append(
    "settings",
    new Blob([JSON.stringify(settings)], { type: "application/json" }),
  );
  formData.append("logo", logo);
  try {
    const response = await axios.post<Settings>(
      `${getBaseUrl()}/api/v1/settings`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error in createSettings function:", error);
    throw new Error("Error in createSettings function");
  }
};
