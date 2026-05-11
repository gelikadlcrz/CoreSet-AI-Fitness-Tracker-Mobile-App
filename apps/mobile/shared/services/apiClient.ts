import Constants from 'expo-constants';
import axios from 'axios';

const getBaseUrl = () => {
  if (Constants.expoConfig?.extra?.apiUrl) {
    return Constants.expoConfig.extra.apiUrl as string;
  }

  const hostUri = Constants.expoConfig?.hostUri?.split(':')[0];
  if (hostUri) return `http://${hostUri}:3001`;

  const manifest2Host = (Constants as any).manifest2?.debuggerHost?.split(':')[0];
  if (manifest2Host) return `http://${manifest2Host}:3001`;

  const manifestHost = (Constants as any).manifest?.debuggerHost?.split(':')[0];
  if (manifestHost) return `http://${manifestHost}:3001`;

  return 'http://localhost:3001';
};

let _token: string | null = null;

export const setAuthToken = (token: string | null) => {
  _token = token;
};

export const getAuthToken = () => _token;

export const restoreAuthToken = async (): Promise<string | null> => {
  return _token;
};

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<T> {
  const BASE_URL = getBaseUrl();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const response = await axios({
    method: method.toLowerCase() as any,
    url: `${BASE_URL}${path}`,
    headers,
    data: body,
    timeout: 15000,
  });

  return response.data as T;
}

export const apiClient = {
  get:    <T>(path: string)                => request<T>('GET',    path),
  post:   <T>(path: string, body: unknown) => request<T>('POST',   path, body),
  put:    <T>(path: string, body: unknown) => request<T>('PUT',    path, body),
  patch:  <T>(path: string, body: unknown) => request<T>('PATCH',  path, body),
  delete: <T>(path: string)               => request<T>('DELETE', path),
};

export const authApi = {
  register: (email: string, password: string, displayName: string) =>
    apiClient.post<{ user_id: string; email: string }>('/api/users/register', {
      email, password, displayName,
    }),

  login: (email: string, password: string) =>
    apiClient.post<{ user: { id: string; email: string; displayName: string }; token: string }>(
      '/api/users/login',
      { email, password },
    ),

  getProfile: () =>
    apiClient.get<{ user_id: string; email: string; display_name: string }>(
      '/api/users/profile',
    ),
};