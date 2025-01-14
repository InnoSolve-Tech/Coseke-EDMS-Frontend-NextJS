import { AxiosInstance } from "@/components/routes/api";
import { Form } from "@/lib/types/forms";
import axios from "axios";

// Function to create a form
export async function createForm(formDto: Form): Promise<Form[]> {
  try {
    const response = await AxiosInstance.post("/forms/api/v1/forms", formDto);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

// Function to get all forms
export async function getAllForms(): Promise<any[]> {
  try {
    const response = await AxiosInstance.get("/forms/api/v1/forms");
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

// Function to get a form by ID
export async function getFormById(id: number): Promise<any> {
  try {
    const response = await AxiosInstance.get(`/forms/api/v1/forms/${id}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

// Function to update a form by ID
export async function updateForm(id: number, formDto: any): Promise<any> {
  try {
    const response = await AxiosInstance.put(
      `/forms/api/v1/forms/${id}`,
      formDto,
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

// Function to delete a form by ID
export async function deleteForm(id: number): Promise<void> {
  try {
    await AxiosInstance.delete(`/forms/api/v1/forms/${id}`);
  } catch (error) {
    throw handleApiError(error);
  }
}

// Utility function to handle API errors
function handleApiError(error: any): void {
  if (axios.isAxiosError(error)) {
    console.error("API Error:", error.response?.data || error.message);
  } else {
    console.error("Unexpected Error:", error);
  }
  throw error; // Re-throw the error to handle it in the calling code
}
