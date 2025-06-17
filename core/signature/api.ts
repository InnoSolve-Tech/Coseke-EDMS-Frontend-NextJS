import { AxiosInstance } from "@/components/routes/api";
import { getTokenFromSessionStorage } from "@/components/routes/sessionStorage";
import axios from "axios";

export const getSignatures = async (): Promise<
  { id: number; name: string }[]
> => {
  try {
    const response = await AxiosInstance.get(`api/v1/signatures/user`);
    return response.data;
  } catch (error) {
    console.error("Error fetching signature:", error);
    throw error;
  }
};

export const getSignatureLinkById = async (id: number): Promise<string> => {
  try {
    const response = await AxiosInstance.get(`api/v1/signatures/link/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching signature link by ID:", error);
    throw error;
  }
};

export const createSignature = async (
  signature: { name: string },
  file: File,
): Promise<{ id: number; name: string }> => {
  try {
    const formData = new FormData();

    formData.append("signature", JSON.stringify(signature));
    formData.append("file", file);

    const response = await axios.post(
      "http://localhost:8787/api/v1/signatures",
      formData,
      {
        headers: {
          Authorization: `Bearer ${getTokenFromSessionStorage().replace(/^"|"$/g, "")}`,
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error creating signature:", error);
    throw error;
  }
};
