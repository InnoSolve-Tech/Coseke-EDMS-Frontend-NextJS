import { AxiosInstance } from "@/components/routes/api";

export const findAllUsers = async () => {
  try {
    const response = await AxiosInstance.get("/api/v1/users");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Fetch a single user by ID
export const findUserById = async (id: number) => {
  try {
    const response = await AxiosInstance.get(`/api/v1/users/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create a new user
export const createUser = async (userData: any) => {
  try {
    const response = await AxiosInstance.post("/api/v1/users", userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Add a role to a user
export const addRoleToUser = async (userId: number, roleId: number) => {
  try {
    const response = await AxiosInstance.put(
      `/users/${userId}/roles/${roleId}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete a user by ID
export const deleteUser = async (id: number) => {
  try {
    const response = await AxiosInstance.delete(`/api/v1/users/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update a user's basic information
export const updateUser = async (id: number, updateData: any) => {
  try {
    const response = await AxiosInstance.put(`/api/v1/users/${id}`, {
      ...updateData,
      roles: updateData.roles.map((role: any) => role.id),
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update user roles
export const updateRoles = async (id: number, roles: any[]) => {
  try {
    const response = await AxiosInstance.put(
      `/api/v1/users/roles-update/${id}`,
      roles,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Forgot password request
export const forgotPassword = async (email: string) => {
  try {
    const response = await AxiosInstance.post(
      "/api/v1/users/forgot-password",
      null,
      {
        params: { email },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Reset password with token and new password
export const resetPassword = async (token: string, newPassword: string) => {
  try {
    const response = await AxiosInstance.post(
      "/api/v1/users/reset-password",
      null,
      {
        params: { token, newPassword },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update password with current and new password
export const updatePassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string,
) => {
  try {
    const response = await AxiosInstance.put(
      `/api/v1/users/update-password/${userId}`,
      null,
      {
        params: { currentPassword, newPassword },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
