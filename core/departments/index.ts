import { AxiosInstance } from "@/components/routes/api";
import { getUserFromSessionStorage } from "@/components/routes/sessionStorage";
import Department from "@/lib/types/department";
import { User } from "@/lib/types/user";

// Function to create a department
export const createDepartment = async (department: Department) => {
  try {
    const response = await AxiosInstance.post(
      "departments/create-department",
      department,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Function to get all departments
export const assignDepartmentsFolders = async () => {
  try {
    const currentUser: User = getUserFromSessionStorage();
    const id = currentUser?.id;
    const response = await AxiosInstance.get(
      `departments/departmentById/${id}`,
    );
    console.log("Fetched departments data:", response.data); // Log data to check structure
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Function to get all departments
export const getAllDepartments = async () => {
  try {
    const response = await AxiosInstance.get(`departments/all`);
    console.log("Fetched departments data:", response.data); // Log data to check structure
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Function to update a department
export const updateDepartment = async (id: number, department: Department) => {
  try {
    const response = await AxiosInstance.put(`departments/${id}`, department);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Function to delete a department
export const deleteDepartment = async (id: number) => {
  try {
    await AxiosInstance.delete(`departments/${id}`);
  } catch (error) {
    throw error;
  }
};
