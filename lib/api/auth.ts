import apiClient from "../axios/client";

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  image: string;
}

export interface LoginCredentials { username: string; password: string; }

export const loginUser = async (credentials: LoginCredentials) => {
  const response = await apiClient.post<LoginResponse>("/auth/login", credentials);
  return response.data;
};
