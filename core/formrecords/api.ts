import { AxiosInstance } from "@/components/routes/api";
import { FormRecord } from "@/lib/types/formRecords";

// Function to create a new form record (POST)
export const createFormRecord = async (formRecord: FormRecord) => {
  try {
    const response = await AxiosInstance.post(
      "/forms/api/v1/form-records",
      formRecord,
    );
    return response.data; // Return the saved form record
  } catch (error) {
    console.error("Error creating form record:", error);
    throw error;
  }
};

// Function to get all form records (GET)
export const getAllFormRecords = async () => {
  try {
    const response = await AxiosInstance.get("/forms/api/v1/form-records");
    return response.data; // Return the list of form records
  } catch (error) {
    console.error("Error fetching form records:", error);
    throw error;
  }
};

// Function to get form record by ID (GET)
export const getFormRecordById = async (id: number) => {
  try {
    const response = await AxiosInstance.get(
      `/forms/api/v1/form-records/${id}`,
    );
    return response.data; // Return the form record
  } catch (error) {
    console.error(`Error fetching form record with ID ${id}:`, error);
    throw error;
  }
};

// Function to get form record by ID (GET)
export const getFormRecordByForm = async (id: number) => {
  try {
    const response = await AxiosInstance.get(
      `/forms/api/v1/form-records/form/${id}`,
    );
    return response.data; // Return the form record
  } catch (error) {
    console.error(`Error fetching form record with Form ID ${id}:`, error);
    throw error;
  }
};

// Function to delete form record by ID (DELETE)
export const deleteFormRecord = async (id: number) => {
  try {
    const response = await AxiosInstance.delete(
      `/forms/api/v1/form-records/${id}`,
    );
    return response.status === 204; // Return true if deletion was successful
  } catch (error) {
    console.error(`Error deleting form record with ID ${id}:`, error);
    throw error;
  }
};

// Function to get form records by user ID (GET)
export const getFormRecordsByUserId = async (userId: number) => {
  try {
    const response = await AxiosInstance.get(
      `/forms/api/v1/form-records/user/${userId}`,
    );
    return response.data; // Return the list of form records for the user
  } catch (error) {
    console.error(`Error fetching form records for user ID ${userId}:`, error);
    throw error;
  }
};

// Function to update form record by ID (PUT)
export const updateFormRecord = async (formRecord: FormRecord) => {
  try {
    const response = await AxiosInstance.put(
      `/forms/api/v1/form-records/${formRecord.id}`,
      formRecord,
    );
    return response.data; // Return the updated form record
  } catch (error) {
    console.error(
      `Error updating form record with ID ${formRecord.id}:`,
      error,
    );
    throw error;
  }
};
