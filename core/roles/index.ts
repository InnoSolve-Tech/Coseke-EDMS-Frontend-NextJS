import { AxiosInstance } from "@/components/routes/api";
import { Role, Permission } from "@/lib/types/user";
import exp from "constants";

// Request and Response Types
interface MultipleUpdateRequest {
  permissions: Permission[];
  status: boolean;
}

// Role API Functions
export const createRole = async (role: Role): Promise<Role> => {
  try {
    const response = await AxiosInstance.post<Role>("api/v1/roles", role);
    return response.data;
  } catch (error) {
    console.error("Error creating role:", error);
    throw error;
  }
};

export const listRoles = async (): Promise<Role[]> => {
  try {
    const response = await AxiosInstance.get<Role[]>("api/v1/roles");
    return response.data;
  } catch (error) {
    console.error("Error listing roles:", error);
    return [];
  }
};

export const deleteRole = async (roleId: number): Promise<void> => {
  try {
    const response = await AxiosInstance.delete<void>(`api/v1/roles/${roleId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting role:", error);
    throw error;
  }
};

export const addPermissionToRole = async (
  roleId: number,
  permissionId: number,
): Promise<Role> => {
  try {
    const response = await AxiosInstance.put<Role>(
      `api/v1/roles/${roleId}/add/${permissionId}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error adding permission to role:", error);
    throw error;
  }
};

export const removePermissionFromRole = async (
  roleId: number,
  permissionId: number,
): Promise<Role> => {
  try {
    const response = await AxiosInstance.put<Role>(
      `api/v1/roles/${roleId}/remove/${permissionId}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error removing permission from role:", error);
    throw error;
  }
};

export const updateMultiplePermissions = async (
  roleId: number,
  request: MultipleUpdateRequest,
): Promise<Role> => {
  try {
    const response = await AxiosInstance.put<Role>(
      `api/v1/roles/${roleId}/update-permissions`,
      request,
    );
    return response.data;
  } catch (error) {
    console.error("Error updating multiple permissions:", error);
    throw error;
  }
};

export const getAllPermissions = async (): Promise<Permission[]> => {
  try {
    const response =
      await AxiosInstance.get<Permission[]>("api/v1/permissions");
    return response.data;
  } catch (error) {
    console.error("Error listing permissions:", error);
    return [];
  }
};
