import { AxiosInstance } from "@/components/routes/api";
import { Role, Permission } from "@/lib/types/user";

// Request and Response Types
interface MultipleUpdateRequest {
  permissions: Permission[];
  status: boolean;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

// Role API Functions
export const createRole = async (role: Role): Promise<ApiResponse<Role>> => {
  try {
    const response = await AxiosInstance.post<ApiResponse<Role>>(
      "api/v1/roles",
      role,
    );
    return response.data;
  } catch (error) {
    console.error("Error creating role:", error);
    throw error;
  }
};

export const listRoles = async (): Promise<ApiResponse<Role[]>> => {
  try {
    const response =
      await AxiosInstance.get<ApiResponse<Role[]>>("api/v1/roles");
    return response.data;
  } catch (error) {
    console.error("Error listing roles:", error);
    return { data: [], status: 500 };
  }
};

export const deleteRole = async (
  roleId: number,
): Promise<ApiResponse<void>> => {
  try {
    const response = await AxiosInstance.delete<ApiResponse<void>>(
      `api/v1/roles/${roleId}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting role:", error);
    throw error;
  }
};

export const addPermissionToRole = async (
  roleId: number,
  permissionId: number,
): Promise<ApiResponse<Role>> => {
  try {
    const response = await AxiosInstance.put<ApiResponse<Role>>(
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
): Promise<ApiResponse<Role>> => {
  try {
    const response = await AxiosInstance.put<ApiResponse<Role>>(
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
): Promise<ApiResponse<Role>> => {
  try {
    const response = await AxiosInstance.put<ApiResponse<Role>>(
      `api/v1/roles/${roleId}/update-permissions`,
      request,
    );
    return response.data;
  } catch (error) {
    console.error("Error updating multiple permissions:", error);
    throw error;
  }
};
