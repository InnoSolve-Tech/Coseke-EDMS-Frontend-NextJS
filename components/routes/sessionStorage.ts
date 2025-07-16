import { IUserDetails } from "../../core/authentication/interface";

const accessToken = "access-token";
const user = "current-user";

export const addTokenToSessionStorage = (token: string) => {
  sessionStorage.setItem(accessToken, JSON.stringify(token));
};

export const getTokenFromSessionStorage = (): string => {
  const token = sessionStorage.getItem(accessToken) as string;
  return token;
};

export const addUserToSessionStorage = (request: IUserDetails) => {
  sessionStorage.setItem(user, JSON.stringify(request));
};

export const getUserFromSessionStorage = () => {
  const response = sessionStorage.getItem(user);
  return JSON.parse(response || "{}");
};

// Permission checking utility
export const hasPermission = (
  userPermissions: string[],
  requiredPermissions?: string[],
): boolean => {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true; // No permissions required
  }

  // Check if user has at least one of the required permissions
  return requiredPermissions.some((permission) =>
    userPermissions.includes(permission),
  );
};

export const updateSessionStorage = (data: IUserDetails) => {
  addTokenToSessionStorage(data.token);
  addUserToSessionStorage(data);
};

export const clearSessionStorage = () => {
  sessionStorage.removeItem(accessToken);
  sessionStorage.removeItem(user);
};

// Extract user permissions from roles
export const getUserPermissions = (user: any): string[] => {
  if (!user.roles || !Array.isArray(user.roles)) {
    return [];
  }

  const permissions: string[] = [];
  user.roles.forEach((role: any) => {
    if (role.permissions && Array.isArray(role.permissions)) {
      role.permissions.forEach((permission: any) => {
        if (permission.name && !permissions.includes(permission.name)) {
          permissions.push(permission.name);
        }
      });
    }
  });

  return permissions;
};
