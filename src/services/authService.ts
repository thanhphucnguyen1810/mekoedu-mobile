import AsyncStorage from '@react-native-async-storage/async-storage';

import { api } from './api';

// 1. Định nghĩa cấu trúc trả về từ Liferay
interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export const authService = {
  login: async (credentials: { username: string; password: string }) => {
    // 2. Ép kiểu (Cast) hoặc truyền Generic vào axios.post
    // api.post<LoginResponse>(...) sẽ giúp TypeScript hiểu response.data có gì
    const response = await api.post<LoginResponse>('/login', credentials)

    // 3. Bây giờ truy xuất qua .data
    const { token, user } = response.data;

    await AsyncStorage.setItem('liferay_token', token)
    return { token, user };
  },

  logout: async () => {
    await AsyncStorage.removeItem('liferay_token');
  },
}
