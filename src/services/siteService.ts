// src/services/siteService.ts
import { getUserToken } from './liferayService'; // SỬA import

class SiteService {
  private cachedSiteId: string | null = null;
  private baseURL = 'http://192.168.2.152:8080';

  // THÊM helper mới
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await getUserToken();
    if (!token) {
      throw new Error('User not authenticated. Please login first.');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    };
  }

  // SỬA apiRequest để dùng user token
  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = await this.getAuthHeaders();
    const url = `${this.baseURL}${endpoint}`;
    
    console.log(`🌐 API Request: ${endpoint}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    console.log(`📊 Response Status: ${response.status}`);

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`❌ API Error ${response.status}:`);
      console.error(`URL: ${endpoint}`);
      console.error(`Response: ${responseText.substring(0, 300)}`);
      throw new Error(`[API ${response.status}]`);
    }

    try {
      const jsonData = JSON.parse(responseText);
      return jsonData as T;
    } catch (e) {
      console.error(`❌ Invalid JSON response from ${endpoint}:`);
      console.error(responseText.substring(0, 300));
      throw new Error(`Invalid JSON response from server`);
    }
  }

  async getMySites() {
    try {
      const response = await this.apiRequest<{ items: any[] }>('/o/headless-admin-user/v1.0/my-user-account/sites');
      return response.items || [];
    } catch (error) {
      console.error('❌ Lỗi lấy danh sách sites:', error);
      return [];
    }
  }

  async getDefaultSiteId(): Promise<string> {
    if (this.cachedSiteId) {
      return this.cachedSiteId;
    }

    // Dùng site ID từ config
    const configSiteId = '20121';
    console.log(`📌 Using configured site ID: ${configSiteId}`);
    this.cachedSiteId = configSiteId;
    return configSiteId;
  }

  resetCache() {
    this.cachedSiteId = null;
  }
}

export const siteService = new SiteService();
