import Constants from 'expo-constants';
import axios from 'axios';

const getBaseUrl = () => {
  // 1. Explicit override (from app.json extra.apiUrl)
  if (Constants.expoConfig?.extra?.apiUrl) {
    console.log('[BASE_URL] from extra.apiUrl');
    return Constants.expoConfig.extra.apiUrl as string;
  }

  // 2. Expo SDK 49+ (hostUri)
  const hostUri = Constants.expoConfig?.hostUri?.split(':')[0];
  if (hostUri) {
    console.log('[BASE_URL] from hostUri:', hostUri);
    return `http://${hostUri}:3001`;
  }

  // 3. Older Expo fallbacks
  const manifest2Host = (Constants as any).manifest2?.debuggerHost?.split(':')[0];
  if (manifest2Host) {
    console.log('[BASE_URL] from manifest2:', manifest2Host);
    return `http://${manifest2Host}:3001`;
  }

  const manifestHost = (Constants as any).manifest?.debuggerHost?.split(':')[0];
  if (manifestHost) {
    console.log('[BASE_URL] from manifest:', manifestHost);
    return `http://${manifestHost}:3001`;
  }

  // 4. Last resort
  console.log('[BASE_URL] fallback to localhost');
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
  const BASE_URL = getBaseUrl(); // evaluated at call time, not module load

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  try {
    console.log('API REQUEST:', { method, url: `${BASE_URL}${path}`, body });

    const response = await axios({
      method: method.toLowerCase() as any,
      url: `${BASE_URL}${path}`,
      headers,
      data: body,
      timeout: 15000,
    });

    console.log('API RESPONSE:', response.data);
    return response.data as T;
  } catch (error: any) {
    console.log('API ERROR FULL:', error);
    console.log('API ERROR MESSAGE:', error?.message);
    console.log('API ERROR RESPONSE:', error?.response?.data);
    throw error;
  }
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