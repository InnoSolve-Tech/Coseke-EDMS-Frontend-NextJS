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

export const updateSessionStorage = (data: IUserDetails) => {
  addTokenToSessionStorage(data.token);
  addUserToSessionStorage(data);
};

export const clearSessionStorage = () => {
  sessionStorage.removeItem(accessToken);
  sessionStorage.removeItem(user);
};
